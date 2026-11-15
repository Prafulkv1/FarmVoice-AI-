
"""FarmVoice AI - Reusable Multi-Provider AI Service Layer."""

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
            "model": cfg.get("AI_MODEL", "gemini-3.5-flash").strip(),
            "temperature": float(cfg.get("AI_TEMPERATURE", 0.4)),
            "max_tokens": int(cfg.get("AI_MAX_TOKENS", 1500)),
            "timeout": int(cfg.get("AI_TIMEOUT_SECONDS", 30)),
            "base_url": cfg.get("AI_BASE_URL", "").strip(),
        }

    @classmethod
    def check_health(cls):
        """Check AI service configuration."""
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
                else "AI service requires an API key in backend/.env."
            ),
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
        """Generate an AI response using the configured provider."""

        conf = cls.get_config()
        provider = conf["provider"]

        if not conf["api_key"] and provider not in ("ollama", "custom"):
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

        try:
            if provider == "gemini":
                return cls._call_gemini(
                    conf, system_prompt, user_prompt, history
                )

            elif provider in ("openai", "groq", "custom"):
                return cls._call_openai_compatible(
                    conf, system_prompt, user_prompt, history
                )

            elif provider == "anthropic":
                return cls._call_anthropic(
                    conf, system_prompt, user_prompt, history
                )

            elif provider == "ollama":
                return cls._call_ollama(
                    conf, system_prompt, user_prompt, history
                )

            else:
                return {
                    "success": False,
                    "error_type": "UNSUPPORTED_PROVIDER",
                    "message": f"Unsupported AI provider: {provider}",
                }, 400

        except requests.exceptions.Timeout:
            logger.exception("AI provider request timed out.")

            return {
                "success": False,
                "error_type": "TIMEOUT",
                "message": "The AI service timed out. Please try again.",
            }, 504

        except requests.exceptions.ConnectionError:
            logger.exception("AI provider connection failed.")

            return {
                "success": False,
                "error_type": "NETWORK_ERROR",
                "message": "Unable to connect to the AI service.",
            }, 502

        except Exception:
            logger.exception("Unexpected error in AI service.")

            return {
                "success": False,
                "error_type": "AI_SERVICE_ERROR",
                "message": (
                    "An error occurred while generating your farming advisory. "
                    "Please try again in a few moments."
                ),
            }, 500

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
