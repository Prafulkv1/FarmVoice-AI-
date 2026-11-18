"""FarmVoice AI - AI Provider Health Tracking.

Tracks in-memory health metrics, error categories, response latency,
and manages temporary cooldowns after repeated failures.
Thread-safe and zero database dependencies.
"""

import logging
import threading
import time
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)


class ProviderHealthTracker:
    """Thread-safe in-memory health and circuit breaker tracking for AI providers."""

    def __init__(self, failure_threshold: int = 2, default_cooldown_seconds: int = 60):
        self._lock = threading.Lock()
        self._failure_threshold = failure_threshold
        self._default_cooldown = default_cooldown_seconds
        self._providers: Dict[str, Dict[str, Any]] = {}

    def _get_or_create(self, provider_name: str) -> Dict[str, Any]:
        """Internal helper to get or initialize stats dictionary for a provider."""
        provider = provider_name.lower().strip()
        if provider not in self._providers:
            self._providers[provider] = {
                "name": provider,
                "total_requests": 0,
                "successful_requests": 0,
                "failed_requests": 0,
                "consecutive_failures": 0,
                "last_success_time": None,
                "last_failure_time": None,
                "last_error_category": None,
                "last_error_message": None,
                "last_latency_ms": None,
                "avg_latency_ms": None,
                "cooldown_until": 0.0,
            }
        return self._providers[provider]

    def is_available(self, provider_name: str) -> bool:
        """Check if provider is available and not currently in temporary cooldown."""
        with self._lock:
            stats = self._get_or_create(provider_name)
            now = time.time()
            if stats["cooldown_until"] > now:
                remaining = int(stats["cooldown_until"] - now)
                logger.info(
                    "Provider '%s' is in cooldown (remaining: %ds)",
                    provider_name,
                    remaining,
                )
                return False
            return True

    def record_success(self, provider_name: str, latency_ms: float = 0.0):
        """Record a successful request for the given provider."""
        with self._lock:
            stats = self._get_or_create(provider_name)
            stats["total_requests"] += 1
            stats["successful_requests"] += 1
            stats["consecutive_failures"] = 0
            stats["cooldown_until"] = 0.0
            stats["last_success_time"] = time.time()
            stats["last_latency_ms"] = round(latency_ms, 2)

            # Update moving average latency
            prev_avg = stats["avg_latency_ms"]
            if prev_avg is None:
                stats["avg_latency_ms"] = round(latency_ms, 2)
            else:
                stats["avg_latency_ms"] = round((prev_avg * 0.8) + (latency_ms * 0.2), 2)

            logger.debug(
                "Provider '%s' success recorded (latency: %.1fms)",
                provider_name,
                latency_ms,
            )

    def record_failure(
        self,
        provider_name: str,
        error_category: str,
        error_message: str = "",
        cooldown_seconds: Optional[int] = None,
    ):
        """Record a failed request, updating consecutive failures and triggering cooldown if needed."""
        cooldown = cooldown_seconds if cooldown_seconds is not None else self._default_cooldown
        with self._lock:
            stats = self._get_or_create(provider_name)
            stats["total_requests"] += 1
            stats["failed_requests"] += 1
            stats["consecutive_failures"] += 1
            stats["last_failure_time"] = time.time()
            stats["last_error_category"] = error_category
            stats["last_error_message"] = error_message[:250] if error_message else None

            # Determine if cooldown should be triggered
            # Transient service errors (503, 429) trigger cooldown immediately if failures persist
            if (
                stats["consecutive_failures"] >= self._failure_threshold
                or error_category in ("SERVICE_UNAVAILABLE", "RATE_LIMITED")
            ):
                stats["cooldown_until"] = time.time() + cooldown
                logger.warning(
                    "Provider '%s' entered temporary cooldown for %ds after %d consecutive failures (Category: %s)",
                    provider_name,
                    cooldown,
                    stats["consecutive_failures"],
                    error_category,
                )

    def get_provider_stats(self, provider_name: str) -> Dict[str, Any]:
        """Return a copy of the health stats for a specific provider."""
        with self._lock:
            stats = self._get_or_create(provider_name)
            now = time.time()
            in_cooldown = stats["cooldown_until"] > now
            return {
                **stats,
                "in_cooldown": in_cooldown,
                "cooldown_remaining_seconds": max(0, int(stats["cooldown_until"] - now)) if in_cooldown else 0,
            }

    def get_health_summary(self) -> Dict[str, Any]:
        """Return a complete dictionary of all tracked providers' health statuses."""
        with self._lock:
            now = time.time()
            summary = {}
            for name, stats in self._providers.items():
                in_cooldown = stats["cooldown_until"] > now
                summary[name] = {
                    "total_requests": stats["total_requests"],
                    "successful_requests": stats["successful_requests"],
                    "failed_requests": stats["failed_requests"],
                    "consecutive_failures": stats["consecutive_failures"],
                    "last_latency_ms": stats["last_latency_ms"],
                    "avg_latency_ms": stats["avg_latency_ms"],
                    "last_error_category": stats["last_error_category"],
                    "in_cooldown": in_cooldown,
                    "cooldown_remaining_seconds": max(0, int(stats["cooldown_until"] - now)) if in_cooldown else 0,
                    "status": "healthy" if not in_cooldown and stats["consecutive_failures"] == 0 else (
                        "cooling_down" if in_cooldown else "degraded"
                    ),
                }
            return summary

    def reset(self):
        """Reset all tracked metrics (primarily for test isolation)."""
        with self._lock:
            self._providers.clear()


# Global singleton instance
provider_health = ProviderHealthTracker()
