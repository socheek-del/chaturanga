# Tamerlane

An English PWA for Tamerlane Chess, with a guided tutorial, same-device games, bots for both roles, and private online rooms. The product uses the common historical opening array and all three stages of the pawn of pawns. See `packages/tamerlane/RULES.md` for the selected historical rules.

- Web dev server is on port 5207. The Worker is on port 8807.
- Run `npm run e2e -w apps/tamerlane/web` for browser tests. Set `TAMERLANE_E2E_URL` to test a staged or public build.
- `TAMERLANE_SITE_URL` overrides the canonical address.
- Deploy on Melon with isolated game storage and its own signing secret.
