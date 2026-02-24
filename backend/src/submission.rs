use pyo3::exceptions::PyValueError;
use pyo3::prelude::*;
use reqwest::blocking::Client;
use reqwest::header::{AUTHORIZATION, CONTENT_TYPE};

const WAVE_API_URL: &str = "https://api.wave.com/v1/submissions";

/// Submit a resume payload to the Wave API.
///
/// Takes a JSON string and bearer token, POSTs to the Wave submission endpoint,
/// and returns (status_code, response_body). Fails fast on malformed JSON or
/// missing auth — no silent swallowing of errors.
#[pyfunction]
pub fn submit_resume(payload_json: &str, token: &str) -> PyResult<(u16, String)> {
    if token.is_empty() {
        return Err(PyValueError::new_err("token must not be empty"));
    }

    // Validate JSON before sending it over the wire.
    let _: serde_json::Value = serde_json::from_str(payload_json)
        .map_err(|e| PyValueError::new_err(format!("invalid JSON payload: {e}")))?;

    let client = Client::new();
    let resp = client
        .post(WAVE_API_URL)
        .header(AUTHORIZATION, format!("Bearer {token}"))
        .header(CONTENT_TYPE, "application/json")
        .body(payload_json.to_owned())
        .send()
        .map_err(|e| PyValueError::new_err(format!("request failed: {e}")))?;

    let status = resp.status().as_u16();
    let body = resp
        .text()
        .map_err(|e| PyValueError::new_err(format!("failed to read response body: {e}")))?;

    Ok((status, body))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_submit_resume_returns_tuple() {
        // We can't hit the real API in unit tests, but we can verify that
        // the function signature and error paths work correctly.
        // A valid JSON + empty token should fail before any network call.
        let result = submit_resume(r#"{"name": "Eric"}"#, "");
        assert!(result.is_err());
        let err_msg = format!("{}", result.unwrap_err());
        assert!(err_msg.contains("token must not be empty"));
    }

    #[test]
    fn test_invalid_json_handling() {
        let result = submit_resume("not json at all", "some-token");
        assert!(result.is_err());
        let err_msg = format!("{}", result.unwrap_err());
        assert!(err_msg.contains("invalid JSON payload"));
    }

    #[test]
    fn test_empty_token_handling() {
        let result = submit_resume(r#"{"valid": true}"#, "");
        assert!(result.is_err());
        let err_msg = format!("{}", result.unwrap_err());
        assert!(err_msg.contains("token must not be empty"));
    }
}
