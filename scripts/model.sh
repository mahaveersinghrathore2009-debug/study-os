#!/usr/bin/env bash
# Download a local model for the StudyOS assistant (via Ollama).
MODEL="${1:-qwen2.5:7b}"
if ! command -v ollama >/dev/null 2>&1; then
  echo "Ollama is not installed. Get it at https://ollama.com"
  exit 1
fi
echo "==> Pulling $MODEL (several GB, runs 100% locally)"
ollama pull "$MODEL"
echo "==> Done. Select '$MODEL' in StudyOS Settings > AI."
