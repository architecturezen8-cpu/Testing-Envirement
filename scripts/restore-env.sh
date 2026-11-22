#!/usr/bin/env bash
# Restores .env from the backup template kept in /tmp/envbak.
# The sandbox resets .env on some restarts, which drops the Supabase URL and
# the admin credentials; run this if login suddenly fails with 401.
set -u
if [ -f /tmp/envbak/env.template ]; then
  cp /tmp/envbak/env.template "$(dirname "$0")/../.env"
  echo ".env restored from /tmp/envbak/env.template"
else
  echo "No backup template found at /tmp/envbak/env.template"
  exit 1
fi

# Warn if the Supabase URL is not actually in place.
if ! grep -q "supabase" "$(dirname "$0")/../.env"; then
  echo "WARNING: .env does not point at Supabase — restore may have failed."
fi
