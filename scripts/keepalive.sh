#!/usr/bin/env bash
# KeepAlive supervisor — prevents Cloudflare tunnel error 1033.
#
# Error 1033 means Cloudflare cannot reach the tunnel, which happens when
# either the Next.js server or the cloudflared process dies (e.g. after a
# sandbox restart). This daemon watches both and restarts whatever is down.
#
# Usage:
#   bash scripts/keepalive.sh start     # launch the supervisor (detached)
#   bash scripts/keepalive.sh status    # show app + tunnel state
#   bash scripts/keepalive.sh stop      # stop the supervisor
#   bash scripts/keepalive.sh run       # run the loop in the foreground
#
# The current public URL is written to /tmp/tunnel/PUBLIC_URL.

set -u
cd "$(dirname "$0")/.."

ROOT="$(pwd)"
STATE_DIR="${STATE_DIR:-/tmp/tunnel}"
PORT="${PORT:-3000}"
HEALTH_URL="http://localhost:$PORT/api/health"
CHECK_EVERY="${CHECK_EVERY:-20}"
LOG="$STATE_DIR/keepalive.log"
URL_FILE="$STATE_DIR/PUBLIC_URL"
CF_BIN="$STATE_DIR/cloudflared"
CF_URL="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64"

mkdir -p "$STATE_DIR"

log() { echo "[$(date '+%H:%M:%S')] $*" >>"$LOG"; }

# ---------- app ----------
app_up() { curl -s -o /dev/null --max-time 8 -w '%{http_code}' "$HEALTH_URL" 2>/dev/null | grep -q 200; }

# True when something already owns the port (e.g. the platform runtime).
port_taken() { curl -s -o /dev/null --max-time 5 "http://localhost:$PORT" 2>/dev/null; }

start_app() {
  # Never fight another process for the port — a platform-managed runtime may
  # simply be mid-restart, in which case waiting is the right move.
  if port_taken; then
    log "port $PORT already has a listener — waiting for it to become healthy"
    return 0
  fi
  if [ ! -d .next ]; then
    log "no .next build — building"
    npm run build >>"$LOG" 2>&1
  fi
  log "starting Next.js on :$PORT"
  setsid nohup npm run start -- -p "$PORT" >>"$STATE_DIR/app.log" 2>&1 < /dev/null &
  disown || true
}

# ---------- tunnel ----------
tunnel_url() { [ -f "$URL_FILE" ] && cat "$URL_FILE" || true; }
cf_pid()     { pgrep -f "cloudflared tunnel --url" | head -1 || true; }
cf_alive()   { [ -n "$(cf_pid)" ]; }

start_tunnel() {
  if [ ! -x "$CF_BIN" ]; then
    log "downloading cloudflared"
    curl -sL --max-time 180 -o "$CF_BIN" "$CF_URL"
    chmod +x "$CF_BIN"
  fi

  : >"$STATE_DIR/tunnel.log"
  log "starting cloudflared -> http://localhost:$PORT"
  setsid nohup "$CF_BIN" tunnel --url "http://localhost:$PORT" \
      --no-autoupdate --protocol http2 \
      >>"$STATE_DIR/tunnel.log" 2>&1 < /dev/null &
  disown || true

  # Wait for the edge to hand us a hostname.
  for _ in $(seq 1 40); do
    sleep 2
    U=$(grep -o "https://[a-z0-9-]*\.trycloudflare\.com" "$STATE_DIR/tunnel.log" 2>/dev/null | tail -1)
    if [ -n "$U" ]; then
      printf '%s' "$U" >"$URL_FILE"
      log "tunnel up: $U"
      return 0
    fi
  done
  log "tunnel did not report a URL yet (will retry)"
  return 1
}

# ---------- one supervision cycle ----------
cycle() {
  # 1. app
  if ! app_up; then
    log "APP DOWN (health check failed)"
    start_app
    # give it time to boot
    for _ in $(seq 1 25); do sleep 3; app_up && break; port_taken && continue; done
    app_up && log "APP RECOVERED" || log "APP still failing"
  fi

  # 2. tunnel — alive AND actually connected to the edge
  if ! cf_alive; then
    log "TUNNEL PROCESS DEAD (1033 condition)"
    rm -f "$STATE_DIR/cloudflared.pid"
    start_tunnel
  else
    # A running cloudflared can still lose its connection; verify the edge
    # can actually serve through it before declaring it healthy.
    U="$(tunnel_url)"
    if [ -n "$U" ]; then
      code=$(curl -s -o /dev/null --max-time 12 -w '%{http_code}' "$U/api/health" 2>/dev/null)
      if [ "$code" != "200" ]; then
        log "TUNNEL UNREACHABLE (edge returned $code) — restarting"
        pkill -f "cloudflared tunnel" 2>/dev/null
        rm -f "$STATE_DIR/cloudflared.pid"
        sleep 3
        start_tunnel
      fi
    else
      log "TUNNEL RUNNING but no URL recorded — restarting"
      start_tunnel
    fi
  fi
}

# ---------- control ----------
case "${1:-run}" in
  status)
    echo "── App (:$(printf '%s' "$PORT")) ─────────────────────────"
    app_up && echo "  ✓ serving" || echo "  ✗ DOWN"
    echo "── Tunnel ────────────────────────────────"
    cf_alive && echo "  ✓ cloudflared running (pid $(cf_pid))" || echo "  ✗ cloudflared dead"
    U="$(tunnel_url)"
    echo "  URL: ${U:-<none yet>}"
    if [ -n "$U" ]; then
      code=$(curl -s -o /dev/null --max-time 12 -w '%{http_code}' "$U/api/health" 2>/dev/null)
      echo "  edge check: $code $([ "$code" = 200 ] && echo '(healthy)' || echo '(1033 if not 200)')"
    fi
    SUP="$(pgrep -f "keepalive.sh run" | head -1 || true)"
    echo "  supervisor: $([ -n "$SUP" ] && echo "running (pid $SUP)" || echo "NOT running")"
    echo "──────────────────────────────────────────"
    [ -n "$U" ] && echo "" && echo "PUBLIC URL: $U"
    ;;

  stop)
    pkill -f "keepalive.sh" 2>/dev/null
    pkill -f "cloudflared tunnel" 2>/dev/null
    echo "Supervisor and tunnel stopped."
    ;;

  run)
    log "===== supervisor started ====="
    # Boot both components if needed, then keep watching forever.
    cycle
    while true; do
      sleep "$CHECK_EVERY"
      cycle
    done
    ;;

  start)
    if [ -n "$(pgrep -f "keepalive.sh run" | head -1)" ]; then
      echo "Supervisor already running (pid $(pgrep -f 'keepalive.sh run' | head -1))."
      bash "$0" status
      exit 0
    fi
    ( setsid nohup bash "$0" run >>"$LOG" 2>&1 < /dev/null & )
    sleep 1
    echo "Supervisor launched. Waiting for the tunnel..."
    for _ in $(seq 1 45); do
      sleep 2
      U="$(tunnel_url)"
      [ -n "$U" ] && break
    done
    bash "$0" status
    ;;

  *)
    echo "Usage: $0 [start|status|stop|run]"
    exit 1
    ;;
esac
