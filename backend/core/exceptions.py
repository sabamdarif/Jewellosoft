"""
Global DRF Exception Handler — JewelloSoft
==========================================
Wraps every API error into a consistent envelope:
{
    "status": "error",
    "code":   "VALIDATION_ERROR",
    "message": "Human-readable summary",
    "errors":  { field-level detail }
}
"""
import logging
from rest_framework.views import exception_handler
from rest_framework.exceptions import APIException
from django.core.exceptions import ValidationError as DjangoValidationError
from django.http import Http404

logger = logging.getLogger("jewellosoft.api")


def custom_exception_handler(exc, context):
    """Central error handler registered in REST_FRAMEWORK settings."""

    # Convert Django's native ValidationError to a DRF-compatible one
    if isinstance(exc, DjangoValidationError):
        detail = exc.message_dict if hasattr(exc, "message_dict") else exc.messages
        exc = APIException(detail=detail)
        exc.status_code = 400

    response = exception_handler(exc, context)

    if response is None:
        # Unhandled exception — log and let Django propagate a 500
        logger.exception("Unhandled exception in %s", context.get("view"))
        return None

    # ── Build structured payload ──────────────────────────────────────
    if isinstance(response.data, dict):
        errors = dict(response.data)
        message = errors.pop("detail", "An error occurred.")
    elif isinstance(response.data, list):
        errors = {"non_field_errors": response.data}
        message = "Validation failed."
    else:
        errors = {}
        message = str(response.data)

    code = "ERROR"
    if hasattr(exc, "get_codes"):
        codes = exc.get_codes()
        if isinstance(codes, str):
            code = codes.upper()
        elif isinstance(codes, dict):
            code = "VALIDATION_ERROR"
        elif isinstance(codes, list):
            code = "VALIDATION_ERROR"
    elif hasattr(exc, "default_code"):
        code = str(exc.default_code).upper()

    # Log every 4xx / 5xx hit
    view_name = context.get("view").__class__.__name__ if context.get("view") else "Unknown"
    logger.warning(
        "[%s] %s — %s | %s",
        response.status_code, code, message, view_name,
        extra={"errors": errors},
    )

    response.data = {
        "status": "error",
        "code": code,
        "message": str(message),
        "errors": errors,
    }
    return response
