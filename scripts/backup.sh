#!/usr/bin/env bash
# Manual backup: copy the encrypted backups + database to a folder of your choice.
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="${1:-$ROOT/backups-export}"
mkdir -p "$DEST"
if [ -d "$ROOT/backend/data/backups" ]; then
  cp -r "$ROOT/backend/data/backups/." "$DEST/"
fi
if [ -f "$ROOT/backend/data/studyos.db" ]; then
  cp "$ROOT/backend/data/studyos.db" "$DEST/"
fi
echo "==> Backup saved to $DEST"
