# Jeson Mor

## Selected rules

Implement the source-backed traditional 9×9 checkerboard form of Jeson Mor. The cited sources describe
one traditional knight-race game and do not rank editions by popularity; do not claim this is measurably the
most popular. See the [rules and rights selection report](reports/Jeson%20Mor%20rules%20selection.md).

- Both sides begin with nine chess-knight movers on their home rank. The players choose who moves first.
- Knights jump and capture as in chess. There are no kings, checks, promotion, or additional piece types.
- Win by capturing all opposing pieces, or by moving the same knight to e5, giving the opponent one reply,
  then moving that knight away from e5 on its next turn. The center knight is capturable; surviving the reply
  alone is not a win.
- The immediately-following-turn timing resolves ambiguity in later published wording. Repetition draws and
  no-legal-move losses are product conventions, not sourced traditional rules. No 50-move rule is added.
- Author the rules prose, tutorials, artwork, brand and implementation independently. The rights review
  found no reuse license and is not worldwide legal clearance.

## Product contract

- Independent English PWA, with original visual identity and horse-piece art.
- Play White or Black against six bounded deterministic bot levels; pass-and-play and local save/reload/
  takeback are available.
- Interactive tutorial demonstrates every selected rule, including the vulnerable center attempt, escape
  victory, capture-all victory, and digital endings.
- Private online rooms and quick match are applicable. A product-local Worker validates every move and
  stores finished games in a Jeson Mor-only D1 database. No chat.
- Installable, offline-capable PWA; site address comes from the app's single `site.config.ts` setting.
- Deploy and smoke test on Melon. Public Caddy route and directory entry wait for DNS/TLS and HTTPS/WSS
  checks. Do not use Cloudflare without a documented Melon limitation.

## Sequence

1. [x] Research the edition and rights; record source limits and the center timing convention.
2. [x] Implemented `@chaturanga/jesonmor` with 9×9 FEN, legal knight moves, captures, the pending center
   claimant, terminal results, replay/undo, focused tests, shared conformance and seeded fixtures (28 tests).
3. [x] Added six deterministic bounded `@chaturanga/jesonmor-ai` personas on ai-core; 15 tests cover both
   colors, center/capture wins, seeded choice, legal output and search state restoration. A strength ladder
   remains a quality follow-up, not a release gate.
4. [x] Build the standalone product with all English strings localized, original art, responsive play, bot,
   pass-and-play, persistence and interactive tutorial; verify mobile, install and offline behavior. Web
   tests passed 29/29; local Chromium passed 5/5; installed offline PWA passed 1/1.
5. [x] Add the isolated Worker, rooms, quick match and finished-game storage; verify authoritative legality
   and reconnect. Worker tests passed 9/9. Melon restart and copied-state restore remain part of stage smoke.
6. [ ] Pass exact-SHA GitHub CI, deploy that commit to a Melon stage, and run production smoke. Promote only
   when the host resolves and public HTTPS/WSS/tutorial/play checks pass.

## Service

- Default hostname: `jesonmor.beanroti.com`, read from `apps/jesonmor/web/site.config.ts` and overridable
  with `JESONMOR_SITE_URL`.
- Local web/preview/Worker ports are 5199/4199/8800. Port 8799 was occupied by an unrelated service.
- Use a unique Melon stage port after checking `docs/MELON-RELEASE.md`.
- Keep the PWA, server service and D1 isolated from every other game.
