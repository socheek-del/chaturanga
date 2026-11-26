# Chaturaji

An independent English PWA for a historically attested four-player dice game, based on Al-Biruni's account and later historical comparison. It includes bot play, same-device play, a 13-step interactive tutorial, private four-player rooms and offline access.

This is a source-based playable reconstruction. The surviving sources leave some operational rules open; see [`packages/chaturaji/RULES.md`](../../packages/chaturaji/RULES.md) for the choices used by the app.

## Local development

From the repository root, run `npm run dev:chaturaji`. This starts the product web app and its local Worker service. Run `npm run build:chaturaji` to build both. Focused checks are `npm test -w apps/chaturaji/web`, `npm test -w apps/chaturaji/worker`, and `npm run e2e -w apps/chaturaji/web`.

The site address is configured in `web/site.config.ts` through `CHATURAJI_SITE_URL`. Online rooms use a product-local Durable Object namespace and D1 archive. Production releases run on Melon using the repository's [release runbook](../../docs/MELON-RELEASE.md).
