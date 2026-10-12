#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
task_test_dir=$(mktemp -d /tmp/ai-stock-browser-XXXXXXXX)
export STOCK_SMOKE_DB="$task_test_dir/smoke.sqlite"
npm run test:e2e
