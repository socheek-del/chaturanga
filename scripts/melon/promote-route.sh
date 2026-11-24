#!/usr/bin/env bash
# Run on Melon with a complete Caddyfile candidate. Reload only after validation.
set -euo pipefail

if [[ $# != 3 || ! $2 =~ ^[a-zA-Z0-9][a-zA-Z0-9.-]*$ || ! $3 =~ ^/[a-zA-Z0-9./_-]*$ ]]; then
  echo 'Usage: promote-route.sh <candidate-Caddyfile> <hostname> <smoke-path>' >&2
  exit 2
fi
candidate=$1
hostname=$2
smoke_path=$3
container=${MELON_CADDY_CONTAINER:-caddy-proxy}
caddyfile=${MELON_CADDYFILE:-$HOME/caddy-proxy/Caddyfile}
port=${MELON_HTTPS_PORT:-443}
admin=${MELON_CADDY_ADMIN:-localhost:2019}
umask 077

exec 9>"$caddyfile.chaturanga.lock"
flock -x 9
backup=$(mktemp "$caddyfile.previous.XXXXXX")
cp -- "$caddyfile" "$backup"
workdir=$(docker exec "$container" mktemp -d)
reloaded=false
persisting=false

cleanup() {
  local status=$?
  trap - EXIT
  if (( status != 0 )) && [[ $reloaded == true ]]; then
    if ! docker exec "$container" caddy reload --address "$admin" --config "$workdir/previous" --adapter caddyfile; then
      echo "Rollback failed. Previous Caddyfile: $backup" >&2
    fi
    if [[ $persisting == true ]]; then
      cat "$backup" > "$caddyfile"
    fi
  fi
  docker exec "$container" sh -c 'rm -f "$1/previous" "$1/candidate" && rmdir "$1"' sh "$workdir" >/dev/null || true
  exit "$status"
}
trap cleanup EXIT

docker cp "$backup" "$container:$workdir/previous"
docker cp "$candidate" "$container:$workdir/candidate"
docker exec "$container" caddy validate --config "$workdir/candidate" --adapter caddyfile
docker exec "$container" caddy reload --address "$admin" --config "$workdir/candidate" --adapter caddyfile
reloaded=true

curl --fail --silent --show-error --max-time 15 --retry 2 \
  --resolve "$hostname:$port:127.0.0.1" "https://$hostname:$port$smoke_path" -o /dev/null

# Preserve the inode of a single-file Docker bind mount.
persisting=true
cat "$candidate" > "$caddyfile"
printf 'Healthy HTTPS route for %s. Previous Caddyfile: %s\n' "$hostname" "$backup"
