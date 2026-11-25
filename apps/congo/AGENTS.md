# Congo product instructions

- Selected variant: Demian Freeling’s 1982 two-player 7×7 Congo. See docs/PLAN.md, docs/reports/Congo rules and rights.md, and ../../packages/congo/RULES.md.
- @chaturanga/congo is the single rules source for play, bots, lessons, online validation, and replay. Preserve its river deadlines, Lion castle and capture rule, Monkey routes, automatic Superpawn promotion, and digital draw conventions.
- Lion capture is the decisive win. There is no check/checkmate. A side with no legal move loses. Two Lions alone draw only if neither can capture immediately.
- A non-Crocodile that ends its move in the river must leave on its next own turn or drown. The Lion cannot enter the river; the Crocodile is immune.
- Monkey captures are optional sequences. Captured pieces stay as blockers through the route; the same piece cannot be captured twice; a route may revisit squares.
- English is the only declared language. Put every visible string in web/src/locales/en.json. Keep lessons, rules prose, board graphics, and original animal seals with this product; do not copy MindSports text or art.
- The interactive tutorial must cover the objective, every piece, river timing and drowning, Monkey routes, Pawns and Superpawn, the Lion’s special capture, and game endings.
- The private two-seat Worker uses the same rules engine for every move. No chat. Keep its finished-game database and room service isolated to Congo.
- Deploy the PWA and Worker on Melon using ssh melon. Add Congo to sibling links and the app directory only after its public HTTPS/WSS route and smoke check pass.

## Verification

- npm run test -w apps/congo/web validates locale and lesson completeness, rule exercises, piece coverage, and Monkey/Lion tutorial examples.
- npm run e2e -w apps/congo/web covers bot play, pass-and-play, local saves, private rooms and reconnect.
- npm run e2e:pwa -w apps/congo/web verifies offline install and reload.
- npm run test -w apps/congo/worker covers legal and illegal moves, Monkey route validation, WebSocket rooms, restart recovery, persistence and no chat.
- Run npm run build:congo and full npm run verify under the pinned Node. Do not mark congo-001 complete until the exact-SHA Melon stage, restart and copied-state restore, and public HTTPS/WSS smoke have recorded evidence.

## Local endpoints

- Web: 127.0.0.1:5196
- PWA preview: 127.0.0.1:4196
- Worker: 127.0.0.1:8796
- Public hostname setting: congo.beanroti.com
