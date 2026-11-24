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

origin=$(git remote get-url origin)
if [[ ! $origin =~ ^https://github\.com/[a-zA-Z0-9_.-]+/[a-zA-Z0-9_.-]+$ ]]; then
  echo 'Set origin to the repository HTTPS URL before staging on Melon.' >&2
  exit 2
fi

# Melon fetches the pinned commit directly from GitHub.
ssh melon "set -eu
  umask 077
  stage=\$(mktemp -d \"\$HOME/chaturanga-release.$product.XXXXXX\")
  printf 'Stage directory: %s\\n' \"\$stage\"
  cd \"\$stage\"
  git init -q
  git fetch -q --depth=1 --no-tags $origin $revision
  git -c advice.detachedHead=false checkout -q --detach FETCH_HEAD
  exec bash scripts/melon/run-stage.sh $product $revision $port"
