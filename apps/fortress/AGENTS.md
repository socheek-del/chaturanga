# AGENTS.md: Russian Four-Handed Fortress Chess

This app implements the Petrov-described Russian four-player fortress game as an independently authored digital reconstruction. It has four seats in two opposite-seat teams, an English PWA, a bot mode, pass-and-play, interactive tutorial, and private online rooms.

## Source of truth

- Product choices and modes: `docs/PLAN.md`.
- Rules as implemented: `../../packages/fortress/RULES.md`.
- Research and source/rights notes: `docs/reports/Fortress Chess rules and rights.md` and `docs/research_notes/`.
- Do not copy historical prose or board art. Write original lesson text, graphics, and code.

## Product facts

- The game is a four-seat game with teams Red+White and Blue+Black; the turn order is top Red, right Blue, bottom White, left Black.
- Its 16×16 envelope has 192 playable squares. Fortress wall edges and blocked diagonal corner routes are part of move legality.
- The extra rook, bishop, and knight are placed in a setup phase before ordinary moves begin.
- All bot moves and online moves must use `@chaturanga/fortress` rules. Use a bounded browser worker for bots.
- The app is English-only initially. All user-visible text is keyed and complete in every declared locale.
- Deployment is on Melon over `ssh melon`; use Cloudflare only for a documented Melon limitation. The product site address belongs in `web/site.config.ts` only.

## Verification

Run `npm run verify` under the pinned Node in `.nvmrc`, product build and browser checks. Record evidence in `feature_list.json` and `claude-progress.md`; do not mark the feature passing before all required checks and Melon stage smoke have completed. Public DNS/TLS can remain a documented release blocker while a healthy exact-SHA stage is kept available.
