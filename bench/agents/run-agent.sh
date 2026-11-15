#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
export AUDITAJA_ROOT="${AUDITAJA_ROOT:-$ROOT}"
export PATH="${PATH}:${HOME}/go/bin:/usr/local/go/bin"
exec node "$ROOT/bench/agents/deterministic.mjs" "$@"
