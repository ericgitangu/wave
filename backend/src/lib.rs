mod bedrock;
mod sagemaker;
mod submission;
mod voice;

use pyo3::prelude::*;

/// Wave backend — Rust bindings for resume submission, voice classification,
/// Bedrock ML inference, and SageMaker language detection.
///
/// ```
/// // Usage from Python:
/// //   from wave_backend import submit_resume, classify_intent
/// //   from wave_backend import build_sentiment_request, parse_sentiment_response
/// //   from wave_backend import build_embedding_request
/// //   from wave_backend import build_language_detection_request, parse_language_detection_response
/// ```
#[pymodule]
fn wave_backend(m: &Bound<'_, PyModule>) -> PyResult<()> {
    m.add_function(wrap_pyfunction!(submission::submit_resume, m)?)?;
    m.add_function(wrap_pyfunction!(voice::classify_intent, m)?)?;
    m.add_function(wrap_pyfunction!(bedrock::build_sentiment_request, m)?)?;
    m.add_function(wrap_pyfunction!(bedrock::parse_sentiment_response, m)?)?;
    m.add_function(wrap_pyfunction!(bedrock::build_embedding_request, m)?)?;
    m.add_function(wrap_pyfunction!(
        sagemaker::build_language_detection_request,
        m
    )?)?;
    m.add_function(wrap_pyfunction!(
        sagemaker::parse_language_detection_response,
        m
    )?)?;
    Ok(())
}
