use pyo3::exceptions::PyValueError;
use pyo3::prelude::*;

/// Build a Claude 3 Haiku request payload for sentiment analysis on mobile money support messages.
///
/// Returns a JSON string ready for `bedrock:InvokeModel` with the given text and language context.
#[pyfunction]
pub fn build_sentiment_request(text: &str, language: &str) -> PyResult<String> {
    if text.is_empty() {
        return Err(PyValueError::new_err("text must not be empty"));
    }

    let system_prompt = format!(
        "You are a sentiment analysis engine for Wave mobile money customer support. \
         The message is in {language}. Classify sentiment and category. \
         Respond ONLY with JSON: {{\"sentiment\": \"positive\"|\"negative\"|\"neutral\", \
         \"category\": \"complaint\"|\"inquiry\"|\"praise\"|\"urgent\", \
         \"confidence\": 0.0-1.0, \"summary\": \"brief english summary\"}}"
    );

    let payload = serde_json::json!({
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 256,
        "temperature": 0.0,
        "system": system_prompt,
        "messages": [
            {
                "role": "user",
                "content": text
            }
        ]
    });

    Ok(payload.to_string())
}

/// Parse a Claude 3 Haiku response from Bedrock into a structured sentiment result.
///
/// Expects the raw JSON response from `bedrock:InvokeModel`. Extracts the text content
/// and validates it contains the expected sentiment fields.
#[pyfunction]
pub fn parse_sentiment_response(response_json: &str) -> PyResult<String> {
    let response: serde_json::Value = serde_json::from_str(response_json)
        .map_err(|e| PyValueError::new_err(format!("invalid response JSON: {e}")))?;

    let content_text = response["content"]
        .as_array()
        .and_then(|arr| arr.first())
        .and_then(|block| block["text"].as_str())
        .ok_or_else(|| PyValueError::new_err("missing content[0].text in response"))?;

    // Parse the inner JSON from Claude's response text
    let sentiment: serde_json::Value = serde_json::from_str(content_text)
        .map_err(|e| PyValueError::new_err(format!("failed to parse sentiment JSON: {e}")))?;

    // Validate required fields
    for field in ["sentiment", "category", "confidence"] {
        if sentiment.get(field).is_none() {
            return Err(PyValueError::new_err(format!("missing field: {field}")));
        }
    }

    Ok(sentiment.to_string())
}

/// Build a Titan Embeddings V2 request payload.
///
/// Returns a JSON string for `bedrock:InvokeModel` with amazon.titan-embed-text-v2:0.
#[pyfunction]
pub fn build_embedding_request(text: &str) -> PyResult<String> {
    if text.is_empty() {
        return Err(PyValueError::new_err("text must not be empty"));
    }

    let payload = serde_json::json!({
        "inputText": text,
        "dimensions": 256,
        "normalize": true
    });

    Ok(payload.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_build_sentiment_request_valid() {
        let result = build_sentiment_request("I love Wave!", "english").unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&result).unwrap();
        assert_eq!(parsed["anthropic_version"], "bedrock-2023-05-31");
        assert_eq!(parsed["max_tokens"], 256);
        assert_eq!(parsed["messages"][0]["content"], "I love Wave!");
        assert!(parsed["system"].as_str().unwrap().contains("english"));
    }

    #[test]
    fn test_build_sentiment_request_empty_text() {
        let result = build_sentiment_request("", "english");
        assert!(result.is_err());
        assert!(format!("{}", result.unwrap_err()).contains("text must not be empty"));
    }

    #[test]
    fn test_build_sentiment_request_french() {
        let result = build_sentiment_request("Je veux envoyer de l'argent", "french").unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&result).unwrap();
        assert!(parsed["system"].as_str().unwrap().contains("french"));
    }

    #[test]
    fn test_parse_sentiment_response_valid() {
        let response = serde_json::json!({
            "content": [{
                "type": "text",
                "text": "{\"sentiment\":\"positive\",\"category\":\"praise\",\"confidence\":0.95,\"summary\":\"Customer loves the service\"}"
            }],
            "stop_reason": "end_turn"
        });
        let result = parse_sentiment_response(&response.to_string()).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&result).unwrap();
        assert_eq!(parsed["sentiment"], "positive");
        assert_eq!(parsed["category"], "praise");
    }

    #[test]
    fn test_parse_sentiment_response_missing_field() {
        let response = serde_json::json!({
            "content": [{
                "type": "text",
                "text": "{\"sentiment\":\"positive\"}"
            }]
        });
        let result = parse_sentiment_response(&response.to_string());
        assert!(result.is_err());
        assert!(format!("{}", result.unwrap_err()).contains("missing field"));
    }

    #[test]
    fn test_parse_sentiment_response_invalid_json() {
        let result = parse_sentiment_response("not json");
        assert!(result.is_err());
    }

    #[test]
    fn test_build_embedding_request_valid() {
        let result = build_embedding_request("check my balance").unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&result).unwrap();
        assert_eq!(parsed["inputText"], "check my balance");
        assert_eq!(parsed["dimensions"], 256);
        assert_eq!(parsed["normalize"], true);
    }

    #[test]
    fn test_build_embedding_request_empty() {
        let result = build_embedding_request("");
        assert!(result.is_err());
    }
}
