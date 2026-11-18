"""FarmVoice AI - Retry Handler with Exponential Backoff and Jitter.

Handles transient failure detection (HTTP 503, 429, 500, 502, 504,
timeouts, network connection drops) using bounded retries with
exponential backoff and randomized jitter to prevent thundering herd.
"""

import logging
import random
import time
from typing import Callable, Tuple, Dict, Any
import requests

logger = logging.getLogger(__name__)

# HTTP status codes that represent transient, retryable server-side conditions
RETRYABLE_STATUS_CODES = {429, 500, 502, 503, 504}

# Status codes that represent permanent/client errors that MUST NOT be retried
NON_RETRYABLE_STATUS_CODES = {400, 401, 403, 404, 422}


def is_retryable_error(status_code: int, error_type: str = "") -> bool:
    """Determine whether an error status or category is transient and worth retrying."""
    if status_code in RETRYABLE_STATUS_CODES:
        return True
    if error_type in ("TIMEOUT", "NETWORK_ERROR", "SERVICE_UNAVAILABLE", "RATE_LIMITED"):
        return True
    return False


def calculate_backoff_delay(
    attempt: int,
    base_delay: float = 1.0,
    max_delay: float = 6.0,
    jitter: float = 0.5,
) -> float:
    """Calculate exponential backoff with additive uniform jitter.

    Formula: delay = min(max_delay, base_delay * 2^attempt) + uniform(0, jitter)
    """
    exponential = min(max_delay, base_delay * (2 ** attempt))
    random_jitter = random.uniform(0, jitter)
    return round(exponential + random_jitter, 3)


class RetryHandler:
    """Executes callables with bounded retries and exponential backoff."""

    @staticmethod
    def execute_with_retry(
        call_fn: Callable[[], Tuple[Dict[str, Any], int]],
        max_retries: int = 2,
        base_delay: float = 1.0,
        max_delay: float = 6.0,
        jitter: float = 0.5,
        provider_name: str = "ai_provider",
    ) -> Tuple[Dict[str, Any], int]:
        """Execute a provider call function with bounded retries on transient errors.

        The callable must return a tuple (result_dict, status_code).
        Returns the final (result_dict, status_code).
        """
        last_result: Dict[str, Any] = {}
        last_status: int = 500

        for attempt in range(max_retries + 1):
            try:
                result, status = call_fn()
                last_result = result
                last_status = status

                # Success
                if status == 200 and result.get("success"):
                    if attempt > 0:
                        logger.info(
                            "[%s] Succeeded on retry attempt %d/%d",
                            provider_name,
                            attempt,
                            max_retries,
                        )
                    return result, status

                # Check if retryable
                err_type = result.get("error_type", "")
                if is_retryable_error(status, err_type) and attempt < max_retries:
                    delay = calculate_backoff_delay(attempt, base_delay, max_delay, jitter)
                    logger.warning(
                        "[%s] Transient error (HTTP %d, type: %s) on attempt %d/%d. Retrying in %.2fs...",
                        provider_name,
                        status,
                        err_type,
                        attempt + 1,
                        max_retries + 1,
                        delay,
                    )
                    time.sleep(delay)
                    continue

                # Non-retryable error (e.g. 401 auth error, 404 model not found) or retries exhausted
                if not is_retryable_error(status, err_type):
                    logger.info(
                        "[%s] Non-retryable error (HTTP %d, type: %s). Skipping further retries.",
                        provider_name,
                        status,
                        err_type,
                    )
                return result, status

            except requests.exceptions.Timeout as timeout_err:
                last_status = 504
                last_result = {
                    "success": False,
                    "error_type": "TIMEOUT",
                    "message": f"Provider '{provider_name}' request timed out.",
                }
                if attempt < max_retries:
                    delay = calculate_backoff_delay(attempt, base_delay, max_delay, jitter)
                    logger.warning(
                        "[%s] Timeout on attempt %d/%d. Retrying in %.2fs: %s",
                        provider_name,
                        attempt + 1,
                        max_retries + 1,
                        delay,
                        str(timeout_err),
                    )
                    time.sleep(delay)
                    continue
                return last_result, last_status

            except requests.exceptions.ConnectionError as conn_err:
                last_status = 502
                last_result = {
                    "success": False,
                    "error_type": "NETWORK_ERROR",
                    "message": f"Unable to establish connection to '{provider_name}'.",
                }
                if attempt < max_retries:
                    delay = calculate_backoff_delay(attempt, base_delay, max_delay, jitter)
                    logger.warning(
                        "[%s] Connection error on attempt %d/%d. Retrying in %.2fs: %s",
                        provider_name,
                        attempt + 1,
                        max_retries + 1,
                        delay,
                        str(conn_err),
                    )
                    time.sleep(delay)
                    continue
                return last_result, last_status

            except Exception as unhandled_err:
                logger.exception(
                    "[%s] Unexpected exception during execution: %s",
                    provider_name,
                    str(unhandled_err),
                )
                return {
                    "success": False,
                    "error_type": "EXECUTION_ERROR",
                    "message": f"Unexpected error while calling '{provider_name}': {str(unhandled_err)}",
                }, 500

        return last_result, last_status
