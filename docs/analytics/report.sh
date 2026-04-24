#!/usr/bin/env bash
# Run the saved Athena queries and print results as readable tables.
# Usage:    bash docs/analytics/report.sh
# Override: WORKGROUP=foo RESULT_LOC=s3://bucket/path/ bash docs/analytics/report.sh

set -euo pipefail

WORKGROUP="${WORKGROUP:-primary}"
RESULT_LOC="${RESULT_LOC:-s3://slabble-events/_athena_results/}"
DATABASE="slabble"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

submit() {
  aws athena start-query-execution \
    --query-string "$1" \
    --work-group "$WORKGROUP" \
    --result-configuration "OutputLocation=$RESULT_LOC" \
    --query 'QueryExecutionId' --output text
}

wait_for() {
  local qid="$1"
  local elapsed=0
  while [ "$elapsed" -lt 120 ]; do
    local state
    state=$(aws athena get-query-execution \
      --query-execution-id "$qid" \
      --query 'QueryExecution.Status.State' --output text)
    case "$state" in
      SUCCEEDED) return 0 ;;
      FAILED|CANCELLED)
        aws athena get-query-execution \
          --query-execution-id "$qid" \
          --query 'QueryExecution.Status.StateChangeReason' --output text
        return 1
        ;;
    esac
    sleep 2
    elapsed=$((elapsed + 2))
  done
  echo "  timeout after ${elapsed}s"
  return 1
}

run_report() {
  local title="$1"
  local sql_file="$2"
  printf '\n\033[1m=== %s ===\033[0m\n' "$title"
  local qid
  qid=$(submit "$(cat "$sql_file")")
  if wait_for "$qid"; then
    local csv
    csv=$(aws s3 cp "${RESULT_LOC%/}/${qid}.csv" - 2>/dev/null)
    if [ -z "$csv" ] || [ "$(printf '%s' "$csv" | wc -l)" -le 1 ]; then
      echo "  (no rows)"
    else
      printf '%s\n' "$csv" | column -t -s ','
    fi
  fi
}

printf 'slabble analytics report — %s\n' "$(date '+%Y-%m-%d %H:%M %Z')"

printf 'Refreshing partitions...'
qid=$(submit "MSCK REPAIR TABLE $DATABASE.events")
if wait_for "$qid" >/dev/null; then
  printf ' done\n'
else
  printf ' failed (continuing)\n'
fi

run_report "Daily funnel (last 14 days)"       "$SCRIPT_DIR/funnel.sql"
run_report "Latest puzzle grade histogram"     "$SCRIPT_DIR/grade_histogram.sql"
run_report "Day-N retention (last 60 days)"    "$SCRIPT_DIR/retention.sql"
