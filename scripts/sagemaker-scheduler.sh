#!/usr/bin/env bash
# SageMaker Auto-Start/Stop Scheduler
# Starts the endpoint on demand and auto-stops after 59 minutes to cap costs.
#
# Usage:
#   bash scripts/sagemaker-scheduler.sh start   # Start endpoint, auto-stop in 59m
#   bash scripts/sagemaker-scheduler.sh stop    # Stop immediately
#   bash scripts/sagemaker-scheduler.sh status  # Check endpoint status
#
# Cost context:
#   ml.m5.large = ~$0.12/hr → 59min session = ~$0.12
#   Left running 24/7 = ~$86/month — ALWAYS stop when not demoing!
set -euo pipefail

REGION="${AWS_REGION:-us-east-1}"
ENDPOINT_NAME="wave-lang-detect"
CONFIG_NAME="wave-lang-detect-config"
MODEL_NAME="wave-lang-detect-model"
AUTO_STOP_MINUTES=59

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

step() { echo -e "\n${GREEN}==> $1${NC}"; }
warn() { echo -e "${YELLOW}    WARN: $1${NC}"; }
fail() { echo -e "${RED}    FAIL: $1${NC}"; exit 1; }

get_status() {
  aws sagemaker describe-endpoint \
    --endpoint-name "$ENDPOINT_NAME" \
    --region "$REGION" \
    --query 'EndpointStatus' \
    --output text 2>/dev/null || echo "NOT_FOUND"
}

cmd_status() {
  local status
  status=$(get_status)
  echo -e "Endpoint: $ENDPOINT_NAME"
  echo -e "Status:   $status"
  if [ "$status" = "InService" ]; then
    echo -e "          ${GREEN}Running — remember to stop when done!${NC}"
  elif [ "$status" = "NOT_FOUND" ]; then
    echo -e "          ${YELLOW}Not deployed${NC}"
  else
    echo -e "          ${YELLOW}$status${NC}"
  fi
}

cmd_start() {
  local status
  status=$(get_status)

  if [ "$status" = "InService" ]; then
    echo "Endpoint already running."
    echo "Auto-stop scheduled in ${AUTO_STOP_MINUTES} minutes."
    schedule_auto_stop
    return
  fi

  if [ "$status" = "Creating" ]; then
    echo "Endpoint is already being created. Waiting..."
    wait_for_service
    schedule_auto_stop
    return
  fi

  step "Creating SageMaker endpoint: $ENDPOINT_NAME"

  # Ensure model exists
  aws sagemaker describe-model --model-name "$MODEL_NAME" --region "$REGION" >/dev/null 2>&1 || {
    step "Re-deploying via CDK (model not found)..."
    cd "$(dirname "$0")/../infra"
    npx cdk deploy WaveSageMakerStack --require-approval never 2>&1
  }

  # Ensure endpoint config exists
  aws sagemaker describe-endpoint-config --endpoint-config-name "$CONFIG_NAME" --region "$REGION" >/dev/null 2>&1 || {
    fail "Endpoint config $CONFIG_NAME not found. Run 'make deploy' first."
  }

  # Create endpoint
  aws sagemaker create-endpoint \
    --endpoint-name "$ENDPOINT_NAME" \
    --endpoint-config-name "$CONFIG_NAME" \
    --region "$REGION" 2>/dev/null || {
    warn "create-endpoint failed — may already exist or be creating"
  }

  wait_for_service
  schedule_auto_stop
}

wait_for_service() {
  step "Waiting for endpoint to reach InService (this takes 5-10 min)..."
  local i=0
  while [ $i -lt 60 ]; do
    local status
    status=$(get_status)
    if [ "$status" = "InService" ]; then
      echo -e "    ${GREEN}Endpoint is InService!${NC}"
      return
    elif [ "$status" = "Failed" ]; then
      fail "Endpoint creation failed."
    fi
    echo "    Status: $status (waiting... ${i}0s elapsed)"
    sleep 10
    i=$((i + 1))
  done
  fail "Timeout waiting for endpoint."
}

schedule_auto_stop() {
  step "Auto-stop scheduled in ${AUTO_STOP_MINUTES} minutes"
  echo "    Run 'bash scripts/sagemaker-scheduler.sh stop' to stop manually."

  # Background process to auto-stop
  (
    sleep $((AUTO_STOP_MINUTES * 60))
    echo -e "\n${YELLOW}==> Auto-stopping SageMaker endpoint after ${AUTO_STOP_MINUTES}min${NC}"
    aws sagemaker delete-endpoint \
      --endpoint-name "$ENDPOINT_NAME" \
      --region "$REGION" 2>/dev/null || true
    echo -e "${GREEN}    Endpoint deleted. Cost stopped.${NC}"
  ) &
  local bg_pid=$!
  echo "    Background stop PID: $bg_pid"
  echo "    To cancel auto-stop: kill $bg_pid"
  echo "$bg_pid" > "/tmp/wave-sagemaker-autostop.pid"
}

cmd_stop() {
  step "Stopping SageMaker endpoint: $ENDPOINT_NAME"

  # Kill any pending auto-stop
  if [ -f /tmp/wave-sagemaker-autostop.pid ]; then
    local pid
    pid=$(cat /tmp/wave-sagemaker-autostop.pid)
    kill "$pid" 2>/dev/null || true
    rm -f /tmp/wave-sagemaker-autostop.pid
  fi

  bash "$(dirname "$0")/teardown-sagemaker.sh"
}

case "${1:-status}" in
  start)  cmd_start ;;
  stop)   cmd_stop ;;
  status) cmd_status ;;
  *)      echo "Usage: $0 {start|stop|status}" ;;
esac
