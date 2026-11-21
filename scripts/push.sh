#!/usr/bin/env bash
# Push the current project state to GitHub.
#
# Run this after every change so the code is always safe on GitHub, even if
# the sandbox preview URL changes or the environment is reset.
#
# Usage:
#   bash scripts/push.sh                 # commit all changes + push
#   bash scripts/push.sh "my message"    # commit with a custom message + push
#
# Remote and token are read from .env (GITHUB_REPO / GITHUB_TOKEN) or from
# the git remote "origin" configured by this script.

set -euo pipefail
cd "$(dirname "$0")/.."

# ---- Load config from .env if present ----
if [ -f .env ]; then
  # shellcheck disable=SC1091
  GITHUB_REPO="${GITHUB_REPO:-$(grep -E '^GITHUB_REPO=' .env | cut -d= -f2- || true)}"
  GITHUB_TOKEN="${GITHUB_TOKEN:-$(grep -E '^GITHUB_TOKEN=' .env | cut -d= -f2- || true)}"
  BRANCH="${GIT_BRANCH:-$(grep -E '^GIT_BRANCH=' .env | cut -d= -f2- || true)}"
fi

GITHUB_REPO="${GITHUB_REPO:-architecturezen8-cpu/Testing-Envirement}"
BRANCH="${BRANCH:-main}"

# ---- Ensure git identity ----
git config user.name  >/dev/null 2>&1 || git config user.name  "architecturezen8-cpu"
git config user.email >/dev/null 2>&1 || git config user.email "architecturezen8-cpu@users.noreply.github.com"

# ---- Ensure remote exists ----
if ! git remote get-url origin >/dev/null 2>&1; then
  git remote add origin "https://architecturezen8-cpu:${GITHUB_TOKEN}@github.com/${GITHUB_REPO}.git"
fi

# ---- Make sure we are on the branch and up to date with it ----
CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
  git fetch origin "$BRANCH"
  git rebase "origin/$BRANCH" || {
    echo "Rebase conflicts — resolve them, then: git add -A && git rebase --continue && bash scripts/push.sh"
    exit 1
  }
fi

# ---- Anything to commit? ----
if [ -n "$(git status --porcelain)" ]; then
  MSG="${1:-Update: $(date '+%Y-%m-%d %H:%M')}"
  git add -A
  git commit -q -m "$MSG"
  echo "Committed: $MSG"
else
  echo "Nothing to commit."
fi

# ---- Push ----
if git push origin "$BRANCH" 2>&1 | grep -q "rejected"; then
  echo "Remote moved — rebasing and retrying..."
  git fetch origin "$BRANCH"
  git rebase "origin/$BRANCH" || {
    echo "Rebase conflicts — resolve them, then: git add -A && git rebase --continue && bash scripts/push.sh"
    exit 1
  }
  git push origin "$BRANCH"
fi

LOCAL_SHA="$(git rev-parse --short HEAD)"
echo ""
echo "===================================================="
echo "  PUSHED  ${LOCAL_SHA}  ->  ${GITHUB_REPO}@${BRANCH}"
echo "  https://github.com/${GITHUB_REPO}/commit/${LOCAL_SHA}"
echo "===================================================="
