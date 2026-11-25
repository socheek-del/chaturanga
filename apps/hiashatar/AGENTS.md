# Hiashatar product

The selected edition is recorded in `packages/hiashatar/RULES.md`. This product has an English PWA, a bounded local bot, a complete interactive tutorial, same-device saves and server-validated private invite rooms.

- The web dev server uses port 5209; its Worker uses 8809.
- Run browser checks with `npm run e2e -w apps/hiashatar/web`. Set `HIASHATAR_E2E_URL` for a built stage or public origin.
- `HIASHATAR_SITE_URL` overrides this product's address.
- The online Worker and D1 storage are unique to Hiashatar. Deploy to Melon through the platform release runbook.
- Hiashatar does not have a Fairy-Stockfish reference preset. Engine checks use explicit rule fixtures and `describeVariantConformance`.
