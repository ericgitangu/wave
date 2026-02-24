"""Tests for the voice handler classification pipeline."""
import json
from unittest.mock import patch

import pytest


class TestClassifyCheckBalanceSwahili:
    def test_classify_check_balance_swahili(self) -> None:
        """Swahili balance check should map to check_balance intent."""
        with patch("python.voice_handler.classify_intent") as mock_classify:
            mock_classify.return_value = json.dumps({
                "language": "swahili",
                "tokens": ["angalia", "salio", "yangu"],
                "token_count": 3,
            })
            from python.voice_handler import classify_and_respond

            result = classify_and_respond("angalia salio yangu")
            assert result["intent"] == "check_balance"
            assert result["language"] == "swahili"
            assert result["confidence"] >= 0.85


class TestClassifySendMoneyEnglish:
    def test_classify_send_money_english(self) -> None:
        """English send/transfer should map to send_money intent."""
        with patch("python.voice_handler.classify_intent") as mock_classify:
            mock_classify.return_value = json.dumps({
                "language": "english",
                "tokens": ["transfer", "money", "to", "my", "friend"],
                "token_count": 5,
            })
            from python.voice_handler import classify_and_respond

            result = classify_and_respond("transfer money to my friend")
            assert result["intent"] == "send_money"
            assert result["language"] == "english"


class TestEmptyText:
    def test_empty_text(self) -> None:
        """Empty text should return 400 from the handler."""
        with patch("python.voice_handler.classify_intent"):
            from python.voice_handler import handler

            result = handler({"text": "", "source_language": "auto"}, None)
            assert result["statusCode"] == 400
            body = json.loads(result["body"])
            assert "error" in body

    def test_whitespace_only(self) -> None:
        """Whitespace-only text should also return 400."""
        with patch("python.voice_handler.classify_intent"):
            from python.voice_handler import handler

            result = handler({"text": "   ", "source_language": "auto"}, None)
            assert result["statusCode"] == 400


class TestResponseFormat:
    def test_response_format(self) -> None:
        """Verify all expected keys are present in a successful response."""
        with patch("python.voice_handler.classify_intent") as mock_classify:
            mock_classify.return_value = json.dumps({
                "language": "english",
                "tokens": ["hello", "there"],
                "token_count": 2,
            })
            from python.voice_handler import classify_and_respond

            result = classify_and_respond("hello there")

            expected_keys = {"language", "intent", "tokens", "confidence", "latency_ms"}
            assert set(result.keys()) == expected_keys
            assert isinstance(result["language"], str)
            assert isinstance(result["intent"], str)
            assert isinstance(result["tokens"], list)
            assert isinstance(result["confidence"], float)
            assert isinstance(result["latency_ms"], int)
