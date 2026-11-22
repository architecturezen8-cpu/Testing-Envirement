#!/usr/bin/env bash
# Restores .env after the sandbox resets it.
#
# Reads scripts/env.template (git-ignored), so no secrets live in the repo.
#
# Usage: bash scripts/restore-env.sh

set -u
cd "$(dirname "$0")/.."

TEMPLATE="scripts/env.template"

if [ ! -f "$TEMPLATE" ]; then
  echo "Missing $TEMPLATE."
  echo "Create it locally with DATABASE_URL, ADMIN_USERNAME, ADMIN_PASSWORD and"
  echo "JWT_SECRET, then run this script again."
  exit 1
fi

cp "$TEMPLATE" .env
echo ".env restored from $TEMPLATE."

if ! grep -q "supabase" .env; then
  echo "WARNING: .env does not point at Supabase — check the template."
  exit 1
fi

echo "Restart the server so the new values are picked up."
