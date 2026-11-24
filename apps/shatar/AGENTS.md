# Shatar

An English PWA for traditional Mongolian Shatar, with a guided tutorial, same-device games, bots for both roles, and private online rooms. See `packages/shatar/RULES.md` for the selected historical rules.

- Web dev server is on port 5208. The Worker is on port 8808.
- Run `npm run e2e -w apps/shatar/web` for browser tests. Set `SHATAR_E2E_URL` to test a staged or public build.
- `SHATAR_SITE_URL` overrides the canonical address.
- Deploy on Melon with isolated game storage and its own signing secret.
