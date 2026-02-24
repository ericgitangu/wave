"""Lambda handler for voice intent classification.

Receives text from API Gateway, runs it through the Rust tokenizer and
language detector, then applies keyword-based intent classification on
the Python side. The split keeps the hot path (tokenization) in Rust
and the business logic (intent mapping) in Python where it's easy to
iterate on.

>>> result = classify_and_respond("angalia salio yangu")
>>> result["language"]
'swahili'
>>> result["intent"]
'check_balance'
>>> "latency_ms" in result
True
"""
import json
import os
import time
from typing import Any

import boto3

# PyO3 Rust bindings.
from wave_backend import classify_intent

EVENTS_CLIENT = boto3.client("events", region_name="us-east-1")
EVENT_BUS_NAME = os.environ.get("EVENT_BUS_NAME", "wave-ml-events")

# Intent keyword map. Keys are intents, values are trigger words.
# Intentionally flat — this is a demo, not a production NLU pipeline.
INTENT_KEYWORDS: dict[str, list[str]] = {
    "check_balance": ["balance", "salio", "angalia", "check", "how much"],
    "send_money": ["send", "tuma", "kutuma", "transfer", "pesa"],
    "account_info": ["account", "akaunti", "info", "details", "profile"],
    "help": ["help", "msaada", "support", "assist"],
    "greeting": ["hello", "hi", "habari", "jambo", "hey", "mambo"],
}

DEFAULT_CONFIDENCE: float = 0.85
LOW_CONFIDENCE: float = 0.4


def match_intent(tokens: list[str]) -> tuple[str, float]:
    """Match tokens against known intents. Returns (intent, confidence)."""
    lower_tokens = [t.lower() for t in tokens]

    best_intent = "unknown"
    best_score = 0

    for intent, keywords in INTENT_KEYWORDS.items():
        hits = sum(1 for kw in keywords if kw in lower_tokens)
        if hits > best_score:
            best_score = hits
            best_intent = intent

    if best_score == 0:
        return "unknown", LOW_CONFIDENCE

    confidence = min(DEFAULT_CONFIDENCE + (best_score - 1) * 0.05, 0.99)
    return best_intent, confidence


def classify_and_respond(text: str) -> dict[str, Any]:
    """Run classification pipeline: Rust tokenization then Python intent matching."""
    start = time.monotonic_ns()

    rust_result = json.loads(classify_intent(text))
    tokens: list[str] = rust_result["tokens"]
    language: str = rust_result["language"]

    intent, confidence = match_intent(tokens)

    elapsed_ms = (time.monotonic_ns() - start) // 1_000_000

    return {
        "language": language,
        "intent": intent,
        "tokens": tokens,
        "confidence": confidence,
        "latency_ms": elapsed_ms,
    }


def handler(event: dict[str, Any], context: Any) -> dict[str, Any]:
    """API Gateway Lambda handler for voice classification.

    Expects:
        {"text": "angalia salio yangu", "source_language": "auto"}

    Returns:
        {"language": str, "intent": str, "tokens": list,
         "confidence": float, "latency_ms": int}
    """
    body = event
    if "body" in event:
        body = json.loads(event["body"]) if isinstance(event["body"], str) else event["body"]

    text: str = body.get("text", "")
    if not text.strip():
        return {
            "statusCode": 400,
            "body": json.dumps({"error": "text field is required and must be non-empty"}),
        }

    result = classify_and_respond(text)

    # Publish to EventBridge for downstream ML processing (Bedrock sentiment, etc.)
    try:
        EVENTS_CLIENT.put_events(
            Entries=[
                {
                    "Source": "wave.voice",
                    "DetailType": "VoiceClassification",
                    "Detail": json.dumps({
                        "text": text,
                        "language": result["language"],
                        "intent": result["intent"],
                        "confidence": result["confidence"],
                        "token_count": len(result["tokens"]),
                    }),
                    "EventBusName": EVENT_BUS_NAME,
                }
            ]
        )
    except Exception:
        # Don't fail the voice response if event publishing fails
        pass

    return {
        "statusCode": 200,
        "body": json.dumps(result),
    }
