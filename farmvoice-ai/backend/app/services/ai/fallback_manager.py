"""FarmVoice AI - Multi-Provider Fallback Manager.

Orchestrates resilient AI response generation across primary and fallback
providers (Gemini -> Groq -> other configured providers) with bounded retries,
health tracking, temporary failure cooldowns, and error normalization.
Guarantees consistent prompt, language, farming context, and history across all providers.
"""

import logging
import time
from typing import Dict, Any, List, Tuple, Optional
import requests
from flask import current_app

from app.services.ai.provider_health import provider_health
from app.services.ai.retry_handler import RetryHandler

logger = logging.getLogger(__name__)


class FallbackManager:
    """Manages AI provider selection, failover chains, retries, and normalization."""

    @classmethod
    def get_configured_providers(cls) -> List[str]:
        """Return ordered, deduplicated list of available providers based on configuration."""
        cfg = current_app.config if current_app else {}

        primary = (
            cfg.get("AI_PRIMARY_PROVIDER")
            or cfg.get("AI_PROVIDER")
            or "gemini"
        ).lower().strip()

        fallback = (
            cfg.get("AI_FALLBACK_PROVIDER")
            or "groq"
        ).lower().strip()

        candidates = [primary, fallback]

        # Add other configured providers if credentials exist
        if cfg.get("OPENAI_API_KEY") and "openai" not in candidates:
            candidates.append("openai")
        if cfg.get("ANTHROPIC_API_KEY") and "anthropic" not in candidates:
            candidates.append("anthropic")
        if (cfg.get("AI_BASE_URL") or cfg.get("AI_PROVIDER") == "ollama") and "ollama" not in candidates:
            candidates.append("ollama")

        # Deduplicate preserving order
        deduped = []
        for p in candidates:
            if p and p not in deduped:
                deduped.append(p)
        return deduped

    @classmethod
    def get_provider_config(cls, provider: str) -> Dict[str, Any]:
        """Extract provider-specific credentials, model, timeout and parameters from Flask config."""
        cfg = current_app.config if current_app else {}
        timeout = int(
            cfg.get("AI_REQUEST_TIMEOUT")
            or cfg.get("AI_TIMEOUT_SECONDS")
            or 30
        )
        temperature = float(cfg.get("AI_TEMPERATURE", 0.4))
        max_tokens = int(cfg.get("AI_MAX_TOKENS", 1500))

        if provider == "gemini":
            raw_ai_key = cfg.get("AI_API_KEY")
            if raw_ai_key is not None and not str(raw_ai_key).strip():
                api_key = ""
            else:
                api_key = (
                    cfg.get("GEMINI_API_KEY")
                    or (cfg.get("AI_API_KEY") if cfg.get("AI_PROVIDER") in (None, "gemini") else "")
                    or ""
                ).strip()
            model = (
                cfg.get("GEMINI_MODEL")
                or cfg.get("AI_MODEL")
                or "gemini-1.5-flash"
            ).strip()
            return {
                "provider": "gemini",
                "api_key": api_key,
                "model": model,
                "temperature": temperature,
                "max_tokens": max_tokens,
                "timeout": timeout,
            }

        elif provider == "groq":
            api_key = (
                cfg.get("GROQ_API_KEY")
                or (cfg.get("AI_API_KEY") if cfg.get("AI_PROVIDER") == "groq" else "")
                or ""
            ).strip()
            model = (
                cfg.get("GROQ_MODEL")
                or "llama-3.3-70b-versatile"
            ).strip()
            return {
                "provider": "groq",
                "api_key": api_key,
                "model": model,
                "base_url": "https://api.groq.com/openai/v1",
                "temperature": temperature,
                "max_tokens": max_tokens,
                "timeout": timeout,
            }

        elif provider == "openai":
            api_key = (
                cfg.get("OPENAI_API_KEY")
                or (cfg.get("AI_API_KEY") if cfg.get("AI_PROVIDER") == "openai" else "")
                or ""
            ).strip()
            model = cfg.get("OPENAI_MODEL", "gpt-4o-mini").strip()
            return {
                "provider": "openai",
                "api_key": api_key,
                "model": model,
                "base_url": "https://api.openai.com/v1",
                "temperature": temperature,
                "max_tokens": max_tokens,
                "timeout": timeout,
            }

        elif provider == "anthropic":
            api_key = (
                cfg.get("ANTHROPIC_API_KEY")
                or (cfg.get("AI_API_KEY") if cfg.get("AI_PROVIDER") == "anthropic" else "")
                or ""
            ).strip()
            model = cfg.get("ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022").strip()
            return {
                "provider": "anthropic",
                "api_key": api_key,
                "model": model,
                "temperature": temperature,
                "max_tokens": max_tokens,
                "timeout": timeout,
            }

        elif provider == "ollama":
            base_url = (cfg.get("AI_BASE_URL") or "http://localhost:11434").strip()
            model = (cfg.get("AI_MODEL") or "llama3.2").strip()
            return {
                "provider": "ollama",
                "api_key": "",
                "model": model,
                "base_url": base_url,
                "temperature": temperature,
                "max_tokens": max_tokens,
                "timeout": timeout,
            }

        else:
            return {
                "provider": provider,
                "api_key": cfg.get("AI_API_KEY", "").strip(),
                "model": cfg.get("AI_MODEL", "").strip(),
                "base_url": cfg.get("AI_BASE_URL", "").strip(),
                "temperature": temperature,
                "max_tokens": max_tokens,
                "timeout": timeout,
            }

    @classmethod
    def generate_with_fallback(
        cls,
        system_prompt: str,
        user_prompt: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        max_retries: Optional[int] = None,
    ) -> Tuple[Dict[str, Any], int]:
        """Execute AI advisory generation with automatic failover across providers.

        Ensures:
        - Primary provider is called first with bounded retries on transient errors.
        - If primary fails (HTTP 503, 429, timeout, connection failure), falls back to secondary (Groq).
        - No circular recursion: visited providers tracked.
        - Same prompt, context, history, and language directives delivered to fallback.
        - Normalizes error response if all providers fail.
        """
        cfg = current_app.config if current_app else {}
        retries = (
            max_retries
            if max_retries is not None
            else int(cfg.get("AI_MAX_RETRIES", 2))
        )
        cooldown_sec = int(cfg.get("AI_COOLDOWN_SECONDS", 60))

        provider_chain = cls.get_configured_providers()
        attempted_providers: List[str] = []
        last_error_info: Dict[str, Any] = {}

        for provider in provider_chain:
            # Prevent duplicate calls in single turn
            if provider in attempted_providers:
                continue

            conf = cls.get_provider_config(provider)

            # Skip if API key is missing and provider is not local
            if not conf["api_key"] and provider not in ("ollama", "custom"):
                logger.info(
                    "Skipping provider '%s': No API key configured in backend/.env",
                    provider,
                )
                continue

            # Check health & temporary cooldown
            # If provider is currently in cooldown and fallback options exist, skip it
            if not provider_health.is_available(provider):
                remaining_candidates = [
                    p for p in provider_chain
                    if p not in attempted_providers and p != provider and provider_health.is_available(p)
                ]
                if remaining_candidates:
                    logger.warning(
                        "Provider '%s' is in temporary cooldown. Bypassing directly to next candidate: %s",
                        provider,
                        remaining_candidates[0],
                    )
                    continue
                else:
                    logger.info(
                        "Provider '%s' is in cooldown, but no alternative providers remain. Attempting probe request.",
                        provider,
                    )

            attempted_providers.append(provider)
            logger.info("Dispatching advisory request to provider '%s' (Model: %s)", provider, conf["model"])

            start_time = time.time()

            # Execute with bounded retries and exponential backoff
            def _call_current():
                return cls._dispatch_single_provider(conf, system_prompt, user_prompt, conversation_history or [])

            result, status = RetryHandler.execute_with_retry(
                call_fn=_call_current,
                max_retries=retries,
                provider_name=provider,
            )

            latency_ms = (time.time() - start_time) * 1000

            # Provider Succeeded
            if status == 200 and result.get("success"):
                provider_health.record_success(provider, latency_ms)
                result["latency_ms"] = round(latency_ms, 2)
                if len(attempted_providers) > 1:
                    logger.info(
                        "Advisory generated successfully via fallback provider '%s' (after failures on %s)",
                        provider,
                        attempted_providers[:-1],
                    )
                    result["fallback_used"] = True
                    result["primary_provider_failed"] = attempted_providers[0]
                return result, 200

            # Provider Failed
            err_category = result.get("error_type", f"HTTP_{status}")
            err_message = result.get("message", "Unknown error")
            provider_health.record_failure(
                provider_name=provider,
                error_category=err_category,
                error_message=err_message,
                cooldown_seconds=cooldown_sec,
            )

            last_error_info = {
                "provider": provider,
                "status": status,
                "error_type": err_category,
                "message": err_message,
            }

            logger.warning(
                "Provider '%s' failed (HTTP %d, type: %s). Checking next candidate in chain...",
                provider,
                status,
                err_category,
            )

        # All configured providers failed
        logger.error(
            "All AI providers in fallback chain failed. Attempted: %s. Last error: %s",
            attempted_providers,
            last_error_info,
        )

        # Normalized friendly failure response
        return {
            "success": False,
            "error_type": "AI_PROVIDER_UNAVAILABLE",
            "message": (
                "The AI assistant is temporarily busy or undergoing scheduled maintenance. "
                "Please try asking your question again in a moment."
            ),
            "details": {
                "attempted_providers": attempted_providers,
                "last_error_provider": last_error_info.get("provider"),
                "last_error_type": last_error_info.get("error_type"),
            },
        }, 503

    @classmethod
    def _dispatch_single_provider(
        cls,
        conf: Dict[str, Any],
        system_prompt: str,
        user_prompt: str,
        history: List[Dict[str, str]],
    ) -> Tuple[Dict[str, Any], int]:
        """Dispatch call to the appropriate single provider implementation."""
        provider = conf["provider"]

        if provider == "gemini":
            return cls._call_gemini_raw(conf, system_prompt, user_prompt, history)
        elif provider in ("groq", "openai", "custom"):
            return cls._call_openai_compatible_raw(conf, system_prompt, user_prompt, history)
        elif provider == "anthropic":
            return cls._call_anthropic_raw(conf, system_prompt, user_prompt, history)
        elif provider == "ollama":
            return cls._call_ollama_raw(conf, system_prompt, user_prompt, history)
        else:
            return {
                "success": False,
                "error_type": "UNSUPPORTED_PROVIDER",
                "message": f"Unsupported AI provider '{provider}'",
            }, 400

    # -------------------------------------------------------------------------
    # GOOGLE GEMINI (generateContent REST API)
    # -------------------------------------------------------------------------
    @classmethod
    def _call_gemini_raw(
        cls,
        conf: Dict[str, Any],
        system_prompt: str,
        user_prompt: str,
        history: List[Dict[str, str]],
    ) -> Tuple[Dict[str, Any], int]:
        """Execute Google Gemini API request."""
        model = conf["model"] or "gemini-1.5-flash"
        api_key = conf["api_key"]

        endpoint = (
            f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
        )
        headers = {
            "Content-Type": "application/json",
            "x-goog-api-key": api_key,
        }

        contents = []
        for item in history[-6:]:
            role = "user" if item.get("role") == "user" else "model"
            msg = item.get("message", "")
            if msg:
                contents.append({"role": role, "parts": [{"text": msg}]})

        contents.append({"role": "user", "parts": [{"text": user_prompt}]})

        payload = {
            "systemInstruction": {"parts": [{"text": system_prompt}]},
            "contents": contents,
            "generationConfig": {
                "temperature": conf["temperature"],
                "maxOutputTokens": conf["max_tokens"],
            },
        }

        try:
            response = requests.post(
                endpoint,
                headers=headers,
                json=payload,
                timeout=conf["timeout"],
            )
        except requests.exceptions.Timeout:
            return {
                "success": False,
                "error_type": "TIMEOUT",
                "message": f"Gemini model '{model}' timed out after {conf['timeout']}s.",
            }, 504
        except requests.exceptions.ConnectionError:
            return {
                "success": False,
                "error_type": "NETWORK_ERROR",
                "message": "Connection to Google Gemini API failed.",
            }, 502

        if response.status_code == 200:
            data = response.json()
            candidates = data.get("candidates", [])
            if not candidates:
                return {
                    "success": False,
                    "error_type": "EMPTY_RESPONSE",
                    "message": "Gemini returned no candidates.",
                }, 502

            parts = candidates[0].get("content", {}).get("parts", [])
            text = "\n".join(p.get("text", "") for p in parts if p.get("text")).strip()

            if not text:
                return {
                    "success": False,
                    "error_type": "EMPTY_RESPONSE",
                    "message": "Gemini returned empty text.",
                }, 502

            return {
                "success": True,
                "text": text,
                "provider": "gemini",
                "model": model,
            }, 200

        # Parse Gemini API error
        error_msg = f"HTTP {response.status_code}"
        error_type = "API_ERROR"
        try:
            err_json = response.json().get("error", {})
            error_msg = err_json.get("message", error_msg)
            status_str = err_json.get("status", "")
            if response.status_code == 503 or status_str == "UNAVAILABLE":
                error_type = "SERVICE_UNAVAILABLE"
            elif response.status_code == 429 or status_str == "RESOURCE_EXHAUSTED":
                error_type = "RATE_LIMITED"
            elif response.status_code in (401, 403):
                error_type = "AUTH_ERROR"
            elif response.status_code == 404:
                error_type = "MODEL_NOT_FOUND"
        except Exception:
            pass

        return {
            "success": False,
            "error_type": error_type,
            "message": f"Gemini error: {error_msg}",
            "status_code": response.status_code,
        }, response.status_code

    # -------------------------------------------------------------------------
    # GROQ / OPENAI / COMPATIBLE (Chat Completions REST API)
    # -------------------------------------------------------------------------
    @classmethod
    def _call_openai_compatible_raw(
        cls,
        conf: Dict[str, Any],
        system_prompt: str,
        user_prompt: str,
        history: List[Dict[str, str]],
    ) -> Tuple[Dict[str, Any], int]:
        """Execute OpenAI-compatible request (used by Groq, OpenAI, and compatible endpoints)."""
        provider = conf["provider"]
        model = conf["model"]
        api_key = conf["api_key"]
        base_url = conf.get("base_url") or (
            "https://api.groq.com/openai/v1" if provider == "groq" else "https://api.openai.com/v1"
        )
        endpoint = f"{base_url.rstrip('/')}/chat/completions"

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

        messages = [{"role": "system", "content": system_prompt}]
        for item in history[-6:]:
            role = "user" if item.get("role") == "user" else "assistant"
            messages.append({"role": role, "content": item.get("message", "")})
        messages.append({"role": "user", "content": user_prompt})

        payload = {
            "model": model,
            "messages": messages,
            "temperature": conf["temperature"],
            "max_tokens": conf["max_tokens"],
        }

        try:
            response = requests.post(
                endpoint,
                json=payload,
                headers=headers,
                timeout=conf["timeout"],
            )
        except requests.exceptions.Timeout:
            return {
                "success": False,
                "error_type": "TIMEOUT",
                "message": f"Provider '{provider}' request timed out after {conf['timeout']}s.",
            }, 504
        except requests.exceptions.ConnectionError:
            return {
                "success": False,
                "error_type": "NETWORK_ERROR",
                "message": f"Connection to '{provider}' failed.",
            }, 502

        if response.status_code == 200:
            data = response.json()
            choices = data.get("choices", [])
            if choices:
                text = choices[0].get("message", {}).get("content", "").strip()
                if text:
                    return {
                        "success": True,
                        "text": text,
                        "provider": provider,
                        "model": model,
                    }, 200

            return {
                "success": False,
                "error_type": "EMPTY_RESPONSE",
                "message": f"Empty response received from '{provider}'.",
            }, 502

        # Error handling for Groq / OpenAI
        error_type = "API_ERROR"
        if response.status_code == 503:
            error_type = "SERVICE_UNAVAILABLE"
        elif response.status_code == 429:
            error_type = "RATE_LIMITED"
        elif response.status_code in (401, 403):
            error_type = "AUTH_ERROR"
        elif response.status_code == 404:
            error_type = "MODEL_NOT_FOUND"

        try:
            err_data = response.json().get("error", {})
            err_msg = err_data.get("message", f"HTTP {response.status_code}")
        except Exception:
            err_msg = response.text[:200]

        return {
            "success": False,
            "error_type": error_type,
            "message": f"{provider} error: {err_msg}",
            "status_code": response.status_code,
        }, response.status_code

    # -------------------------------------------------------------------------
    # ANTHROPIC CLAUDE
    # -------------------------------------------------------------------------
    @classmethod
    def _call_anthropic_raw(
        cls,
        conf: Dict[str, Any],
        system_prompt: str,
        user_prompt: str,
        history: List[Dict[str, str]],
    ) -> Tuple[Dict[str, Any], int]:
        """Execute Anthropic Claude API request."""
        model = conf["model"] or "claude-3-5-sonnet-20241022"
        endpoint = "https://api.anthropic.com/v1/messages"
        headers = {
            "x-api-key": conf["api_key"],
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
        }

        messages = []
        for item in history[-6:]:
            role = "user" if item.get("role") == "user" else "assistant"
            messages.append({"role": role, "content": item.get("message", "")})
        messages.append({"role": "user", "content": user_prompt})

        payload = {
            "model": model,
            "system": system_prompt,
            "messages": messages,
            "max_tokens": conf["max_tokens"],
            "temperature": conf["temperature"],
        }

        try:
            response = requests.post(
                endpoint,
                json=payload,
                headers=headers,
                timeout=conf["timeout"],
            )
        except requests.exceptions.Timeout:
            return {"success": False, "error_type": "TIMEOUT", "message": "Claude timed out."}, 504
        except requests.exceptions.ConnectionError:
            return {"success": False, "error_type": "NETWORK_ERROR", "message": "Connection to Anthropic failed."}, 502

        if response.status_code == 200:
            data = response.json()
            contents = data.get("content", [])
            if contents:
                return {
                    "success": True,
                    "text": contents[0].get("text", "").strip(),
                    "provider": "anthropic",
                    "model": model,
                }, 200
            return {"success": False, "error_type": "EMPTY_RESPONSE", "message": "Empty response from Claude."}, 502

        error_type = "RATE_LIMITED" if response.status_code == 429 else ("SERVICE_UNAVAILABLE" if response.status_code == 503 else "API_ERROR")
        return {
            "success": False,
            "error_type": error_type,
            "message": f"Anthropic error (HTTP {response.status_code})",
        }, response.status_code

    # -------------------------------------------------------------------------
    # LOCAL OLLAMA
    # -------------------------------------------------------------------------
    @classmethod
    def _call_ollama_raw(
        cls,
        conf: Dict[str, Any],
        system_prompt: str,
        user_prompt: str,
        history: List[Dict[str, str]],
    ) -> Tuple[Dict[str, Any], int]:
        """Execute local Ollama API request."""
        base = conf.get("base_url") or "http://localhost:11434"
        endpoint = f"{base.rstrip('/')}/api/chat"
        model = conf["model"] or "llama3.2"

        messages = [{"role": "system", "content": system_prompt}]
        for item in history[-6:]:
            role = "user" if item.get("role") == "user" else "assistant"
            messages.append({"role": role, "content": item.get("message", "")})
        messages.append({"role": "user", "content": user_prompt})

        payload = {
            "model": model,
            "messages": messages,
            "stream": False,
            "options": {"temperature": conf["temperature"]},
        }

        try:
            response = requests.post(endpoint, json=payload, timeout=conf["timeout"])
        except Exception as e:
            return {"success": False, "error_type": "OLLAMA_ERROR", "message": f"Ollama connection error: {str(e)}"}, 502

        if response.status_code == 200:
            data = response.json()
            text = data.get("message", {}).get("content", "").strip()
            return {"success": True, "text": text, "provider": "ollama", "model": model}, 200

        return {"success": False, "error_type": "OLLAMA_ERROR", "message": f"Ollama error (HTTP {response.status_code})"}, 502
