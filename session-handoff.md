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

The Courier PWA and Worker pass their local checks. Run the six production scenarios via `COURIER_E2E_URL` through a Melon tunnel, then check public DNS before promotion.

Courier revision dc1feb1 is running, migrated and tested on Melon as `chaturanga-stage-courier-19904` in `~/chaturanga-release.courier.rsjSBn`. All six browser scenarios passed. Public DNS for `courier.beanroti.com` is absent. Promote and publish only after public HTTPS and room smoke tests.

## Grande Acedrex

Active feature is `acedrex-001`. Implement the dice-free [Cazaux/Musser reconstruction summarized by Wikipedia](https://en.wikipedia.org/wiki/Grant_Acedrex#Rules). The installed Fairy-Stockfish build refused a 12×12 probe, so use independent movement fixtures and seeded, replayable games. Ensure FEN and UCI preserve leap rights and support ranks 10 through 12.

Grande Acedrex engine and its 22 rules checks pass. Next use variable-length UCI in bot encoding and browser input, then package the tutorial and isolated Worker. Its third FEN field is part of the position key because it preserves unused king leaps.

The Grande Acedrex tutorial, bot and PWA are locally verified, including moves with two-digit ranks over the room socket. Run all six production scenarios with `ACEDREX_E2E_URL` through the Melon tunnel.

Grande Acedrex revision 5adadf2 is running, migrated and verified as `chaturanga-stage-acedrex-19905` in `~/chaturanga-release.acedrex.sFoXPN`. It passed all six browser scenarios. Public DNS for `acedrex.beanroti.com` is absent.

## Tamerlane Chess

Active feature is `tamerlane-001`. Use the common [Tamerlane rules](https://en.wikipedia.org/wiki/Tamerlane_chess#Tamerlane_chess) with citadels and every promotion. The [Zurafa rules](https://zurafa.app/en/rules/) document one way to operationalize the special pawn. Keep the choice and its edge-case handling in the product rules. The engine should use thirteen columns, with holes outside the ordinary eleven files except for the two citadels.

Tamerlane’s rules package passes 35 checks. The generic rules-core goal-square result carries the citadel draw to the server and UI. Use engine files b–l for the main board, with a9 and m2 as citadels. The rest of the outer files are holes and must be hidden from pointer and keyboard play.

The Tamerlane product passes its local board, tutorial, bot and online checks. Run all seven scenarios with `TAMERLANE_E2E_URL` against the exact Melon build, then verify DNS and public release eligibility.

Tamerlane revision f1206a7 is running and migrated as `chaturanga-stage-tamerlane-19906` in `~/chaturanga-release.tamerlane.aDgzje`. All seven browser scenarios passed. Public DNS for `tamerlane.beanroti.com` is absent.

## Shatar

The active feature is `shatar-001`. Match the [traditional movement and opening](https://en.wikipedia.org/wiki/Shatar#Game_rules) and the [Fairy-Stockfish mate rule](https://github.com/fairy-stockfish/Fairy-Stockfish/blob/master/src/position.h), distinguishing an only-knight mate from a double check. Keep each attacker's shak streak in the game state and compare with the stock `shatar` oracle. Document the result choice for a prohibited knight mate and the omission of regional scoring customs.

Shatar engine complete and verified with 26 checks. Preserve both sides’ shak streaks in bot position keys and saved games. The UI should explain the restricted-mate result as a draw without shak or a loss after a sole knight mate.
