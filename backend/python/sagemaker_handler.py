"""Lambda handler for language detection.

Uses the lightweight `langdetect` library for language classification.
Supports 55 languages including Swahili, French, Wolof, English.
Exposed via API Gateway POST /detect-language.

Replaces the previous SageMaker XLM-RoBERTa endpoint (~$86/mo) with
an in-process library call ($0/mo within Lambda free tier).
"""
import json
import time
from typing import Any

from langdetect import detect_langs
from langdetect.lang_detect_exception import LangDetectException


def detect_language(text: str) -> dict[str, Any]:
    """Detect language using langdetect library."""
    try:
        results = detect_langs(text)
    except LangDetectException:
        return {
            "detected_language": "unknown",
            "confidence": 0.0,
            "all_predictions": [],
        }

    all_predictions = [
        {"label": r.lang, "score": round(r.prob, 4)} for r in results
    ]

    top = all_predictions[0] if all_predictions else {"label": "unknown", "score": 0.0}

    return {
        "detected_language": top["label"],
        "confidence": top["score"],
        "all_predictions": all_predictions,
    }


def handler(event: dict[str, Any], context: Any) -> dict[str, Any]:
    """API Gateway Lambda handler for language detection.

    Expects:
        POST /detect-language
        {"text": "Bonjour, je veux envoyer de l'argent"}

    Returns:
        {"detected_language": "fr", "confidence": 0.95, ...}
    """
    start = time.monotonic_ns()

    body = event
    if "body" in event:
        body = json.loads(event["body"]) if isinstance(event["body"], str) else event["body"]

    text: str = body.get("text", "")
    if not text.strip():
        return {
            "statusCode": 400,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"error": "text field is required and must be non-empty"}),
        }

    result = detect_language(text)
    elapsed_ms = (time.monotonic_ns() - start) // 1_000_000

    result["latency_ms"] = elapsed_ms

    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(result),
    }
