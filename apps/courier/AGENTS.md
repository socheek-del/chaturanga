# Courier

An English PWA for Courier Chess, with a guided tutorial, same-device games, bots for both roles, and private online rooms. The selected medieval rules begin after the joyleaps. See `packages/courier/RULES.md` for the selected historical rules.

- Web dev server is on port 5197. The Worker is on port 8797.
- Run `npm run e2e -w apps/courier/web` for browser tests. Set `COURIER_E2E_URL` to test a staged or public build.
- `COURIER_SITE_URL` overrides the canonical address.
- Deploy on Melon with isolated game storage and its own signing secret.
