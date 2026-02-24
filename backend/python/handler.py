"""Lambda handler for resume submission.

Bridges the PyO3 Rust backend with AWS Lambda + DynamoDB. The Rust layer
handles HTTP and JSON validation; this layer handles orchestration and
persistence.
"""
import json
import os
from datetime import datetime, timezone
from typing import Any

import boto3

# PyO3 Rust bindings — compiled via maturin.
from wave_backend import submit_resume

TABLE_NAME: str = os.environ.get("TABLE_NAME", "WaveSubmissions")
dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(TABLE_NAME)


def record_submission(
    submission_id: str,
    status_code: int,
    response_body: str,
) -> dict[str, Any]:
    """Write a submission record to DynamoDB.

    >>> record = record_submission("test-123", 200, '{"ok": true}')
    >>> record["submission_id"]
    'test-123'
    >>> record["status_code"]
    200
    >>> "timestamp" in record
    True
    """
    item: dict[str, Any] = {
        "submission_id": submission_id,
        "status_code": status_code,
        "response_body": response_body,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    table.put_item(Item=item)
    return item


def handler(event: dict[str, Any], context: Any) -> dict[str, Any]:
    """Submit resume to Wave API and record result in DynamoDB.

    Expects event shape:
        {
            "payload": {...} or "payload_path": "s3://...",
            "token": "Bearer token for Wave API",
            "submission_id": "unique-id"
        }
    """
    token: str = event.get("token", "")
    submission_id: str = event.get("submission_id", "unknown")

    # Accept either inline payload or a reference to load from.
    payload = event.get("payload")
    if payload is None:
        return {
            "statusCode": 400,
            "body": json.dumps({"error": "missing payload"}),
        }

    payload_json: str = json.dumps(payload) if isinstance(payload, dict) else str(payload)

    try:
        status_code, response_body = submit_resume(payload_json, token)
    except ValueError as exc:
        return {
            "statusCode": 422,
            "body": json.dumps({"error": str(exc)}),
        }

    record = record_submission(submission_id, status_code, response_body)

    return {
        "statusCode": status_code,
        "body": json.dumps({
            "submission_id": submission_id,
            "api_status": status_code,
            "timestamp": record["timestamp"],
        }),
    }
