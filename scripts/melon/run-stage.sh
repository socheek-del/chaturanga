#!/usr/bin/env bash
# Invoked on Melon from a fresh archive by stage.sh.
set -euo pipefail

product=$1
revision=$2
port=$3
stage=$PWD
image=node:22-slim
container=chaturanga-stage-$product-$port
runtime=1.20261124.1

if ss -ltnH "sport = :$port" | grep -q .; then
  echo "Loopback port $port is already in use" >&2
  exit 1
fi

mkdir state
docker run --rm --user "$(id -u):$(id -g)" --env HOME=/release \
  --mount "type=bind,src=$stage,dst=/release" --workdir /release "$image" \
  sh -ec '
    npx -y npm@11 ci
    if [ -f "apps/$1/web/package.json" ]; then
      npm run build -w "apps/$1/web"
    fi
    npm install --prefix /release/.melon-runtime --no-save "workerd@$2"
    node scripts/melon/stage-config.mjs "$1"
  ' sh "$product" "$runtime"

# Only the transient migration container can reach its loopback SQL worker.
docker run --rm --network none --user "$(id -u):$(id -g)" \
  --mount "type=bind,src=$stage,dst=/release" \
  --mount type=bind,src=/etc/ssl/certs,dst=/etc/ssl/certs,readonly \
  --workdir "/release/apps/$product/worker" "$image" node /release/scripts/melon/migrate.mjs

docker run --detach --name "$container" --label "chaturanga.revision=$revision" \
  --user "$(id -u):$(id -g)" --network host \
  --mount "type=bind,src=$stage,dst=/release" \
  --mount type=bind,src=/etc/ssl/certs,dst=/etc/ssl/certs,readonly \
  --workdir "/release/apps/$product/worker" --env PATH=/release/node_modules/.bin:/usr/local/bin:/usr/bin:/bin \
  "$image" /release/.melon-runtime/node_modules/.bin/workerd serve .melon-stage.jsonc \
  --experimental --data-dir /release/state -s "http=127.0.0.1:$port" >/dev/null

path=/api/health
[[ $product != beanroti ]] || path=/apps.json
for ((attempt = 1; attempt <= 30; attempt++)); do
  if curl -fsS --max-time 2 "http://127.0.0.1:$port$path" -o /dev/null 2>/dev/null &&
     curl -fsS --max-time 2 "http://127.0.0.1:$port/" -o /dev/null 2>/dev/null; then
    printf 'Healthy stage: %s (%s) on 127.0.0.1:%s\n' "$container" "$revision" "$port"
    exit 0
  fi
  [[ $(docker inspect --format '{{.State.Running}}' "$container") == true ]] || break
  sleep 1
done

docker logs --tail 30 "$container" >&2
exit 1
