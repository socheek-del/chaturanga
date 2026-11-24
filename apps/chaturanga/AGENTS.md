# Chaturanga

This product implements the two-player Chaturanga reconstruction attributed to al-Adli. See the selected rules in `packages/chaturanga/RULES.md`. The English PWA offers guided practice, same-device play, a bounded browser bot and private online rooms.

- Web dev server is on port 5195. The game server is on port 8795.
- `npm run e2e -w apps/chaturanga/web` runs the browser scenarios. Set `CHATURANGA_E2E_URL` to check a staged or public build.
- `CHATURANGA_SITE_URL` overrides the site's canonical address.
- Use the Melon release runbook for deployment. The product has isolated online state and a separate signing secret.
