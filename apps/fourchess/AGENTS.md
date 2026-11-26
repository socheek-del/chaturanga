# Four-handed chess product notes

Read `docs/PLAN.md` and [`packages/fourchess/RULES.md`](../../packages/fourchess/RULES.md) before changing this product. The selected rules are a four-seat Free-for-All game on a 160-square crossboard. The evidence supports a current tournament-documented form, not a popularity winner across eras.

The independent product is named Fourfold Chess and uses the original Wayfinder identity. Keep all code, art, UI, and tutorial prose original; do not reuse publisher assets or text. English is the only declared language, so all user-visible strings still go through the product locale.

The product currently includes pass-and-play, three seeded bots, an 11-step interactive tutorial, local game saves, an offline PWA, and four-seat private rooms. The Worker validates every online move through `@chaturanga/fourchess`; there is no chat. Product code lives in `web/` and `worker/`, with pure rules and bots in `packages/fourchess` and `packages/fourchess-ai`.

Run `npm run typecheck -w packages/fourchess`, the corresponding `npm test` commands for both packages and both app workspaces, `npm run build:fourchess`, and `npm run e2e:fourchess` for focused verification. Run the full `npm run verify` before release. Deployment is on Melon via `ssh melon`; use the pinned-SHA staging script and the release runbook. Do not add a Caddy route or directory entry until DNS, TLS, HTTPS, and WSS smoke pass.

Release state (2026-11-26): commit `1e067b9d00c766f7d12824b0a520e51dd12baf79` passed exact-SHA CI run `45780002660` and is privately staged on Melon at port 19921. Four-seat browser smoke and restart/copied-state restore passed. The active standard container uses the recovered `state-restore-test` copy; the original stage is stopped and retained for rollback. The hostname currently has no DNS answer, so public promotion is blocked and Caddy/catalog must remain unchanged.
