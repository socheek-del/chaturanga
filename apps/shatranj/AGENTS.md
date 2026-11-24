# Shatranj

Shatranj is an English-language PWA for the classical Persian and Arabic game. Rules and the reference comparison live in `packages/shatranj`. The bounded opponent in `packages/shatranj-ai` runs in a browser Worker.

- `npm run dev -w apps/shatranj/worker` starts the room server on port 8794.
- `npm run dev -w apps/shatranj/web` starts the site on port 5194.
- `npm run e2e -w apps/shatranj/web` exercises the tutorial, local game, both bot seats and online rooms.
- `SHATRANJ_SITE_URL` overrides the site's canonical address.
- Stage and deploy to Melon using `docs/MELON-RELEASE.md`. Preserve the product’s isolated online state and signing secret when replacing a live release.
