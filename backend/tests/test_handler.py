"""Tests for the submission handler and voice classification integration."""
import json
from unittest.mock import patch, MagicMock
from datetime import datetime, timezone

import pytest


class TestHandlerMissingToken:
    """Verify graceful failure when token is missing."""

    def test_handler_missing_token(self) -> None:
        """Handler should return 422 when token is empty."""
        with patch.dict("os.environ", {"TABLE_NAME": "TestTable"}):
            with patch("handler.submit_resume") as mock_submit:
                mock_submit.side_effect = ValueError("token must not be empty")
                with patch("handler.table"):
                    from python.handler import handler

                    result = handler(
                        {"payload": {"name": "Eric"}, "token": "", "submission_id": "t-1"},
                        None,
                    )
                    assert result["statusCode"] == 422
                    body = json.loads(result["body"])
                    assert "error" in body


class TestRecordSubmissionFormat:
    """Verify the DynamoDB item structure."""

    def test_record_submission_format(self) -> None:
        """record_submission should produce a well-formed item."""
        with patch("python.handler.table") as mock_table:
            mock_table.put_item = MagicMock()
            from python.handler import record_submission

            record = record_submission("sub-001", 200, '{"ok": true}')

            assert record["submission_id"] == "sub-001"
            assert record["status_code"] == 200
            assert record["response_body"] == '{"ok": true}'
            assert "timestamp" in record
            # Verify ISO format.
            datetime.fromisoformat(record["timestamp"])
            mock_table.put_item.assert_called_once()


class TestVoiceClassifySwahili:
    """Voice classification for Swahili input."""

    def test_voice_classify_swahili(self) -> None:
        with patch("python.voice_handler.classify_intent") as mock_classify:
            mock_classify.return_value = json.dumps({
                "language": "swahili",
                "tokens": ["angalia", "salio"],
                "token_count": 2,
            })
            from python.voice_handler import classify_and_respond

            result = classify_and_respond("angalia salio")
            assert result["language"] == "swahili"
            assert result["intent"] == "check_balance"


class TestVoiceClassifyEnglish:
    """Voice classification for English input."""

    def test_voice_classify_english(self) -> None:
        with patch("python.voice_handler.classify_intent") as mock_classify:
            mock_classify.return_value = json.dumps({
                "language": "english",
                "tokens": ["send", "money", "to", "John"],
                "token_count": 4,
            })
            from python.voice_handler import classify_and_respond

            result = classify_and_respond("send money to John")
            assert result["language"] == "english"
            assert result["intent"] == "send_money"


class TestVoiceUnknownIntent:
    """Voice classification with no matching intent."""

    def test_voice_unknown_intent(self) -> None:
        with patch("python.voice_handler.classify_intent") as mock_classify:
            mock_classify.return_value = json.dumps({
                "language": "english",
                "tokens": ["something", "random", "here"],
                "token_count": 3,
            })
            from python.voice_handler import classify_and_respond

            result = classify_and_respond("something random here")
            assert result["intent"] == "unknown"
            assert result["confidence"] < 0.5
