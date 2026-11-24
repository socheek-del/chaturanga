# Session Handoff

## Active work

- Implement the [42-entry rollout](docs/CHESS-LIKE-ROADMAP.md) one product at a time. Every game requires an interactive tutorial, a bot mode and applicable multiplayer.
- Current feature is `mhs-001`, Maharajah and the Sepoys. Shatranj and Chaturanga public releases are blocked on DNS. Record only verified evidence in `feature_list.json` and `claude-progress.md`.
- Push verified increments directly to main. Use GitHub Actions for verification and Melon over SSH for release. Cloudflare is a fallback when a documented Melon limitation prevents delivery.

## Verified

- `./init.sh` passed using Node 22.23.1 from `/private/tmp/node22/node_modules/.bin` on this machine.
- All seven Melon origins returned HTTP 200 on ports 19787–19793. The existing Caddy and workerd containers are live.
- The isolated Makruk probe on port 19887 verified static assets, authenticated room creation, WebSocket state and recovery after restarting the container. Its state and bundle scratch directory are separate from production.
- `scripts/melon/stage.sh <product> <full-commit-sha> <free-loopback-port>` builds a pinned commit and starts a separate stage. It does not modify Caddy. Use product health and assets to confirm the stage, then record evidence.

## Melon release workflow

plat-022 passed. The 8ee28c4 Makruk and Beanroti stages, migrations and repeat run, two-seat WebSockets, backup restore and HTTPS rollback were verified. Melon’s live catalog matches the staged data. Use [the runbook](docs/MELON-RELEASE.md) for Shatranj. Its release still needs its own hostname, public smoke and catalog update.

## Shatranj

The classical engine, rule fixtures and seeded Fairy-Stockfish comparison are complete in `packages/shatranj`. Next build the bot and product, then verify the tutorial, both human bot seats, local and invite play, and the public Melon release.

Update: Shatranj now has its bot, PWA, tutorial and server. Local Playwright passed all five scenarios. Stage the pushed product on Melon and verify production build assets and a real room. Public DNS for `shatranj.beanroti.com` was absent and the available token lacks DNS edit. The existing game certificate covers seven explicit names and omits Shatranj. Once DNS resolves to Melon, configure Caddy to obtain TLS for the new hostname, run public HTTPS and WebSocket smoke, then publish the directory entry.

Melon stage 9232a07 is healthy as `chaturanga-stage-shatranj-19897` in `~/chaturanga-release.shatranj.AUuZbW`. Its migration and six deployed browser checks passed. Keep its state and promote the staged container when DNS is ready.

## Three-player Chess

The tutorial and coordinate labels are live from 3154fc8 on Melon port 19899, with five public browser checks passing. Bot mode is live from 8771c1c on Melon port 19900. All nine browser tests passed locally, on the stage and on the public site. Port 19899 still serves the preceding tutorial release for rollback. Next implement three-seat online invites and reconnects with isolated persisted state.

Online invite rooms are live from fe0b009 on Melon port 19901. Its database migration ran, staged play survived a restart, and all eleven public browser checks passed. The public catalog uses 886f994 and describes the tutorial, bots and online rooms. Keep port 19900 as rollback. If replacing online containers, preserve the current isolated room data and signing secret.

## Chaturanga

Implement the two-player [al-Adli reconstruction](https://ludii.games/details.php?keyword=Chaturanga+%28al-Adli%29). Ludii documents orthogonal two-cell elephant leaps, opposite king files, victory for the stalemated king, and immediate bare-king victory. The preset Fairy-Stockfish Chaturanga differs, so configure an independent reference for the shared move rules and test the historical endings separately.

The Chaturanga rules engine, bot, tutorial and product are implemented. Melon stage 89604bb is healthy as `chaturanga-stage-chaturanga-19902` in `~/chaturanga-release.chaturanga.wanRAh`. Its SQL migration and six staged browser checks passed, including offline play. Public DNS is missing for `chaturanga.beanroti.com`; after DNS is present, acquire its TLS certificate on Melon, promote the stage, verify HTTPS and online play, then publish the catalog entry.

## Maharajah and the Sepoys

Next is the traditional single royal Maharajah against a conventional army, with no promotion. The stock Fairy-Stockfish variant permits rules that require overrides for this selection. The start, movement, and checkmate goals are documented in the [Wikipedia rules](https://en.wikipedia.org/wiki/Maharajah_and_the_Sepoys#Game_rules).

The Maharajah rules package now passes all 18 tests. Fairy-Stockfish needs `promotionRegionBlack = -` in addition to disabling promotion choices. Next wire the bot and PWA to this engine.

The PWA and Worker are implemented and locally verified. Run the full browser suite against the staged PWA with `MAHARAJAH_E2E_URL`. Public DNS for `maharajah.beanroti.com` was absent at the local verification checkpoint.

The exact Maharajah product revision e4e04fb is staged, migrated and verified on Melon as `chaturanga-stage-maharajah-19903` in `~/chaturanga-release.maharajah.ezafRG`. Six staged browser scenarios passed. Promote after DNS and TLS provision, verify public play, then publish the catalog entry.

## Courier Chess

Next active feature is `courier-001`. Use the [medieval rules](https://en.wikipedia.org/wiki/Courier_chess#Medieval_rules) on 12×8 and begin with the customary joyleaps already applied. Select immediate ferz promotion and a draw by stalemate. Move orthodox pawns one square only and omit castling and en passant. Use rules-core’s variable-width coordinates and do not reuse the 8×8 move tables. The [Ströbeck museum rules](https://www.schachmuseum-loeberitz.de/images/stories/Dateien/Kurier-Schach.pdf) are a separate documented reconstruction.

The Courier engine passes all 18 checks and is ready to integrate. Its Fairy-Stockfish comparison uses a custom 12×8 configuration. The app must use width-aware square indices throughout and sense forced ferz promotion via the legal move suffix.
