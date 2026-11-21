#!/usr/bin/env bash
# Public tunnel for the Nova Store sandbox.
#
# The sandbox's *.e2b.app preview URL is not reachable from the public internet,
# so we run a Cloudflare quick tunnel (no auth token / signup required) that
# forwards a public trycloudflare.com URL to the app on localhost:3000.
#
# Usage:
#   bash scripts/tunnel.sh          # start (or restart) the tunnel
#   bash scripts/tunnel.sh status   # print the current public URL
#   bash scripts/tunnel.sh stop     # kill the tunnel
#
# Requires the app to be running on port 3000 first (npm run build && npm run start).

set -u

TUNNEL_DIR="${TUNNEL_DIR:-/tmp/tunnel}"
BIN="$TUNNEL_DIR/cloudflared"
LOG="$TUNNEL_DIR/tunnel.log"
PORT="${PORT:-3000}"
URL="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64"

stop() {
  pkill -f "cloudflared tunnel" 2>/dev/null && echo "Tunnel stopped." || echo "No tunnel running."
}

status() {
  if pgrep -f "cloudflared tunnel" >/dev/null 2>&1; then
    grep -o "https://[a-z0-9-]*\.trycloudflare\.com" "$LOG" | tail -1
  else
    echo "No tunnel running."
  fi
}

case "${1:-start}" in
  stop) stop ;;
  status) status ;;
  start)
    stop >/dev/null 2>&1
    mkdir -p "$TUNNEL_DIR"

    if [ ! -x "$BIN" ]; then
      echo "Downloading cloudflared..."
      curl -sL --max-time 180 -o "$BIN" "$URL"
      chmod +x "$BIN"
    fi
    echo "Using $( [ -x "$BIN" ] && "$BIN" --version )"

    rm -f "$LOG"
    # detached, survives this script exiting
    setsid nohup "$BIN" tunnel --url "http://localhost:$PORT" --no-autoupdate >"$LOG" 2>&1 < /dev/null &

    echo "Waiting for the public URL..."
    for _ in $(seq 1 30); do
      sleep 2
      URL_OUT=$(grep -o "https://[a-z0-9-]*\.trycloudflare\.com" "$LOG" | tail -1)
      if [ -n "$URL_OUT" ]; then
        echo ""
        echo "===================================================="
        echo "  PUBLIC URL:  $URL_OUT"
        echo "  ADMIN PANEL: $URL_OUT/admin/login"
        echo "  HEALTH:      $URL_OUT/api/health"
        echo "===================================================="
        exit 0
      fi
    done

    echo "Timed out waiting for a URL. Last log lines:"
    tail -15 "$LOG"
    exit 1
    ;;
  *)
    echo "Usage: $0 [start|status|stop]"
    exit 1
    ;;
esac
