# Maharajah

An English PWA for Maharajah and the Sepoys, with a guided tutorial, same-device games, bots for both roles, and private online rooms. See `packages/maharajah/RULES.md` for the selected historical rules.

- Web dev server is on port 5196. The Worker is on port 8796.
- Run `npm run e2e -w apps/maharajah/web` for browser tests. Set `MAHARAJAH_E2E_URL` to test a staged or public build.
- `MAHARAJAH_SITE_URL` overrides the canonical address.
- Deploy on Melon with isolated game storage and its own signing secret.
