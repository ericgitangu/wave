mod bedrock;
mod submission;
mod voice;

use pyo3::prelude::*;

/// Wave backend — Rust bindings for resume submission, voice classification,
/// and Bedrock ML inference.
///
/// Language detection moved to pure Python (langdetect library) — no longer
/// needs Rust serialization helpers.
///
/// ```
/// // Usage from Python:
/// //   from wave_backend import submit_resume, classify_intent
/// //   from wave_backend import build_sentiment_request, parse_sentiment_response
/// //   from wave_backend import build_embedding_request
/// ```
#[pymodule]
fn wave_backend(m: &Bound<'_, PyModule>) -> PyResult<()> {
    m.add_function(wrap_pyfunction!(submission::submit_resume, m)?)?;
    m.add_function(wrap_pyfunction!(voice::classify_intent, m)?)?;
    m.add_function(wrap_pyfunction!(bedrock::build_sentiment_request, m)?)?;
    m.add_function(wrap_pyfunction!(bedrock::parse_sentiment_response, m)?)?;
    m.add_function(wrap_pyfunction!(bedrock::build_embedding_request, m)?)?;
    Ok(())
}
