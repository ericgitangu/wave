# Changelog

All notable changes to the Wave project will be documented in this file.

## [0.4.0] - 2026-02-24

### Added
- **SageMaker Auto-Start/Stop Scheduler** — `scripts/sagemaker-scheduler.sh` starts endpoint on demand, auto-stops after 59 minutes to cap costs (~$0.12/session vs $86/month if left running)
- **Cost Controls** — Automatic teardown of expensive AWS resources, PID-tracked background stop process
- **WhatsNew Dashboard Component** — Timeline of recent additions visible on the status page
- **CHANGELOG** — Timeliner changelog tracking all project additions
- **MIT LICENSE** — Open source license
- **README with Badges** — CI/CD status, license, build status badges

### Changed
- Updated `Makefile` with cost-safe targets (`teardown-sagemaker`, `sagemaker-start`, `sagemaker-stop`)

## [0.3.0] - 2026-02-24

### Added
- **Bedrock Sentiment Analysis** — Claude 3 Haiku for mobile money support message sentiment classification (positive/negative/neutral + complaint/inquiry/praise/urgent)
- **Titan Embeddings V2** — Semantic vector generation for support ticket search
- **SageMaker Language Detection** — XLM-RoBERTa 20-language classifier endpoint (`wave-lang-detect`)
- **Docker Lambda Build** — Multi-stage `Dockerfile.lambda` compiling Rust+PyO3 into Lambda container images
- **EventBridge Fan-out** — Voice API publishes events to `wave-ml-events` bus, triggering Bedrock Lambda
- **CDK Stacks** — `WaveBedrockStack` and `WaveSageMakerStack` with full IAM, DynamoDB, API Gateway
- **Real Dashboard Health Probes** — Live AWS service health checks replacing hardcoded "up" indicators
- **Build Pipeline** — `scripts/build-lambdas.sh` for one-command build + deploy

### Changed
- Existing CDK stacks (`submission-stack`, `voice-stack`) upgraded from raw Python Lambda to DockerImageFunction with compiled Rust `.so`
- Voice handler now publishes to EventBridge after classification
- Dashboard status page expanded from 4 to 6 health cards (added Bedrock + SageMaker)
- `SystemStatusCharts` now pulls real data from `useAppStatus()` context

## [0.2.0] - 2026-02-23

### Added
- **Rust+PyO3 Backend** — `wave_backend` crate with `submit_resume` and `classify_intent` functions
- **Voice Classification** — Unicode-aware tokenization with Swahili keyword detection
- **CDK Infrastructure** — `WaveSubmissionStack` and `WaveVoiceStack` with DynamoDB, EventBridge, SNS, API Gateway
- **Dashboard** — Next.js status dashboard with system health, submission tracking, and charts

## [0.1.0] - 2026-02-22

### Added
- Initial project structure
- Backend Cargo.toml with PyO3, reqwest, serde dependencies
- Python Lambda handlers for submission and voice
- Dashboard scaffolding with shadcn/ui components
