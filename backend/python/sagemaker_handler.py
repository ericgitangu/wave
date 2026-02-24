"""Lambda handler for SageMaker language detection.

Invokes the wave-lang-detect SageMaker endpoint running XLM-RoBERTa for
20-language classification (including Swahili, French, Wolof, English).
Exposed via API Gateway POST /detect-language.

Architecture: Rust handles request/response serialization (PyO3),
Python handles AWS I/O (boto3).
"""
import json
import os
import time
from typing import Any

import boto3

from wave_backend import (
    build_language_detection_request,
    parse_language_detection_response,
)

SAGEMAKER_CLIENT = boto3.client("sagemaker-runtime", region_name="us-east-1")
ENDPOINT_NAME = os.environ.get("SAGEMAKER_ENDPOINT", "wave-lang-detect")


def detect_language(text: str) -> dict[str, Any]:
    """Invoke SageMaker endpoint for language detection."""
    request_body = build_language_detection_request(text)

    response = SAGEMAKER_CLIENT.invoke_endpoint(
        EndpointName=ENDPOINT_NAME,
        ContentType="application/json",
        Accept="application/json",
        Body=request_body,
    )

    response_json = response["Body"].read().decode("utf-8")
    return json.loads(parse_language_detection_response(response_json))


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
