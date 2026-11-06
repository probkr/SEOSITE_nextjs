#!/usr/bin/env bash
# Deploys one commit from main to this server. GitHub Actions calls it over SSH with the commit
# SHA, and it can also be run by hand: bash scripts/deploy.sh <full-commit-sha>
#
# Only services whose files changed are rebuilt. A failed build leaves the running site untouched,
# and a failed health check puts the previous images back.
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

SHA=${SSH_ORIGINAL_COMMAND:-${1:-}}
HEALTH_URLS=(https://prbroker.in/ https://prbroker.in/admin/login https://api.prbroker.in/health)

log() { echo "[deploy] $*"; }
fail() { echo "[deploy] ERROR: $*" >&2; exit 1; }

[[ $SHA =~ ^[0-9a-f]{40}$ ]] || fail 'expected a full 40-character commit SHA'

exec 9>.git/deploy.lock
flock -n 9 || fail 'another deploy is already running'

[ -z "$(git status --porcelain --untracked-files=no)" ] \
  || fail 'tracked files were edited on the server; commit those changes through GitHub first'

git fetch --quiet origin main
git merge-base --is-ancestor "$SHA" origin/main || fail "$SHA is not on main"

PREV=$(git rev-parse HEAD)
if [ "$PREV" = "$SHA" ]; then
  log 'already on this commit'
  exit 0
fi

CHANGED=$(git diff --name-only "$PREV" "$SHA")
SERVICES=()
if grep -qE '^(probroker-api/|docker-compose)' <<<"$CHANGED"; then SERVICES+=(api); fi
if grep -qE '^(probroker-web/|docker-compose)' <<<"$CHANGED"; then SERVICES+=(web); fi
NGINX_CHANGED=false
if grep -q '^nginx/' <<<"$CHANGED"; then NGINX_CHANGED=true; fi

log "deploying ${SHA:0:7} over ${PREV:0:7}; services: ${SERVICES[*]:-none}; nginx: $NGINX_CHANGED"
git checkout --quiet --detach "$SHA"

if [ ${#SERVICES[@]} -eq 0 ] && [ "$NGINX_CHANGED" = false ]; then
  log 'no running service changed'
  exit 0
fi

healthy() {
  local url code
  for _ in $(seq 1 12); do
    local ok=true
    for url in "${HEALTH_URLS[@]}"; do
      code=$(curl -s -o /dev/null -m 15 -w '%{http_code}' "$url" || true)
      if [ "$code" != 200 ]; then
        ok=false
        log "waiting: $url returned $code"
      fi
    done
    if [ "$ok" = true ]; then return 0; fi
    sleep 5
  done
  return 1
}

# Containers get a new address when recreated, and nginx only looks them up on load.
reload_nginx() {
  sleep 10
  docker exec probroker-nginx nginx -s reload
}

# nginx mounts its config as a single file, and git replaces that file, so a reload would keep
# reading the old copy. Recreating the container picks up the new one.
restart_nginx_if_changed() {
  if [ "$NGINX_CHANGED" = true ]; then
    docker compose up -d --no-deps --force-recreate nginx
  fi
}

rollback() {
  log "health check failed, returning to ${PREV:0:7}"
  git checkout --quiet --detach "$PREV"
  local service
  for service in "${SERVICES[@]}"; do
    docker tag "probroker-$service:rollback" "probroker-$service:latest"
  done
  if [ ${#SERVICES[@]} -gt 0 ]; then
    docker compose up -d --no-deps --force-recreate "${SERVICES[@]}"
  fi
  restart_nginx_if_changed
  reload_nginx
  if healthy; then
    log 'previous version restored'
  else
    log 'previous version is NOT healthy, check the server now'
  fi
  exit 1
}

if [ ${#SERVICES[@]} -gt 0 ]; then
  for service in "${SERVICES[@]}"; do
    docker tag "probroker-$service:latest" "probroker-$service:rollback"
  done
  if ! docker compose build "${SERVICES[@]}"; then
    git checkout --quiet --detach "$PREV"
    fail 'build failed; the running site was not changed'
  fi
  docker compose up -d --no-deps "${SERVICES[@]}"
fi

restart_nginx_if_changed
reload_nginx
healthy || rollback

docker image prune -f >/dev/null
log "live on ${SHA:0:7}"
