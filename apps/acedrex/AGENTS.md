# Acedrex

An English PWA for Grande Acedrex, with a guided tutorial, same-device games, bots for both roles, and private online rooms. The product uses the dice-free Cazaux and Musser reconstruction. See `packages/acedrex/RULES.md` for the selected historical rules.

- Web dev server is on port 5198. The Worker is on port 8798.
- Run `npm run e2e -w apps/acedrex/web` for browser tests. Set `ACEDREX_E2E_URL` to test a staged or public build.
- `ACEDREX_SITE_URL` overrides the canonical address.
- Deploy on Melon with isolated game storage and its own signing secret.
