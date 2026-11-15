"""FarmVoice AI - Reusable Multi-Provider AI Service Layer.

Supports Google Gemini, OpenAI, Groq, Anthropic Claude, and local Ollama
with configurable temperature, token limits, timeouts, robust error
handling, and zero credential leakage.
"""

import logging
import requests
from flask import current_app
from app.utils.ai_prompt_builder import AIPromptBuilder

logger = logging.getLogger(__name__)


class AIService:
    """Core AI abstraction service connecting to external LLM providers."""

    @classmethod
    def get_config(cls):
        """Read active AI settings from Flask configuration."""
        cfg = current_app.config
        return {
            "provider": cfg.get("AI_PROVIDER", "gemini").lower().strip(),
            "api_key": cfg.get("AI_API_KEY", "").strip(),
            "model": cfg.get("AI_MODEL", "gemini-1.5-flash").strip(),
            "temperature": float(cfg.get("AI_TEMPERATURE", 0.4)),
            "max_tokens": int(cfg.get("AI_MAX_TOKENS", 1500)),
            "timeout": int(cfg.get("AI_TIMEOUT_SECONDS", 30)),
            "base_url": cfg.get("AI_BASE_URL", "").strip(),
        }

    @classmethod
    def check_health(cls):
        """Check the status and configuration readiness of the AI service."""
        conf = cls.get_config()
        has_key = bool(conf["api_key"])
        is_local = conf["provider"] in ("ollama", "custom")
        ready = has_key or is_local

        return {
            "provider": conf["provider"],
            "model": conf["model"],
            "configured": ready,
            "has_api_key": has_key,
            "status": "ready" if ready else "unconfigured",
            "message": (
                "AI service is operational."
                if ready
                else "AI service requires an API key in backend/.env (AI_API_KEY)."
            ),
        }

    @classmethod
    def generate_response(
        cls, question, context_str="", language_code="en", conversation_history=None
    ):
        """Send prompt to the configured AI provider and return the response text.

        Returns a tuple of (result_dict, status_code).
        result_dict contains:
            { "success": True, "text": "...", "provider": "...", "model": "..." }
            or
            { "success": False, "message": "...", "error_type": "..." }
        """
        conf = cls.get_config()
        provider = conf["provider"]
        api_key = conf["api_key"]

        # Validate configuration
        if not api_key and provider not in ("ollama", "custom"):
            return {
                "success": False,
                "error_type": "MISSING_API_KEY",
                "message": (
                    "AI Assistant is currently unconfigured. To activate intelligent regional guidance, "
                    "please set AI_API_KEY (e.g. from Google AI Studio or OpenAI) in backend/.env."
                ),
                "configured": False,
            }, 503

        # Prepare localized prompt
        system_prompt = AIPromptBuilder.build_system_prompt(language_code)
        user_prompt = AIPromptBuilder.build_user_prompt(context_str, question, language_code)

        history = conversation_history or []

        try:
            if provider == "gemini":
                return cls._call_gemini(conf, system_prompt, user_prompt, history)
            elif provider in ("openai", "groq", "custom"):
                return cls._call_openai_compatible(conf, system_prompt, user_prompt, history)
            elif provider == "anthropic":
                return cls._call_anthropic(conf, system_prompt, user_prompt, history)
            elif provider == "ollama":
                return cls._call_ollama(conf, system_prompt, user_prompt, history)
            else:
                # Default to Gemini if unrecognized
                return cls._call_gemini(conf, system_prompt, user_prompt, history)

        except requests.exceptions.Timeout:
            logger.error("AI Provider (%s) request timed out after %ds", provider, conf["timeout"])
            return {
                "success": False,
                "error_type": "TIMEOUT",
                "message": (
                    "The AI service timed out while generating your agricultural guidance. "
                    "Please check your network and try asking again."
                ),
            }, 504

        except requests.exceptions.ConnectionError:
            logger.error("AI Provider (%s) network connection failed", provider)
            return {
                "success": False,
                "error_type": "NETWORK_ERROR",
                "message": (
                    "Unable to reach the AI service. Please verify your internet connection "
                    "or verify that the AI service endpoint is accessible."
                ),
            }, 502

        except Exception as e:
            logger.exception("Unexpected error in AI service: %s", str(e))
            return {
                "success": False,
                "error_type": "AI_SERVICE_ERROR",
                "message": (
                    "An error occurred while generating your farming advisory. "
                    "Please try again in a few moments."
                ),
            }, 500

    @classmethod
    def _call_gemini(cls, conf, system_prompt, user_prompt, history):
        """Call Google Gemini REST generateContent endpoint."""
        model = conf["model"] or "gemini-1.5-flash"
        api_key = conf["api_key"]
        endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"

        # Construct Gemini contents list with conversation history
        contents = []

        # Add recent conversation history turns (up to 6 prior turns for context)
        for h in history[-6:]:
            role = "user" if h.get("role") == "user" else "model"
            msg = h.get("message", "")
            if msg:
                contents.append({"role": role, "parts": [{"text": msg}]})

        # Append current user prompt
        contents.append({"role": "user", "parts": [{"text": user_prompt}]})

        payload = {
            "systemInstruction": {
                "parts": [{"text": system_prompt}]
            },
            "contents": contents,
            "generationConfig": {
                "temperature": conf["temperature"],
                "maxOutputTokens": conf["max_tokens"],
            },
        }

        resp = requests.post(endpoint, json=payload, timeout=conf["timeout"])

        if resp.status_code == 200:
            data = resp.json()
            try:
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        text = parts[0].get("text", "")
                        return {
                            "success": True,
                            "text": text,
                            "provider": "gemini",
                            "model": model,
                        }, 200
                return {
                    "success": False,
                    "error_type": "EMPTY_RESPONSE",
                    "message": "The AI provider returned an empty response. Please rephrase your question.",
                }, 502
            except Exception as e:
                logger.error("Error parsing Gemini response: %s", e)
                return {
                    "success": False,
                    "error_type": "PARSE_ERROR",
                    "message": "Failed to parse advisory response from AI provider.",
                }, 502

        if resp.status_code == 429:
            return {
                "success": False,
                "error_type": "RATE_LIMITED",
                "message": "The AI service is experiencing high traffic. Please wait a few seconds and try again.",
            }, 429

        if resp.status_code in (401, 403):
            logger.error("Gemini authentication failed (status %d)", resp.status_code)
            return {
                "success": False,
                "error_type": "AUTH_ERROR",
                "message": "AI API Key authentication failed. Please verify your AI_API_KEY in backend/.env.",
            }, 502

        # Other API errors
        err_detail = resp.text[:200]
        logger.error("Gemini API error %d: %s", resp.status_code, err_detail)
        return {
            "success": False,
            "error_type": "API_ERROR",
            "message": f"AI provider error (HTTP {resp.status_code}). Please try again later.",
        }, 502

    @classmethod
    def _call_openai_compatible(cls, conf, system_prompt, user_prompt, history):
        """Call OpenAI, Groq, or OpenAI-compatible chat completions endpoint."""
        provider = conf["provider"]
        model = conf["model"]
        api_key = conf["api_key"]

        if conf["base_url"]:
            endpoint = f"{conf['base_url'].rstrip('/')}/chat/completions"
        elif provider == "groq":
            endpoint = "https://api.groq.com/openai/v1/chat/completions"
            if not model or model.startswith("gemini"):
                model = "llama-3.3-70b-versatile"
        else:
            endpoint = "https://api.openai.com/v1/chat/completions"
            if not model or model.startswith("gemini"):
                model = "gpt-4o-mini"

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

        messages = [{"role": "system", "content": system_prompt}]
        for h in history[-6:]:
            role = "user" if h.get("role") == "user" else "assistant"
            messages.append({"role": role, "content": h.get("message", "")})
        messages.append({"role": "user", "content": user_prompt})

        payload = {
            "model": model,
            "messages": messages,
            "temperature": conf["temperature"],
            "max_tokens": conf["max_tokens"],
        }

        resp = requests.post(endpoint, json=payload, headers=headers, timeout=conf["timeout"])

        if resp.status_code == 200:
            data = resp.json()
            choices = data.get("choices", [])
            if choices:
                text = choices[0].get("message", {}).get("content", "")
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

        if resp.status_code == 429:
            return {
                "success": False,
                "error_type": "RATE_LIMITED",
                "message": "Rate limit exceeded. Please wait a moment and try again.",
            }, 429

        if resp.status_code in (401, 403):
            return {
                "success": False,
                "error_type": "AUTH_ERROR",
                "message": "AI API Key authentication failed. Please verify your AI_API_KEY in backend/.env.",
            }, 502

        logger.error("OpenAI-compatible API error %d: %s", resp.status_code, resp.text[:200])
        return {
            "success": False,
            "error_type": "API_ERROR",
            "message": f"AI provider error (HTTP {resp.status_code}). Please try again later.",
        }, 502

    @classmethod
    def _call_anthropic(cls, conf, system_prompt, user_prompt, history):
        """Call Anthropic Claude API messages endpoint."""
        model = conf["model"]
        if not model or not model.startswith("claude"):
            model = "claude-3-5-sonnet-20241022"

        api_key = conf["api_key"]
        endpoint = "https://api.anthropic.com/v1/messages"
        headers = {
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
        }

        messages = []
        for h in history[-6:]:
            role = "user" if h.get("role") == "user" else "assistant"
            messages.append({"role": role, "content": h.get("message", "")})
        messages.append({"role": "user", "content": user_prompt})

        payload = {
            "model": model,
            "system": system_prompt,
            "messages": messages,
            "max_tokens": conf["max_tokens"],
            "temperature": conf["temperature"],
        }

        resp = requests.post(endpoint, json=payload, headers=headers, timeout=conf["timeout"])
        if resp.status_code == 200:
            data = resp.json()
            contents = data.get("content", [])
            if contents:
                text = contents[0].get("text", "")
                return {
                    "success": True,
                    "text": text,
                    "provider": "anthropic",
                    "model": model,
                }, 200
            return {"success": False, "message": "Empty response from Claude."}, 502

        return {
            "success": False,
            "error_type": "API_ERROR",
            "message": f"Anthropic API error (HTTP {resp.status_code}).",
        }, 502

    @classmethod
    def _call_ollama(cls, conf, system_prompt, user_prompt, history):
        """Call local Ollama server endpoint."""
        base = conf["base_url"] or "http://localhost:11434"
        endpoint = f"{base.rstrip('/')}/api/chat"
        model = conf["model"] or "llama3.2"

        messages = [{"role": "system", "content": system_prompt}]
        for h in history[-6:]:
            role = "user" if h.get("role") == "user" else "assistant"
            messages.append({"role": role, "content": h.get("message", "")})
        messages.append({"role": "user", "content": user_prompt})

        payload = {
            "model": model,
            "messages": messages,
            "stream": False,
            "options": {"temperature": conf["temperature"]},
        }

        resp = requests.post(endpoint, json=payload, timeout=conf["timeout"])
        if resp.status_code == 200:
            data = resp.json()
            text = data.get("message", {}).get("content", "")
            return {
                "success": True,
                "text": text,
                "provider": "ollama",
                "model": model,
            }, 200

        return {
            "success": False,
            "error_type": "OLLAMA_ERROR",
            "message": f"Ollama local error (HTTP {resp.status_code}).",
        }, 502
