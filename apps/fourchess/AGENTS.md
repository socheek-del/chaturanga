# Four-handed chess product notes

Read `docs/PLAN.md` and [`packages/fourchess/RULES.md`](../../packages/fourchess/RULES.md) before changing this product. The selected rules are a four-seat Free-for-All game on a 160-square crossboard. The evidence supports a current tournament-documented form, not a popularity winner across eras.

The independent product is named Fourfold Chess and uses the original Wayfinder identity. Keep all code, art, UI, and tutorial prose original; do not reuse publisher assets or text. English is the only declared language, so all user-visible strings still go through the product locale.

The product currently includes pass-and-play, three seeded bots, an 11-step interactive tutorial, local game saves, an offline PWA, and four-seat private rooms. The Worker validates every online move through `@chaturanga/fourchess`; there is no chat. Product code lives in `web/` and `worker/`, with pure rules and bots in `packages/fourchess` and `packages/fourchess-ai`.

Run `npm run typecheck -w packages/fourchess`, the corresponding `npm test` commands for both packages and both app workspaces, `npm run build:fourchess`, and `npm run e2e:fourchess` for focused verification. Run the full `npm run verify` before release. Deployment is on Melon via `ssh melon`; use the pinned-SHA staging script and the release runbook. Do not add a Caddy route or directory entry until DNS, TLS, HTTPS, and WSS smoke pass.
