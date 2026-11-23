# Three-player chess

Three players share a 96-cell ring board. White, Black and Red move in order; checkmate removes a player, and
the last king standing wins. This release is a pass-and-play PWA for three people on one device.

Three-player chess has many published rules and board shapes. This site implements one named house-rule set,
the **Chaturanga Ring**. Read the complete rules in [`packages/threechess/RULES.md`](../../packages/threechess/RULES.md).

## Run locally

```sh
npm run dev:threechess
```

The web app runs on port 5193 and the Worker on port 8793. Build both with `npm run build:threechess`.

[play]: https://three-player-chess.beanroti.com
