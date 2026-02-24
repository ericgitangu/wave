"""Lambda handler for Bedrock sentiment analysis and embeddings.

Receives events from EventBridge (wave.voice / VoiceClassification), runs
sentiment analysis via Claude 3 Haiku and semantic embedding via Titan
Embeddings V2, then persists results to DynamoDB.

Architecture: Rust handles fast serialization/parsing (PyO3), Python handles
AWS I/O (boto3). Same clean boundary as the rest of the Wave backend.
"""
import json
import os
import time
import uuid
from typing import Any

import boto3

from wave_backend import (
    build_embedding_request,
    build_sentiment_request,
    classify_intent,
    parse_sentiment_response,
)

BEDROCK_CLIENT = boto3.client("bedrock-runtime", region_name="us-east-1")
DYNAMODB = boto3.resource("dynamodb", region_name="us-east-1")
TABLE_NAME = os.environ.get("ML_RESULTS_TABLE", "wave-ml-results")

CLAUDE_HAIKU_MODEL = "anthropic.claude-3-haiku-20240307-v1:0"
TITAN_EMBED_MODEL = "amazon.titan-embed-text-v2:0"


def analyze_sentiment(text: str, language: str) -> dict[str, Any]:
    """Call Claude 3 Haiku via Bedrock for sentiment analysis."""
    request_body = build_sentiment_request(text, language)

    response = BEDROCK_CLIENT.invoke_model(
        modelId=CLAUDE_HAIKU_MODEL,
        contentType="application/json",
        accept="application/json",
        body=request_body,
    )

    response_json = response["body"].read().decode("utf-8")
    return json.loads(parse_sentiment_response(response_json))


def generate_embedding(text: str) -> list[float]:
    """Call Titan Embeddings V2 via Bedrock for semantic vector."""
    request_body = build_embedding_request(text)

    response = BEDROCK_CLIENT.invoke_model(
        modelId=TITAN_EMBED_MODEL,
        contentType="application/json",
        accept="application/json",
        body=request_body,
    )

    response_json = json.loads(response["body"].read().decode("utf-8"))
    return response_json.get("embedding", [])


def persist_result(
    text: str,
    classification: dict,
    sentiment: dict,
    embedding_dim: int,
    latency_ms: int,
) -> str:
    """Write ML results to DynamoDB."""
    result_id = str(uuid.uuid4())[:8]
    table = DYNAMODB.Table(TABLE_NAME)

    table.put_item(
        Item={
            "PK": f"ML#{result_id}",
            "SK": f"RESULT#{int(time.time())}",
            "text": text[:500],
            "language": classification.get("language", "unknown"),
            "intent": classification.get("intent", "unknown"),
            "sentiment": sentiment.get("sentiment", "unknown"),
            "category": sentiment.get("category", "unknown"),
            "sentiment_confidence": str(sentiment.get("confidence", 0)),
            "embedding_dimensions": embedding_dim,
            "latency_ms": latency_ms,
            "timestamp": int(time.time()),
            "ExpiresAt": int(time.time()) + 86400 * 30,  # 30 day TTL
        }
    )

    return result_id


def handler(event: dict[str, Any], context: Any) -> dict[str, Any]:
    """EventBridge / direct invocation handler for Bedrock sentiment pipeline.

    EventBridge event shape:
        {"source": "wave.voice", "detail-type": "VoiceClassification",
         "detail": {"text": "...", "language": "...", "intent": "..."}}

    Direct invocation shape:
        {"text": "I love Wave!"}
    """
    start = time.monotonic_ns()

    # Extract text from EventBridge detail or direct payload
    if "detail" in event:
        detail = event["detail"]
        text = detail.get("text", "")
        language = detail.get("language", "english")
    else:
        text = event.get("text", "")
        language = event.get("language", "auto")

    if not text.strip():
        return {
            "statusCode": 400,
            "body": json.dumps({"error": "text field is required"}),
        }

    # Step 1: Rust tokenization + classification
    classification = json.loads(classify_intent(text))
    if language == "auto":
        language = classification.get("language", "english")

    # Step 2: Bedrock sentiment analysis
    sentiment = analyze_sentiment(text, language)

    # Step 3: Bedrock embedding
    embedding = generate_embedding(text)

    elapsed_ms = (time.monotonic_ns() - start) // 1_000_000

    # Step 4: Persist to DynamoDB
    result_id = persist_result(
        text=text,
        classification=classification,
        sentiment=sentiment,
        embedding_dim=len(embedding),
        latency_ms=elapsed_ms,
    )

    result = {
        "result_id": result_id,
        "text": text[:200],
        "language": language,
        "intent": classification.get("intent", "unknown"),
        "sentiment": sentiment,
        "embedding_dimensions": len(embedding),
        "latency_ms": elapsed_ms,
    }

    return {
        "statusCode": 200,
        "body": json.dumps(result),
    }
