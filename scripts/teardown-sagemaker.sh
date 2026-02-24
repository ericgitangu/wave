#!/usr/bin/env bash
# Teardown SageMaker endpoint to stop costs when not demoing.
# The model and config are cheap to keep; the endpoint (~$0.12/hr) is not.
#
# Usage:
#   bash scripts/teardown-sagemaker.sh
set -euo pipefail

REGION="${AWS_REGION:-us-east-1}"
ENDPOINT_NAME="wave-lang-detect"
CONFIG_NAME="wave-lang-detect-config"
MODEL_NAME="wave-lang-detect-model"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

step() { echo -e "\n${GREEN}==> $1${NC}"; }
warn() { echo -e "${YELLOW}    WARN: $1${NC}"; }

step "Deleting SageMaker endpoint: $ENDPOINT_NAME"
aws sagemaker delete-endpoint \
  --endpoint-name "$ENDPOINT_NAME" \
  --region "$REGION" 2>/dev/null \
  && echo "    Endpoint deleted." \
  || warn "Endpoint not found or already deleted."

step "Deleting endpoint config: $CONFIG_NAME"
aws sagemaker delete-endpoint-config \
  --endpoint-config-name "$CONFIG_NAME" \
  --region "$REGION" 2>/dev/null \
  && echo "    Config deleted." \
  || warn "Config not found or already deleted."

step "Deleting model: $MODEL_NAME"
aws sagemaker delete-model \
  --model-name "$MODEL_NAME" \
  --region "$REGION" 2>/dev/null \
  && echo "    Model deleted." \
  || warn "Model not found or already deleted."

step "SageMaker teardown complete. No more endpoint costs."
echo "    To recreate: bash scripts/build-lambdas.sh"
