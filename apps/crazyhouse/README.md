# Crazyhouse

Crazyhouse is an English chess-variant PWA. Captures switch sides and enter the capturer's pocket; a
player can spend a turn dropping a pocket piece onto an empty square. The selected rules are recorded
in [the plan](docs/PLAN.md) and [the package rules contract](../../packages/crazyhouse/RULES.md).

## Play

- **Against the computer:** choose one of six bounded bot levels and play White or Black.
- **Pass and play:** two people share one device. The game saves locally and supports takeback.
- **Online:** create a private two-seat room and share its code or link, or join a quick-match pool. The
  Crazyhouse Worker validates every move. There is no chat.
- **Learn:** complete the interactive field guide from the Learn screen.

## Develop

Use Node 22.23.1 from `.nvmrc`:

```sh
npm run dev:crazyhouse
npm run build:crazyhouse
```

The PWA runs on `127.0.0.1:5195`; its Worker runs on `127.0.0.1:8795`. The Worker uses its own local D1
database. Production stages run on Melon; see [the release runbook](../../docs/MELON-RELEASE.md).

The site's single address setting is `CRAZYHOUSE_SITE_URL` in `web/site.config.ts` or the matching
environment variable. Its default host is temporary until public DNS and TLS are verified.
