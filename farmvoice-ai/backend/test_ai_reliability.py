"""FarmVoice AI - AI Provider Reliability & Fallback Test Suite.

Verifies:
1. Gemini success (200 OK) with latency & health tracking.
2. Gemini HTTP 503 (Service Unavailable) -> retries with exponential backoff -> Groq fallback success.
3. Gemini HTTP 429 (Rate Limit / Quota Exceeded) -> Groq fallback success.
4. Gemini network timeout -> Groq fallback success.
5. All providers unavailable -> friendly normalized error response (HTTP 503).
6. Non-retryable error (HTTP 401 Invalid API Key) -> skips retry loops, triggers fallback.
7. Provider cooldown circuit breaker -> subsequent requests bypass cooled-down provider.
8. Prompt & context preservation -> fallback provider receives identical grounding and language directives.
9. Health tracker status reporting for /api/ai/health.
"""

import time
import unittest
from unittest.mock import patch, MagicMock
import requests

from app import create_app
from app.services.ai.provider_health import ProviderHealthTracker, provider_health
from app.services.ai.retry_handler import (
    RetryHandler,
    is_retryable_error,
    calculate_backoff_delay,
)
from app.services.ai.fallback_manager import FallbackManager
from app.services.ai_service import AIService


class AIReliabilityTestSuite(unittest.TestCase):
    """Test suite for multi-provider reliability, bounded retries, and fallback."""

    @classmethod
    def setUpClass(cls):
        cls.app = create_app()

    def setUp(self):
        self.app_context = self.app.app_context()
        self.app_context.push()
        provider_health.reset()

    def tearDown(self):
        provider_health.reset()
        self.app_context.pop()

    # -------------------------------------------------------------------------
    # 1. Retry Handler Unit Tests
    # -------------------------------------------------------------------------
    def test_retryable_error_identification(self):
        """Verify only transient HTTP codes and error categories are marked retryable."""
        # Retryable
        self.assertTrue(is_retryable_error(503))
        self.assertTrue(is_retryable_error(429))
        self.assertTrue(is_retryable_error(500))
        self.assertTrue(is_retryable_error(502))
        self.assertTrue(is_retryable_error(504))
        self.assertTrue(is_retryable_error(200, "TIMEOUT"))
        self.assertTrue(is_retryable_error(200, "NETWORK_ERROR"))

        # Non-retryable
        self.assertFalse(is_retryable_error(400))
        self.assertFalse(is_retryable_error(401))
        self.assertFalse(is_retryable_error(403))
        self.assertFalse(is_retryable_error(404))
        self.assertFalse(is_retryable_error(200, ""))

    def test_exponential_backoff_calculation(self):
        """Verify backoff increases exponentially with jitter bounds."""
        d0 = calculate_backoff_delay(0, base_delay=1.0, max_delay=8.0, jitter=0.5)
        d1 = calculate_backoff_delay(1, base_delay=1.0, max_delay=8.0, jitter=0.5)
        d2 = calculate_backoff_delay(2, base_delay=1.0, max_delay=8.0, jitter=0.5)

        self.assertGreaterEqual(d0, 1.0)
        self.assertLessEqual(d0, 1.5 + 0.1)
        self.assertGreaterEqual(d1, 2.0)
        self.assertGreaterEqual(d2, 4.0)

    # -------------------------------------------------------------------------
    # 2. Provider Health & Cooldown Tracking
    # -------------------------------------------------------------------------
    def test_provider_health_and_cooldown(self):
        """Verify failure threshold triggers cooldown and success clears it."""
        tracker = ProviderHealthTracker(failure_threshold=2, default_cooldown_seconds=10)

        self.assertTrue(tracker.is_available("gemini"))

        # First failure
        tracker.record_failure("gemini", "TIMEOUT")
        self.assertTrue(tracker.is_available("gemini"))  # Threshold is 2

        # Second failure -> enters cooldown
        tracker.record_failure("gemini", "SERVICE_UNAVAILABLE", cooldown_seconds=10)
        self.assertFalse(tracker.is_available("gemini"))

        stats = tracker.get_provider_stats("gemini")
        self.assertTrue(stats["in_cooldown"])
        self.assertGreater(stats["cooldown_remaining_seconds"], 0)

        # Record success -> resets cooldown immediately
        tracker.record_success("gemini", latency_ms=120.5)
        self.assertTrue(tracker.is_available("gemini"))
        stats = tracker.get_provider_stats("gemini")
        self.assertFalse(stats["in_cooldown"])
        self.assertEqual(stats["consecutive_failures"], 0)
        self.assertEqual(stats["last_latency_ms"], 120.5)

    # -------------------------------------------------------------------------
    # 3. Primary Provider (Gemini) Success
    # -------------------------------------------------------------------------
    def test_gemini_success_primary(self):
        """Verify Gemini 200 response returns valid advisory and records healthy metrics."""
        mock_gemini_resp = MagicMock()
        mock_gemini_resp.status_code = 200
        mock_gemini_resp.json.return_value = {
            "candidates": [
                {"content": {"parts": [{"text": "ಕಬ್ಬಿನ ಬೆಳೆಗೆ ಹನಿ ನೀರಾವರಿ ಸೂಕ್ತವಾಗಿದೆ."}]}}
            ]
        }

        with patch.dict(self.app.config, {
            "AI_PRIMARY_PROVIDER": "gemini",
            "GEMINI_API_KEY": "mock-gemini-key",
            "GROQ_API_KEY": "mock-groq-key",
        }):
            with patch("requests.post", return_value=mock_gemini_resp):
                result, status = AIService.generate_response(
                    question="Which irrigation is best for sugarcane?",
                    language_code="kn",
                )

                self.assertEqual(status, 200)
                self.assertTrue(result["success"])
                self.assertEqual(result["provider"], "gemini")
                self.assertIn("ಕಬ್ಬಿನ", result["text"])
                self.assertNotIn("fallback_used", result)

                stats = provider_health.get_provider_stats("gemini")
                self.assertEqual(stats["successful_requests"], 1)
                self.assertEqual(stats["consecutive_failures"], 0)

    # -------------------------------------------------------------------------
    # 4. Gemini HTTP 503 -> Fallback to Groq
    # -------------------------------------------------------------------------
    def test_gemini_503_fallback_to_groq_success(self):
        """Verify when Gemini returns 503, system retries and smoothly falls back to Groq."""
        # 1. Gemini fails with 503 Service Unavailable
        mock_gemini_503 = MagicMock()
        mock_gemini_503.status_code = 503
        mock_gemini_503.json.return_value = {
            "error": {"code": 503, "message": "High demand, temporarily unavailable", "status": "UNAVAILABLE"}
        }

        # 2. Groq succeeds with 200 OK
        mock_groq_200 = MagicMock()
        mock_groq_200.status_code = 200
        mock_groq_200.json.return_value = {
            "choices": [
                {"message": {"role": "assistant", "content": "टमाटर की फसल में जैविक कीटनाशक का उपयोग करें।"}}
            ]
        }

        def _side_effect(*args, **kwargs):
            url = args[0] if args else kwargs.get("url", "")
            if "generativelanguage.googleapis.com" in url:
                return mock_gemini_503
            elif "api.groq.com" in url:
                return mock_groq_200
            return mock_gemini_503

        with patch.dict(self.app.config, {
            "AI_PRIMARY_PROVIDER": "gemini",
            "AI_FALLBACK_PROVIDER": "groq",
            "GEMINI_API_KEY": "mock-gemini-key",
            "GROQ_API_KEY": "mock-groq-key",
            "AI_MAX_RETRIES": 1,  # 1 retry to test bounded retry + fallback speed
        }):
            with patch("time.sleep", return_value=None):  # Fast test execution
                with patch("requests.post", side_effect=_side_effect) as mock_post:
                    result, status = AIService.generate_response(
                        question="टमाटर में कीट कैसे रोकें?",
                        language_code="hi",
                    )

                    self.assertEqual(status, 200)
                    self.assertTrue(result["success"])
                    self.assertEqual(result["provider"], "groq")
                    self.assertTrue(result.get("fallback_used"))
                    self.assertEqual(result.get("primary_provider_failed"), "gemini")
                    self.assertIn("टमाटर", result["text"])

                    # Both Gemini calls (initial + 1 retry) and Groq call were made
                    self.assertGreaterEqual(mock_post.call_count, 2)

                    # Gemini tracked as failed, Groq tracked as healthy
                    gemini_stats = provider_health.get_provider_stats("gemini")
                    groq_stats = provider_health.get_provider_stats("groq")
                    self.assertGreater(gemini_stats["failed_requests"], 0)
                    self.assertEqual(groq_stats["successful_requests"], 1)

    # -------------------------------------------------------------------------
    # 5. Gemini HTTP 429 (Rate Limit) -> Fallback to Groq
    # -------------------------------------------------------------------------
    def test_gemini_429_rate_limit_fallback(self):
        """Verify HTTP 429 quota exhaustion on Gemini triggers fallback to Groq."""
        mock_gemini_429 = MagicMock()
        mock_gemini_429.status_code = 429
        mock_gemini_429.json.return_value = {
            "error": {"code": 429, "message": "Resource exhausted / rate limit", "status": "RESOURCE_EXHAUSTED"}
        }

        mock_groq_200 = MagicMock()
        mock_groq_200.status_code = 200
        mock_groq_200.json.return_value = {
            "choices": [{"message": {"content": "Use balanced NPK fertilizer for paddy."}}]
        }

        def _side_effect(*args, **kwargs):
            url = args[0] if args else kwargs.get("url", "")
            if "generativelanguage.googleapis.com" in url:
                return mock_gemini_429
            return mock_groq_200

        with patch.dict(self.app.config, {
            "AI_PRIMARY_PROVIDER": "gemini",
            "AI_FALLBACK_PROVIDER": "groq",
            "GEMINI_API_KEY": "mock-gemini-key",
            "GROQ_API_KEY": "mock-groq-key",
            "AI_MAX_RETRIES": 1,
        }):
            with patch("time.sleep", return_value=None):
                with patch("requests.post", side_effect=_side_effect):
                    result, status = AIService.generate_response(
                        question="What fertilizer for paddy?",
                        language_code="en",
                    )
                    self.assertEqual(status, 200)
                    self.assertEqual(result["provider"], "groq")
                    self.assertTrue(result["fallback_used"])

    # -------------------------------------------------------------------------
    # 6. Gemini Network Timeout -> Fallback to Groq
    # -------------------------------------------------------------------------
    def test_gemini_timeout_fallback(self):
        """Verify network timeout on primary triggers fallback to Groq."""
        mock_groq_200 = MagicMock()
        mock_groq_200.status_code = 200
        mock_groq_200.json.return_value = {
            "choices": [{"message": {"content": "Cotton requires well-drained deep black soil."}}]
        }

        def _side_effect(*args, **kwargs):
            url = args[0] if args else kwargs.get("url", "")
            if "generativelanguage.googleapis.com" in url:
                raise requests.exceptions.Timeout("Gemini connection timed out")
            return mock_groq_200

        with patch.dict(self.app.config, {
            "AI_PRIMARY_PROVIDER": "gemini",
            "AI_FALLBACK_PROVIDER": "groq",
            "GEMINI_API_KEY": "mock-gemini-key",
            "GROQ_API_KEY": "mock-groq-key",
            "AI_MAX_RETRIES": 1,
        }):
            with patch("time.sleep", return_value=None):
                with patch("requests.post", side_effect=_side_effect):
                    result, status = AIService.generate_response(
                        question="What soil for cotton?",
                        language_code="en",
                    )
                    self.assertEqual(status, 200)
                    self.assertEqual(result["provider"], "groq")

    # -------------------------------------------------------------------------
    # 7. Non-Retryable Error (HTTP 401 Invalid Key) -> No Loop, Fast Handover
    # -------------------------------------------------------------------------
    def test_invalid_api_key_no_unnecessary_retries(self):
        """Verify 401 Auth Error does NOT retry repeatedly and hands over to fallback."""
        mock_gemini_401 = MagicMock()
        mock_gemini_401.status_code = 401
        mock_gemini_401.json.return_value = {
            "error": {"code": 401, "message": "API_KEY_INVALID"}
        }

        mock_groq_200 = MagicMock()
        mock_groq_200.status_code = 200
        mock_groq_200.json.return_value = {
            "choices": [{"message": {"content": "Drip irrigation saves 40% water."}}]
        }

        gemini_call_count = 0

        def _side_effect(*args, **kwargs):
            nonlocal gemini_call_count
            url = args[0] if args else kwargs.get("url", "")
            if "generativelanguage.googleapis.com" in url:
                gemini_call_count += 1
                return mock_gemini_401
            return mock_groq_200

        with patch.dict(self.app.config, {
            "AI_PRIMARY_PROVIDER": "gemini",
            "AI_FALLBACK_PROVIDER": "groq",
            "GEMINI_API_KEY": "invalid-gemini-key",
            "GROQ_API_KEY": "mock-groq-key",
            "AI_MAX_RETRIES": 3,
        }):
            with patch("time.sleep", return_value=None):
                with patch("requests.post", side_effect=_side_effect):
                    result, status = AIService.generate_response(question="Irrigation question")
                    self.assertEqual(status, 200)
                    self.assertEqual(result["provider"], "groq")
                    # Must NOT have retried 3 times on 401; should only be called once
                    self.assertEqual(gemini_call_count, 1)

    # -------------------------------------------------------------------------
    # 8. All Providers Unavailable -> Friendly Normalized Error Response
    # -------------------------------------------------------------------------
    def test_all_providers_unavailable_normalized_error(self):
        """Verify when all providers in chain fail, a clean normalized friendly error is returned."""
        mock_503 = MagicMock()
        mock_503.status_code = 503
        mock_503.json.return_value = {"error": {"message": "Service unavailable"}}

        with patch.dict(self.app.config, {
            "AI_PRIMARY_PROVIDER": "gemini",
            "AI_FALLBACK_PROVIDER": "groq",
            "GEMINI_API_KEY": "mock-gemini-key",
            "GROQ_API_KEY": "mock-groq-key",
            "AI_MAX_RETRIES": 0,
        }):
            with patch("requests.post", return_value=mock_503):
                result, status = AIService.generate_response(question="Weather query")
                self.assertEqual(status, 503)
                self.assertFalse(result["success"])
                self.assertEqual(result["error_type"], "AI_PROVIDER_UNAVAILABLE")
                self.assertIn("temporarily busy", result["message"])
                self.assertIn("gemini", result["details"]["attempted_providers"])
                self.assertIn("groq", result["details"]["attempted_providers"])

    # -------------------------------------------------------------------------
    # 9. Provider Cooldown Circuit Breaker
    # -------------------------------------------------------------------------
    def test_provider_cooldown_bypasses_primary(self):
        """Verify a provider in active cooldown is bypassed directly to fallback."""
        # Manually set Gemini into cooldown
        provider_health.record_failure("gemini", "SERVICE_UNAVAILABLE", cooldown_seconds=60)
        provider_health.record_failure("gemini", "SERVICE_UNAVAILABLE", cooldown_seconds=60)
        self.assertFalse(provider_health.is_available("gemini"))

        mock_groq_200 = MagicMock()
        mock_groq_200.status_code = 200
        mock_groq_200.json.return_value = {
            "choices": [{"message": {"content": "Response generated directly by Groq without hitting Gemini."}}]
        }

        with patch.dict(self.app.config, {
            "AI_PRIMARY_PROVIDER": "gemini",
            "AI_FALLBACK_PROVIDER": "groq",
            "GEMINI_API_KEY": "mock-gemini-key",
            "GROQ_API_KEY": "mock-groq-key",
        }):
            with patch("requests.post", return_value=mock_groq_200) as mock_post:
                result, status = AIService.generate_response(question="Test question")
                self.assertEqual(status, 200)
                self.assertEqual(result["provider"], "groq")
                # Confirm requests.post was ONLY called with Groq endpoint, never Gemini
                called_urls = [call.args[0] for call in mock_post.call_args_list if call.args]
                for url in called_urls:
                    self.assertNotIn("generativelanguage.googleapis.com", url)
                    self.assertIn("api.groq.com", url)

    # -------------------------------------------------------------------------
    # 10. Prompt and Language Directives Preservation Across Fallback
    # -------------------------------------------------------------------------
    def test_fallback_receives_identical_grounding_and_directives(self):
        """Verify Groq receives the exact same system prompt and farmer context as Gemini."""
        mock_gemini_503 = MagicMock()
        mock_gemini_503.status_code = 503
        mock_gemini_503.json.return_value = {"error": {"message": "503 unavailable"}}

        mock_groq_200 = MagicMock()
        mock_groq_200.status_code = 200
        mock_groq_200.json.return_value = {
            "choices": [{"message": {"content": "ತೆಲುಗು ಭಾಷಾ ಸಲಹೆ"}}]
        }

        captured_groq_payload = {}

        def _side_effect(*args, **kwargs):
            url = args[0] if args else kwargs.get("url", "")
            if "generativelanguage.googleapis.com" in url:
                return mock_gemini_503
            elif "api.groq.com" in url:
                nonlocal captured_groq_payload
                captured_groq_payload = kwargs.get("json", {})
                return mock_groq_200
            return mock_gemini_503

        with patch.dict(self.app.config, {
            "AI_PRIMARY_PROVIDER": "gemini",
            "AI_FALLBACK_PROVIDER": "groq",
            "GEMINI_API_KEY": "mock-gemini-key",
            "GROQ_API_KEY": "mock-groq-key",
            "AI_MAX_RETRIES": 0,
        }):
            with patch("requests.post", side_effect=_side_effect):
                result, status = AIService.generate_response(
                    question="వరి పంటలో తెగుళ్లు?",
                    context_str="Farmer: Basavaraj | Soil: Black Soil | Location: Bagalkote",
                    language_code="te",
                    dialect_code="telangana",
                )

                self.assertEqual(status, 200)
                self.assertEqual(result["provider"], "groq")

                # Verify payload messages sent to Groq
                messages = captured_groq_payload.get("messages", [])
                self.assertGreater(len(messages), 1)

                sys_msg = messages[0]["content"]
                user_msg = messages[-1]["content"]

                # Language directive
                self.assertIn("Telugu", sys_msg)
                # Regional dialect directive
                self.assertIn("Telangana", sys_msg)
                # Farmer context grounding
                self.assertIn("Basavaraj", user_msg)
                self.assertIn("Black Soil", user_msg)
                self.assertIn("Bagalkote", user_msg)
                self.assertIn("వరి పంటలో తెగుళ్లు?", user_msg)


if __name__ == "__main__":
    unittest.main()
