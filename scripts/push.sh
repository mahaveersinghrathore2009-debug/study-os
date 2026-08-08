#!/usr/bin/env bash
# Push StudyOS to GitHub.
# First time only: create the repo on github.com, then:
#   git remote add origin https://github.com/YOUR-USERNAME/StudyOS.git
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! git remote | grep -q origin; then
  echo "!! No 'origin' remote yet."
  echo "   1. Create the repo on github.com (empty, no README)"
  echo "   2. Run:  git remote add origin https://github.com/YOUR-USERNAME/StudyOS.git"
  exit 1
fi

echo "==> Pushing main and develop"
git push -u origin main
git push -u origin develop
echo "==> Done. Repo: $(git remote get-url origin)"
