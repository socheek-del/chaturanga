# Russian Four-Handed Fortress Chess

An independently authored digital reconstruction of Alexander Petrov's Russian four-player Fortress Chess. The board has 192 playable squares, four corner forts, two allied teams and clockwise turns.

## Play

- Use the 12-step interactive tutorial to learn the board, walls, reserve setup, teams, special moves and endings.
- Play as any seat against three bounded team-aware bots.
- Pass-and-play on one device, with a separate saved game for each mode and bot seat.
- Invite three other people to a private room. The Worker assigns the four seats and validates every move through `@chaturanga/fortress`. Rooms have no chat.
- Install the English PWA and continue local games offline.

## Rules and sources

`packages/fortress/RULES.md` is the implemented rules contract. The selection, research and explicitly digital choices are recorded in `docs/PLAN.md` and `docs/reports/Fortress Chess rules and rights.md`. The tutorial calls out reserve placement and stalemate choices that the accessible historical sources do not resolve. Original prose, board illustration and interface art are used.

## Development

Run `npm run dev:fortress` for the web app and local Worker. The app uses port 5194 and the Worker uses port 8794.

- `npm run build:fortress` — typecheck and build the PWA and Worker bundle.
- `npm run e2e -w apps/fortress/web` — local play, four bot seats, full tutorial and invite room.
- `npm run e2e:pwa -w apps/fortress/web` — installability and offline play against a production preview.
- `npm run test -w packages/fortress` and `npm run test -w packages/fortress-ai` — rules and bot checks.

## Deployment

Deploy on Melon using the repository's [`docs/MELON-RELEASE.md`](../../docs/MELON-RELEASE.md) runbook; keep this game's online state isolated from other products. The site URL is configured only in `web/site.config.ts`. Public promotion requires that hostname to resolve to Melon and pass HTTPS/WebSocket smoke.
