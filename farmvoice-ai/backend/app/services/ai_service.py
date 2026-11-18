
"""FarmVoice AI - Reusable Multi-Provider AI Service Layer with Fallback & Reliability."""

import logging
import requests
from flask import current_app
from app.utils.ai_prompt_builder import AIPromptBuilder
from app.services.ai.fallback_manager import FallbackManager
from app.services.ai.provider_health import provider_health

logger = logging.getLogger(__name__)


class AIService:
    """Core AI abstraction service connecting to external LLM providers with automatic fallback."""

    @classmethod
    def get_config(cls):
        """Read active AI settings from Flask configuration."""
        cfg = current_app.config if current_app else {}

        primary_provider = (
            cfg.get("AI_PRIMARY_PROVIDER")
            or cfg.get("AI_PROVIDER")
            or "gemini"
        ).lower().strip()

        fallback_provider = (
            cfg.get("AI_FALLBACK_PROVIDER")
            or "groq"
        ).lower().strip()

        # Respect explicit clearing of AI_API_KEY in unit tests
        raw_ai_key = cfg.get("AI_API_KEY")
        if raw_ai_key is not None and not str(raw_ai_key).strip():
            gemini_key = ""
            legacy_key = ""
        else:
            gemini_key = (
                cfg.get("GEMINI_API_KEY")
                or cfg.get("AI_API_KEY")
                or ""
            ).strip()
            legacy_key = gemini_key

        gemini_model = (
            cfg.get("GEMINI_MODEL")
            or cfg.get("AI_MODEL")
            or "gemini-1.5-flash"
        ).strip()

        groq_key = cfg.get("GROQ_API_KEY", "").strip()
        groq_model = cfg.get("GROQ_MODEL", "llama-3.3-70b-versatile").strip()

        return {
            "provider": primary_provider,
            "primary_provider": primary_provider,
            "fallback_provider": fallback_provider,
            "api_key": legacy_key,
            "model": gemini_model,
            "gemini_api_key": gemini_key,
            "gemini_model": gemini_model,
            "groq_api_key": groq_key,
            "groq_model": groq_model,
            "temperature": float(cfg.get("AI_TEMPERATURE", 0.4)),
            "max_tokens": int(cfg.get("AI_MAX_TOKENS", 1500)),
            "timeout": int(cfg.get("AI_REQUEST_TIMEOUT", cfg.get("AI_TIMEOUT_SECONDS", 30))),
            "base_url": cfg.get("AI_BASE_URL", "").strip(),
            "max_retries": int(cfg.get("AI_MAX_RETRIES", 2)),
            "cooldown_seconds": int(cfg.get("AI_COOLDOWN_SECONDS", 60)),
        }

    @classmethod
    def check_health(cls):
        """Check operational status of AI providers and fallback chain."""
        conf = cls.get_config()

        has_gemini = bool(conf["gemini_api_key"])
        has_groq = bool(conf["groq_api_key"])
        has_legacy = bool(conf["api_key"])
        is_local = conf["provider"] in ("ollama", "custom")

        ready = has_gemini or has_groq or has_legacy or is_local

        health_summary = provider_health.get_health_summary()

        return {
            "provider": conf["provider"],
            "primary_provider": conf["primary_provider"],
            "fallback_provider": conf["fallback_provider"],
            "model": conf["model"],
            "configured": ready,
            "has_api_key": has_gemini or has_groq or has_legacy,
            "has_gemini_key": has_gemini,
            "has_groq_key": has_groq,
            "status": "ready" if ready else "unconfigured",
            "message": (
                "AI service is operational with multi-provider resilience."
                if ready
                else "AI service requires an API key in backend/.env."
            ),
            "providers": health_summary,
        }

    @classmethod
    def generate_response(
        cls,
        question,
        context_str="",
        language_code="en",
        dialect_code="standard",
        conversation_history=None,
    ):
        """Generate an AI response with multi-provider fallback and bounded retry reliability."""
        conf = cls.get_config()
        has_key = bool(conf["gemini_api_key"] or conf["groq_api_key"] or conf["api_key"])
        is_local = conf["provider"] in ("ollama", "custom")

        if not has_key and not is_local:
            return {
                "success": False,
                "error_type": "MISSING_API_KEY",
                "message": "AI_API_KEY is missing from backend/.env.",
                "configured": False,
            }, 503

        system_prompt = AIPromptBuilder.build_system_prompt(language_code, dialect_code)

        user_prompt = AIPromptBuilder.build_user_prompt(
            context_str,
            question,
            language_code,
            dialect_code,
        )

        history = conversation_history or []

        # Delegate execution to FallbackManager with bounded retries and cooldown tracking
        return FallbackManager.generate_with_fallback(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            conversation_history=history,
            max_retries=conf.get("max_retries", 2),
        )

    # ---------------------------------------------------------
    # GOOGLE GEMINI
    # ---------------------------------------------------------

    @classmethod
    def _call_gemini(cls, conf, system_prompt, user_prompt, history):
        """Call Google Gemini REST generateContent endpoint."""

        model = conf["model"] or "gemini-3.5-flash"
        api_key = conf["api_key"]

        endpoint = (
            "https://generativelanguage.googleapis.com/"
            f"v1beta/models/{model}:generateContent"
        )

        headers = {
            "Content-Type": "application/json",
            "x-goog-api-key": api_key,
        }

        contents = []

        for item in history[-6:]:
            role = (
                "user"
                if item.get("role") == "user"
                else "model"
            )

            message = item.get("message", "")

            if message:
                contents.append({
                    "role": role,
                    "parts": [{"text": message}],
                })

        contents.append({
            "role": "user",
            "parts": [{"text": user_prompt}],
        })

        payload = {
            "systemInstruction": {
                "parts": [{"text": system_prompt}],
            },
            "contents": contents,
            "generationConfig": {
                "temperature": conf["temperature"],
                "maxOutputTokens": conf["max_tokens"],
            },
        }

        logger.info(
            "Calling Gemini | Model: %s | generateContent",
            model,
        )

        response = requests.post(
            endpoint,
            headers=headers,
            json=payload,
            timeout=conf["timeout"],
        )

        if response.status_code == 200:
            data = response.json()
            candidates = data.get("candidates", [])

            if not candidates:
                logger.warning(
                    "Gemini returned no candidates: %s",
                    data.get("promptFeedback", {}),
                )

                return {
                    "success": False,
                    "error_type": "EMPTY_RESPONSE",
                    "message": (
                        "The AI could not generate a response. "
                        "Please rephrase your question."
                    ),
                }, 502

            candidate = candidates[0]

            parts = candidate.get(
                "content", {}
            ).get("parts", [])

            text = "\n".join(
                part.get("text", "")
                for part in parts
                if part.get("text")
            ).strip()

            if not text:
                return {
                    "success": False,
                    "error_type": "EMPTY_RESPONSE",
                    "message": "Gemini returned an empty response.",
                }, 502

            return {
                "success": True,
                "text": text,
                "provider": "gemini",
                "model": model,
            }, 200

        # Safely parse API errors.
        try:
            error_data = response.json().get("error", {})
            error_message = error_data.get(
                "message", "Unknown Gemini API error"
            )
            error_status = error_data.get("status", "UNKNOWN")

        except ValueError:
            error_message = "Invalid Gemini API error response."
            error_status = "UNKNOWN"

        logger.error(
            "Gemini API error | HTTP: %s | Status: %s | Model: %s | Message: %s",
            response.status_code,
            error_status,
            model,
            error_message[:500],
        )

        if response.status_code in (401, 403):
            return {
                "success": False,
                "error_type": "AUTH_ERROR",
                "message": "Gemini API authentication failed.",
            }, 502

        if response.status_code == 404:
            return {
                "success": False,
                "error_type": "MODEL_NOT_FOUND",
                "message": (
                    f"Gemini model '{model}' was not found "
                    "or does not support generateContent."
                ),
            }, 502

        if response.status_code == 429:
            return {
                "success": False,
                "error_type": "RATE_LIMITED",
                "message": "Gemini usage limit reached. Try again later.",
            }, 429

        return {
            "success": False,
            "error_type": "API_ERROR",
            "message": (
                f"Gemini API returned HTTP {response.status_code}: "
                f"{error_message[:250]}"
            ),
        }, 502

    # ---------------------------------------------------------
    # OPENAI / GROQ / CUSTOM
    # ---------------------------------------------------------

    @classmethod
    def _call_openai_compatible(
        cls, conf, system_prompt, user_prompt, history
    ):
        """Call OpenAI-compatible chat completions APIs."""

        provider = conf["provider"]
        model = conf["model"]
        api_key = conf["api_key"]

        if conf["base_url"]:
            endpoint = (
                f"{conf['base_url'].rstrip('/')}/chat/completions"
            )

        elif provider == "groq":
            endpoint = (
                "https://api.groq.com/openai/v1/chat/completions"
            )

            if not model or model.startswith("gemini"):
                model = "llama-3.3-70b-versatile"

        else:
            endpoint = (
                "https://api.openai.com/v1/chat/completions"
            )

            if not model or model.startswith("gemini"):
                model = "gpt-4o-mini"

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

        messages = [
            {"role": "system", "content": system_prompt}
        ]

        for item in history[-6:]:
            role = (
                "user"
                if item.get("role") == "user"
                else "assistant"
            )

            messages.append({
                "role": role,
                "content": item.get("message", ""),
            })

        messages.append({
            "role": "user",
            "content": user_prompt,
        })

        payload = {
            "model": model,
            "messages": messages,
            "temperature": conf["temperature"],
            "max_tokens": conf["max_tokens"],
        }

        response = requests.post(
            endpoint,
            json=payload,
            headers=headers,
            timeout=conf["timeout"],
        )

        if response.status_code == 200:
            data = response.json()
            choices = data.get("choices", [])

            if choices:
                text = (
                    choices[0]
                    .get("message", {})
                    .get("content", "")
                )

                return {
                    "success": True,
                    "text": text,
                    "provider": provider,
                    "model": model,
                }, 200

            return {
                "success": False,
                "error_type": "EMPTY_RESPONSE",
                "message": "AI provider returned an empty response.",
            }, 502

        logger.error(
            "%s API error: HTTP %s",
            provider,
            response.status_code,
        )

        return {
            "success": False,
            "error_type": "API_ERROR",
            "message": (
                f"AI provider error (HTTP {response.status_code})."
            ),
        }, 502

    # ---------------------------------------------------------
    # ANTHROPIC CLAUDE
    # ---------------------------------------------------------

    @classmethod
    def _call_anthropic(
        cls, conf, system_prompt, user_prompt, history
    ):
        """Call Anthropic Claude messages endpoint."""

        model = conf["model"]

        if not model or not model.startswith("claude"):
            model = "claude-3-5-sonnet-20241022"

        endpoint = "https://api.anthropic.com/v1/messages"

        headers = {
            "x-api-key": conf["api_key"],
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
        }

        messages = []

        for item in history[-6:]:
            role = (
                "user"
                if item.get("role") == "user"
                else "assistant"
            )

            messages.append({
                "role": role,
                "content": item.get("message", ""),
            })

        messages.append({
            "role": "user",
            "content": user_prompt,
        })

        payload = {
            "model": model,
            "system": system_prompt,
            "messages": messages,
            "max_tokens": conf["max_tokens"],
            "temperature": conf["temperature"],
        }

        response = requests.post(
            endpoint,
            json=payload,
            headers=headers,
            timeout=conf["timeout"],
        )

        if response.status_code == 200:
            data = response.json()
            contents = data.get("content", [])

            if contents:
                return {
                    "success": True,
                    "text": contents[0].get("text", ""),
                    "provider": "anthropic",
                    "model": model,
                }, 200

            return {
                "success": False,
                "error_type": "EMPTY_RESPONSE",
                "message": "Empty response from Claude.",
            }, 502

        return {
            "success": False,
            "error_type": "API_ERROR",
            "message": (
                f"Anthropic API error (HTTP {response.status_code})."
            ),
        }, 502

    # ---------------------------------------------------------
    # LOCAL OLLAMA
    # ---------------------------------------------------------

    @classmethod
    def _call_ollama(
        cls, conf, system_prompt, user_prompt, history
    ):
        """Call local Ollama server."""

        base = conf["base_url"] or "http://localhost:11434"
        endpoint = f"{base.rstrip('/')}/api/chat"
        model = conf["model"] or "llama3.2"

        messages = [
            {"role": "system", "content": system_prompt}
        ]

        for item in history[-6:]:
            role = (
                "user"
                if item.get("role") == "user"
                else "assistant"
            )

            messages.append({
                "role": role,
                "content": item.get("message", ""),
            })

        messages.append({
            "role": "user",
            "content": user_prompt,
        })

        payload = {
            "model": model,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": conf["temperature"],
            },
        }

        response = requests.post(
            endpoint,
            json=payload,
            timeout=conf["timeout"],
        )

        if response.status_code == 200:
            data = response.json()

            return {
                "success": True,
                "text": data.get("message", {}).get("content", ""),
                "provider": "ollama",
                "model": model,
            }, 200

        return {
            "success": False,
            "error_type": "OLLAMA_ERROR",
            "message": (
                f"Ollama local error (HTTP {response.status_code})."
            ),
        }, 502
