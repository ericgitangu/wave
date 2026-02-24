# Changelog

All notable changes to the Wave project will be documented in this file.

## [0.7.0] - 2026-02-25

### Added
- **AWS Backend fully wired** — All 4 CDK stacks deployed: Submission, Voice, Bedrock, SageMaker
- **Voice API proxied to AWS Lambda** — `/api/voice` calls API Gateway → Lambda with local keyword fallback
- **Haptic toast notifications** — Vibration patterns per severity level (success/warning/error) on submissions and health changes
- **AWS credentials on Fly.io** — Health probes now hit real Lambda/SageMaker/Bedrock from production
- **Service docs in README** — What each AWS service does and why, with live endpoint URLs
- **SageMaker start/stop controls** — Inline start/stop buttons on the Status page SageMaker card with animated state transitions (starting → up → stopping → stopped)
- **Per-service provision API** — `/api/provision` POST accepts `service` field for targeted start/stop (backward compatible)

### Changed
- Dockerfile.lambda: Rust 1.85 + Python 3.12 from Lambda base image + patchelf
- Voice route: proxies to AWS API Gateway, gracefully falls back to local classification
- SageMaker quota resolved — ml.m5.large endpoint now operational
- Bedrock Claude model: switched from `claude-3-haiku` to `claude-3.5-haiku` via US inference profile (use case form not required)
- SageMaker auto-stop timeout: 10 minutes from app, 59 minutes from CLI script
- Provisioning context auto-stops SageMaker on page unload via `sendBeacon`

### Fixed
- Removed unused crypto encryption from API routes
- Bedrock Claude health probe: `degraded` → `up` by using US inference profile `us.anthropic.claude-3-5-haiku-20241022-v1:0`
- `.dockerignore` excludes `node_modules` from Fly build context (93MB → 1MB transfer)

## [0.6.0] - 2026-02-24

### Added
- **Upstash Redis** — Persistent submission history via Upstash Redis free tier (survives deploys)
- **Environment docs** — `.env.prod` for production, Fly.io secrets setup in README
- **Setup & Troubleshooting docs** — Local dev prerequisites, Docker workflow, PyO3/Python fixes, DNS setup
- **DNS section** — Custom domain `wave-apply.ericgitangu.com` CNAME instructions

### Changed
- Submissions GET endpoint reads from Redis instead of returning hardcoded data
- Submissions trigger POST persists each attempt to Redis with status labels (`delivered`, `auth_rejected`, `rate_limited`, `error`)
- Production voice URL updated from localhost to `https://wave-apply.ericgitangu.com/api/voice`
- README badges: added Upstash Redis

### Fixed
- Submission history no longer lost on redeploy (persisted in Redis)
- Removed fake "delivered" submission entry from GET endpoint

## [0.5.0] - 2026-02-24

### Added
- **Footer Component** — Persistent footer with contact links and build info
- **VCard Panel** — Downloadable vCard contact card overlay
- **Provisioning Gate** — Status-aware gate for SageMaker/Lambda warm-up with auto-poll (no longer auto-starts endpoints on page load)
- **Provisioning API** — `/api/provision` endpoint for on-demand SageMaker/Lambda start and status polling
- **Global Search** — Full-width Cmd+K search bar with voice input, keyboard navigation, and paginated results across projects/alignment/architecture
- **Submissions Page** — `/submissions` with manual trigger button, past submission history table (IDs, dates, times, status badges, names), session trigger log, payload preview with copy, and Wave API instructions
- **Submissions Trigger API** — `/api/submissions/trigger` POSTs the full `resume.json` payload to `api.wave.com/submit_resume` with bearer token
- **OG Image** — Dynamic OpenGraph image with profile photo, tech chips, and Wave branding
- **Profile Assets** — `eric-gitangu.jpg`, `eric-profile.png`, `wave-logo.png`

### Changed
- Sidebar logo: icon + gradient "Wave" text (works in both light and dark mode)
- Search bar stretches full width (`flex-1`) in header
- Health endpoint returns `degraded` instead of `down` for credential/throttling/access errors (pre-deployment friendly)
- Provisioning context auto-polls status on mount instead of auto-starting SageMaker endpoints
- Fly.io deployment region set to `jnb` (Johannesburg)
- Upgraded all dashboard components: AlignmentMatrix, ArchitectureDiagram, ProjectCard, VoiceAgent, ChatWidget, SplashBanner, SubmissionStatus, WhatsNew

### Fixed
- OG image logo no longer has brightness/invert filter that turned it white
- Sidebar logo no longer inverted to all-white in dark mode
- ProvisioningGate no longer blocks content during initial status poll

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
