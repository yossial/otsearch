#!/usr/bin/env bash
# dev.sh — start all local services and the Next.js dev server
# Usage: ./dev.sh [--no-app]   (--no-app skips npm run dev)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

NO_APP=false
for arg in "$@"; do
  [[ "$arg" == "--no-app" ]] && NO_APP=true
done

# ── 1. Make sure Docker Desktop is running ────────────────────────────────────
if ! docker info &>/dev/null; then
  echo "Docker is not running — starting Docker Desktop..."
  # Windows: launch Docker Desktop and wait for daemon
  start "" "C:/Program Files/Docker/Docker/Docker Desktop.exe" 2>/dev/null || true
  echo -n "Waiting for Docker daemon"
  for i in $(seq 1 30); do
    sleep 2
    if docker info &>/dev/null; then echo " ready."; break; fi
    echo -n "."
    if [[ $i -eq 30 ]]; then echo ""; echo "ERROR: Docker did not start in 60 s. Launch Docker Desktop manually and retry."; exit 1; fi
  done
fi

# ── 2. Bring up Docker Compose services ──────────────────────────────────────
echo "Starting Docker services (MongoDB + Mongo Express)..."
docker compose up -d

# ── 3. Wait for MongoDB to accept connections ─────────────────────────────────
echo -n "Waiting for MongoDB on port 27017"
for i in $(seq 1 20); do
  sleep 1
  if docker compose exec -T mongo mongosh --quiet --eval "db.runCommand({ping:1})" &>/dev/null; then
    echo " ready."
    break
  fi
  echo -n "."
  if [[ $i -eq 20 ]]; then echo ""; echo "WARNING: MongoDB did not respond in 20 s — check 'docker compose logs mongo'"; fi
done

echo ""
echo "  MongoDB  →  mongodb://localhost:27017/otsearch"
echo "  Mongo UI →  http://localhost:8081"
echo ""

# ── 4. Start Next.js dev server ───────────────────────────────────────────────
if [[ "$NO_APP" == false ]]; then
  echo "Starting Next.js dev server..."
  npm run dev
fi
