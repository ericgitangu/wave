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
PID_FILE="/tmp/wave-sagemaker-autostop.pid"

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

# Check if an auto-stop process is already running
autostop_running() {
  if [ -f "$PID_FILE" ]; then
    local pid
    pid=$(cat "$PID_FILE")
    if kill -0 "$pid" 2>/dev/null; then
      return 0
    fi
    # Stale PID file — clean up
    rm -f "$PID_FILE"
  fi
  return 1
}

cmd_status() {
  local status
  status=$(get_status)
  echo -e "Endpoint: $ENDPOINT_NAME"
  echo -e "Region:   $REGION"
  echo -e "Status:   $status"

  case "$status" in
    InService)
      echo -e "          ${GREEN}Running — remember to stop when done!${NC}"
      if autostop_running; then
        echo -e "          Auto-stop PID: $(cat "$PID_FILE") (active)"
      else
        echo -e "          ${YELLOW}No auto-stop scheduled!${NC}"
      fi
      ;;
    Creating|Updating)
      echo -e "          ${YELLOW}$status — wait for InService${NC}"
      ;;
    Deleting)
      echo -e "          ${YELLOW}Shutting down...${NC}"
      ;;
    Failed)
      echo -e "          ${RED}Endpoint failed — check CloudWatch logs${NC}"
      ;;
    NOT_FOUND)
      echo -e "          ${YELLOW}Not deployed — run 'start' to create${NC}"
      ;;
    *)
      echo -e "          ${YELLOW}$status${NC}"
      ;;
  esac
}

cmd_start() {
  local status
  status=$(get_status)

  case "$status" in
    InService)
      step "Endpoint already running"
      # Reschedule auto-stop (resets the timer)
      cancel_autostop
      schedule_auto_stop
      return
      ;;
    Creating)
      step "Endpoint already being created — waiting for InService"
      wait_for_service
      cancel_autostop
      schedule_auto_stop
      return
      ;;
    Updating)
      step "Endpoint updating — waiting for InService"
      wait_for_service
      cancel_autostop
      schedule_auto_stop
      return
      ;;
    Deleting)
      step "Endpoint is deleting — waiting for it to finish before recreating"
      while [ "$(get_status)" = "Deleting" ]; do
        sleep 5
      done
      # Fall through to create
      ;;
    Failed)
      warn "Previous endpoint failed — deleting and recreating"
      aws sagemaker delete-endpoint \
        --endpoint-name "$ENDPOINT_NAME" \
        --region "$REGION" 2>/dev/null || true
      sleep 5
      ;;
  esac

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
    warn "create-endpoint call failed — may already exist"
    # Re-check status
    local recheck
    recheck=$(get_status)
    if [ "$recheck" = "InService" ] || [ "$recheck" = "Creating" ]; then
      step "Endpoint exists ($recheck)"
    else
      fail "Could not create endpoint (status: $recheck)"
    fi
  }

  wait_for_service
  schedule_auto_stop
}

wait_for_service() {
  step "Waiting for endpoint to reach InService (this takes 5-10 min)..."
  local i=0
  while [ $i -lt 120 ]; do
    local status
    status=$(get_status)
    case "$status" in
      InService)
        echo -e "    ${GREEN}Endpoint is InService!${NC}"
        return
        ;;
      Failed)
        fail "Endpoint creation failed. Check CloudWatch logs."
        ;;
      NOT_FOUND)
        fail "Endpoint disappeared during creation."
        ;;
    esac
    echo "    Status: $status (waiting... ${i}0s elapsed)"
    sleep 10
    i=$((i + 1))
  done
  fail "Timeout waiting for endpoint (20 minutes)."
}

cancel_autostop() {
  if [ -f "$PID_FILE" ]; then
    local pid
    pid=$(cat "$PID_FILE")
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
      echo "    Cancelled previous auto-stop (PID $pid)"
    fi
    rm -f "$PID_FILE"
  fi
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
    rm -f "$PID_FILE"
  ) &
  local bg_pid=$!
  echo "$bg_pid" > "$PID_FILE"
  echo "    Background stop PID: $bg_pid"
  echo "    To cancel auto-stop: kill $bg_pid"
}

cmd_stop() {
  step "Stopping SageMaker endpoint: $ENDPOINT_NAME"

  # Kill any pending auto-stop
  cancel_autostop

  local status
  status=$(get_status)
  if [ "$status" = "NOT_FOUND" ] || [ "$status" = "Deleting" ]; then
    echo "    Endpoint already stopped/deleting."
    return
  fi

  aws sagemaker delete-endpoint \
    --endpoint-name "$ENDPOINT_NAME" \
    --region "$REGION" 2>/dev/null \
    && echo -e "    ${GREEN}Endpoint deletion initiated. Cost will stop shortly.${NC}" \
    || warn "delete-endpoint failed — may already be deleted."
}

case "${1:-status}" in
  start)  cmd_start ;;
  stop)   cmd_stop ;;
  status) cmd_status ;;
  *)      echo "Usage: $0 {start|stop|status}" ;;
esac
