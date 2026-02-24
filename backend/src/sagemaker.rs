use pyo3::exceptions::PyValueError;
use pyo3::prelude::*;

/// Build a request payload for the XLM-RoBERTa language detection SageMaker endpoint.
///
/// The HuggingFace inference container expects `{"inputs": "text"}`.
#[pyfunction]
pub fn build_language_detection_request(text: &str) -> PyResult<String> {
    if text.is_empty() {
        return Err(PyValueError::new_err("text must not be empty"));
    }

    let payload = serde_json::json!({
        "inputs": text
    });

    Ok(payload.to_string())
}

/// Parse the language detection response from the SageMaker endpoint.
///
/// HuggingFace text-classification pipeline returns:
/// `[[{"label": "fr", "score": 0.98}, {"label": "en", "score": 0.01}, ...]]`
///
/// We extract the top prediction and return a flat JSON object.
#[pyfunction]
pub fn parse_language_detection_response(response_json: &str) -> PyResult<String> {
    let response: serde_json::Value = serde_json::from_str(response_json)
        .map_err(|e| PyValueError::new_err(format!("invalid response JSON: {e}")))?;

    // Handle both [[{...}]] and [{...}] formats
    let predictions = if let Some(outer) = response.as_array() {
        if let Some(inner) = outer.first().and_then(|v| v.as_array()) {
            inner.clone()
        } else {
            outer.clone()
        }
    } else {
        return Err(PyValueError::new_err("expected array response"));
    };

    let top = predictions
        .first()
        .ok_or_else(|| PyValueError::new_err("empty predictions array"))?;

    let label = top["label"]
        .as_str()
        .ok_or_else(|| PyValueError::new_err("missing label field"))?;
    let score = top["score"]
        .as_f64()
        .ok_or_else(|| PyValueError::new_err("missing score field"))?;

    let result = serde_json::json!({
        "detected_language": label,
        "confidence": score,
        "all_predictions": predictions,
    });

    Ok(result.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_build_language_detection_request_valid() {
        let result =
            build_language_detection_request("Bonjour, je veux envoyer de l'argent").unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&result).unwrap();
        assert_eq!(parsed["inputs"], "Bonjour, je veux envoyer de l'argent");
    }

    #[test]
    fn test_build_language_detection_request_empty() {
        let result = build_language_detection_request("");
        assert!(result.is_err());
        assert!(format!("{}", result.unwrap_err()).contains("text must not be empty"));
    }

    #[test]
    fn test_parse_language_detection_response_nested() {
        let response = serde_json::json!([[
            {"label": "fr", "score": 0.95},
            {"label": "en", "score": 0.03},
            {"label": "sw", "score": 0.02}
        ]]);
        let result = parse_language_detection_response(&response.to_string()).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&result).unwrap();
        assert_eq!(parsed["detected_language"], "fr");
        assert_eq!(parsed["confidence"], 0.95);
        assert!(parsed["all_predictions"].as_array().unwrap().len() == 3);
    }

    #[test]
    fn test_parse_language_detection_response_flat() {
        let response = serde_json::json!([
            {"label": "sw", "score": 0.88},
            {"label": "en", "score": 0.12}
        ]);
        let result = parse_language_detection_response(&response.to_string()).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&result).unwrap();
        assert_eq!(parsed["detected_language"], "sw");
    }

    #[test]
    fn test_parse_language_detection_response_invalid() {
        let result = parse_language_detection_response("not json");
        assert!(result.is_err());
    }

    #[test]
    fn test_parse_language_detection_response_empty_array() {
        let result = parse_language_detection_response("[[]]");
        assert!(result.is_err());
        assert!(format!("{}", result.unwrap_err()).contains("empty predictions"));
    }

    #[test]
    fn test_parse_language_detection_response_missing_label() {
        let response = serde_json::json!([[{"score": 0.5}]]);
        let result = parse_language_detection_response(&response.to_string());
        assert!(result.is_err());
        assert!(format!("{}", result.unwrap_err()).contains("missing label"));
    }
}
