#!/usr/bin/env bash
# Boot the keepalive supervisor in a way that survives the caller exiting.
#
# The tool harness reaps background jobs when a command returns, so this
# script uses `setsid` + `nohup` + a double fork, then immediately returns
# without holding any pipe open (which is what trips the reaper).
#
# Usage: bash scripts/boot-tunnel.sh [--wait]

set -u
cd "$(dirname "$0")/.."
STATE_DIR="${STATE_DIR:-/tmp/tunnel}"
mkdir -p "$STATE_DIR"

# Already up?
if pgrep -f "keepalive[.]sh run" >/dev/null 2>&1; then
  echo "supervisor: already running"
else
  # Double-fork so the supervisor is re-parented to init and the harness
  # cannot reap it when this command finishes.
  (
    setsid nohup bash "$PWD/scripts/keepalive.sh" run \
      </dev/null >>"$STATE_DIR/keepalive.log" 2>&1 &
  )
  echo "supervisor: launched"
fi

if [ "${1:-}" = "--wait" ]; then
  for _ in $(seq 1 30); do
    [ -s "$STATE_DIR/PUBLIC_URL" ] && break
    sleep 2
  done
fi

if [ -s "$STATE_DIR/PUBLIC_URL" ]; then
  echo "PUBLIC_URL: $(cat "$STATE_DIR/PUBLIC_URL")"
else
  echo "PUBLIC_URL: (not yet — check: bash scripts/keepalive.sh status)"
fi
