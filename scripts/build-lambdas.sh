#!/usr/bin/env bash
# Wave Lambda Build + Deploy Pipeline
# Builds compiled Rust+PyO3 Docker images and deploys all CDK stacks.
#
# Usage:
#   bash scripts/build-lambdas.sh          # full build + deploy
#   bash scripts/build-lambdas.sh --dry-run # build only, no deploy
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
INFRA_DIR="$ROOT_DIR/infra"

ACCOUNT_ID="${AWS_ACCOUNT_ID:-235494789150}"
REGION="${AWS_REGION:-us-east-1}"
ECR_REPO="wave-lambda"
IMAGE_TAG="latest"
DRY_RUN=false

if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=true
  echo "==> DRY RUN: will build but not deploy"
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

step() { echo -e "\n${GREEN}==> $1${NC}"; }
warn() { echo -e "${YELLOW}    WARN: $1${NC}"; }
fail() { echo -e "${RED}    FAIL: $1${NC}"; exit 1; }

# Step 1: Rust tests
step "Running cargo test in backend/"
cd "$BACKEND_DIR"
# PyO3 needs Python lib path for test binary linking + ABI3 compat for Python 3.14
export PYO3_USE_ABI3_FORWARD_COMPATIBILITY=1
PYTHON_LIB_DIR=$(python3 -c "import sysconfig; print(sysconfig.get_config_var('LIBDIR'))" 2>/dev/null || echo "")
PYTHON_LIB_NAME=$(python3 -c "import sysconfig; print(sysconfig.get_config_var('LDLIBRARY').replace('lib','').replace('.dylib','').replace('.so',''))" 2>/dev/null || echo "")
if [ -n "$PYTHON_LIB_DIR" ] && [ -n "$PYTHON_LIB_NAME" ]; then
  export RUSTFLAGS="-L $PYTHON_LIB_DIR -l $PYTHON_LIB_NAME"
fi
cargo test --release 2>&1 || fail "Cargo tests failed"
echo "    All Rust tests passed."

# Step 2: Docker build
step "Building Docker image (linux/amd64)"
cd "$BACKEND_DIR"
docker build \
  -f Dockerfile.lambda \
  --platform linux/amd64 \
  -t "$ECR_REPO:$IMAGE_TAG" \
  . 2>&1 || fail "Docker build failed"
echo "    Docker image built: $ECR_REPO:$IMAGE_TAG"

if $DRY_RUN; then
  step "Dry run complete. Skipping ECR push and CDK deploy."
  exit 0
fi

# Step 3: ECR login + push
step "Pushing to ECR"
aws ecr get-login-password --region "$REGION" | \
  docker login --username AWS --password-stdin "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com" 2>&1

# Create ECR repo if it doesn't exist
aws ecr describe-repositories --repository-names "$ECR_REPO" --region "$REGION" 2>/dev/null || \
  aws ecr create-repository --repository-name "$ECR_REPO" --region "$REGION" 2>&1

ECR_URI="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$ECR_REPO"
docker tag "$ECR_REPO:$IMAGE_TAG" "$ECR_URI:$IMAGE_TAG"
docker push "$ECR_URI:$IMAGE_TAG" 2>&1 || fail "ECR push failed"
echo "    Pushed: $ECR_URI:$IMAGE_TAG"

# Step 4: Upload resume payload to S3
step "Uploading payload to S3"
PAYLOAD_BUCKET="wave-submissions-$ACCOUNT_ID"
if [ -f "$ROOT_DIR/payload/resume.json" ]; then
  aws s3 cp "$ROOT_DIR/payload/resume.json" "s3://$PAYLOAD_BUCKET/resume.json" --region "$REGION" 2>&1 || \
    warn "S3 upload failed (bucket may not exist yet — CDK will create it)"
else
  warn "payload/resume.json not found, skipping S3 upload"
fi

# Step 5: CDK deploy
step "Deploying CDK stacks"
cd "$INFRA_DIR"
npx cdk deploy --all --require-approval never 2>&1 || fail "CDK deploy failed"
echo "    All stacks deployed."

# Step 6: Verify Bedrock Lambda
step "Verifying wave-bedrock-sentiment Lambda"
INVOKE_RESULT=$(aws lambda invoke \
  --function-name wave-bedrock-sentiment \
  --payload '{"text":"I love Wave! The service is amazing."}' \
  --region "$REGION" \
  --cli-binary-format raw-in-base64-out \
  /dev/stdout 2>/dev/null) || warn "Lambda invocation failed (may need Bedrock model access)"
echo "    Response: $INVOKE_RESULT"

# Step 7: Print endpoints
step "Deployed Endpoints"
echo "    Voice API:      $(aws ssm get-parameter --name /wave/voice-api-url --region $REGION --query Parameter.Value --output text 2>/dev/null || echo 'not found')"
echo "    LangDetect API: $(aws ssm get-parameter --name /wave/langdetect-api-url --region $REGION --query Parameter.Value --output text 2>/dev/null || echo 'not found')"
echo "    Bedrock Lambda: $(aws ssm get-parameter --name /wave/bedrock-lambda-arn --region $REGION --query Parameter.Value --output text 2>/dev/null || echo 'not found')"
echo "    SageMaker:      wave-lang-detect"
echo "    S3 Payload:     s3://$PAYLOAD_BUCKET/"

step "Build + deploy complete!"
