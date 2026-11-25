# Congo

An independent English PWA for Demian Freeling’s two-player Congo, the 7×7 animal chess variant. The game
has a river with a one-turn escape deadline, optional Monkey capture routes, and Lions that win by direct
capture. Read the complete selected-edition contract in [`../../packages/congo/RULES.md`](../../packages/congo/RULES.md)
and the rules and rights report in [`docs/reports/Congo rules and rights.md`](docs/reports/Congo%20rules%20and%20rights.md).

The product includes six bot strengths, pass-and-play, device saves, an interactive field guide, installable
offline play, private online rooms, and quick match. The Congo Worker validates every move with the same
rules package and keeps finished online games in Congo’s isolated database. There is no chat.

## Development

Run `npm run dev:congo` from the repository root. The web app uses `127.0.0.1:5196`; its local Worker uses
`127.0.0.1:8796`. `npm run build:congo` builds the PWA and the Worker. Product verification commands live
in `apps/congo/AGENTS.md` and `apps/congo/web/package.json`.

The site address is isolated in `web/site.config.ts` and can be overridden with `CONGO_SITE_URL`. Deploy
the app and its service on Melon using the release runbook; do not publish the app-directory entry until
the public route and smoke check are live.
