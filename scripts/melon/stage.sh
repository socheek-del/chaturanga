#!/usr/bin/env bash
# Stage a committed revision on Melon without changing Caddy or an existing service.
set -euo pipefail

if [[ $# != 3 || ! $1 =~ ^[a-z][a-z0-9-]*$ || ! $2 =~ ^[0-9a-f]{40}$ || ! $3 =~ ^[1-9][0-9]{3,4}$ ]] || (( $3 > 65535 )); then
  echo 'Usage: scripts/melon/stage.sh <product> <full-commit-sha> <free-loopback-port>' >&2
  exit 2
fi
product=$1
revision=$2
port=$3
cd "$(git rev-parse --show-toplevel)"
git cat-file -e "$revision:apps/$product/worker/wrangler.jsonc"
git cat-file -e "$revision:scripts/melon/run-stage.sh"

# All fields passed to the remote shell are validated above.
git archive "$revision" | ssh melon "set -eu
  umask 077
  stage=\$(mktemp -d \"\$HOME/chaturanga-release.$product.XXXXXX\")
  printf 'Stage directory: %s\\n' \"\$stage\"
  tar -xf - -C \"\$stage\"
  cd \"\$stage\"
  exec bash scripts/melon/run-stage.sh $product $revision $port"
