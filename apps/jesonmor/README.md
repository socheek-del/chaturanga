# Jeson Mor

Jeson Mor is a two-player 9×9 knight-race game. This product includes an English PWA, six bounded bots,
pass-and-play, an interactive rules tutorial, private online rooms, and quick match.

## Play

- Run `npm run dev:jesonmor` from the repository root. The web app is at `http://127.0.0.1:5199`; the
  product Worker is at `http://127.0.0.1:8800`.
- Run `npm run build:jesonmor` to build the PWA and the room service.
- Run `npm run test -w apps/jesonmor/web` for rules tutorials and locale coverage.
- Run `npm run e2e -w apps/jesonmor/web` for browser play and private rooms.
- Run `npm run e2e:pwa -w apps/jesonmor/web` for offline install and reload behavior.

## Rules

The standard board has nine chess-knight movers on each home rank. Either side may move first. A player wins
by capturing every opposing horse or by moving one horse to e5, allowing one opponent reply, then moving the
same horse off e5 on its next turn. The center horse can be captured during the reply. Repetition draws and
no-legal-move losses are digital conventions; there is no 50-move rule.

See [`docs/PLAN.md`](docs/PLAN.md), the [rules as implemented](../../packages/jesonmor/RULES.md), and the
[edition and rights review](docs/reports/Jeson%20Mor%20rules%20selection.md).

## Deployment

Stage the exact passing commit on Melon with `scripts/melon/stage.sh jesonmor <full-commit-sha> <free-port>`
from the repository. Keep its service, local persistent state, and D1 database isolated. Do not add a public
route or family-directory entry until DNS, HTTPS/WSS, tutorial, bot, and multiplayer smoke checks pass.
