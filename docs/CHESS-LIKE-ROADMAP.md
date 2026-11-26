# Chess and chess-like games rollout

Scope snapshot, 2026-11-24. The [Wikipedia section](https://en.wikipedia.org/wiki/List_of_abstract_strategy_games#Chess_and_chess-like_games) lists 42 entries. Seven existing products provide tutorials, bots, local multiplayer and online rooms. Three-player Chess gained these modes on Melon during this rollout. The other 35 entries need new products, including one representative of the Shogi variants entry.

The section defines the catalog. For each game, use its linked description and primary rules where available. Record the selected edition, source, setup, turn, edge cases and outcomes in the product rules document before implementing. Prefer the most widely played documented variant when supported by evidence. Where usage data is missing, use an established tournament edition or a clearly identified reconstruction. The selections below are planning defaults. Confirm incomplete or conflicting rules before committing an engine.

Progress note, 2026-11-26: Arimaa's engine, bots, 15-lesson PWA and private rooms are complete and privately staged on Melon; public promotion is gated by publisher-license conditions and public DNS/TLS/HTTPS/WSS checks. Hive is blocked before implementation until its digital-adaptation rights are established. Four-handed Chess is implemented and privately staged on Melon; exact-SHA CI runs 45780002660 and 45799805729, four-seat browser smoke, restart and copied-state recovery passed. Its hostname has no DNS answer, so keep public routing and catalog unchanged. Chaturaji's Al-Biruni-based dice reconstruction is implemented through deterministic bots, a 13-step offline PWA/tutorial and four-seat server-authoritative rooms. Full workspace verification, product build and exact-SHA CI run 45800394175 pass. Melon stage migration, browser/PWA smoke, restart and copied-state recovery pass on port 19922. Its hostname has no DNS answer, so keep public routing and catalog unchanged. Production family smoke now passes 7/7 for the released products after the test and family registry were aligned to published destinations; the existing live output already matched those destinations. Djambi, Martian Chess, Apocalypse and Game of the Generals have completed source/adoption/rights reviews but remain blocked before implementation pending rights clearance. Senterej is the next rights-cleared candidate; first implement the narrow actor-aware Variant/session/server prerequisite (plat-023) needed for its simultaneous Werera phase and retractions.

## Existing products

| Wikipedia entry | Work |
| --- | --- |
| Chess | Keep standard international chess, its lessons and existing modes |
| Janggi | Keep current Korean chess rules and existing modes |
| Makruk | Keep current Thai chess rules and existing modes |
| Shogi | Keep standard 9×9 rules and existing modes |
| Sittuyin | Keep current Burmese chess rules and existing modes |
| Xiangqi | Keep current Chinese chess rules and existing modes |
| Three-player chess | Keep the owner's 91-cell hex game. Tutorial, one-human/two-bot play and three-seat invite rooms are live on Melon. Preserve existing saves and local play |

## Build order

Each row is one product. Complete and release one at a time. A source or permission blocker on one row leaves the next ready row available.

| Wave | Wikipedia entry | Default and implementation dependency |
| --- | --- | --- |
| 1 | Shatranj | Classical Persian/Arabic rules with ferz promotion, stalemate as a win and immediate reciprocal baring as a draw. [Historical rules reference](https://www.chessvariants.org/historic.dir/HistoricalChessVariants.pdf) |
| 1 | Chaturanga | Two-player al-Adli reconstruction. Orthogonal elephant leaps, the stalemated Raja wins, and immediate bare-king victory. [Ludii rules](https://ludii.games/details.php?keyword=Chaturanga+%28al-Adli%29) |
| 1 | Maharajah and the Sepoys | Orthodox army versus one maharajah. Verify both winning conditions and army restrictions |
| 1 | Courier chess | Historical 12×8 game. Pin opening and promotion conventions |
| 1 | Grande Acedrex | Alfonso X's *Libro de los juegos* reconstruction. Confirm movement and any opening conventions |
| 1 | Tamerlane chess | Standard 11×10 historical reconstruction including citadels and distinct pawn promotions |
| 1 | Shatar | Standard Mongolian game, with a pinned mate and opening convention |
| 1 | Hiashatar | Separate Mongolian game with bodyguards. Verify the bodyguard zone from the selected rules |
| 1 | Shatra | Select the current Altai tournament form under the 1983 Shatra Code: Biy, Shatra, Batyr and fortress reserves. The English Wikipedia article describes a separate chess-piece army. Use the explicit 62-field setup with 14 active and 9 reserve Shatras per side; one 2015 paper says 11 reserves without a matching placement. Document the source conflict and the horizontal-return and gate-capture rules. [Current rules guide](https://vnbooks.ru/altai-shatra.pdf) · [1974 setup](https://igrovir.ucoz.ru/publ/altaj_shatra_pravila_igry/1-1-0-108) · [1983 tournament history](https://zvezdaaltaya.ru/2015/02/entuziast-i-razrabotchik-pravil/) · [2015 rules-engine paper](https://earchive.tpu.ru/jspui/bitstream/11683/17016/1/conference_tpu-2015-C04-v2-070.pdf) |
| 1 | Fortress chess | Russian four-handed Fortress Chess from Petrov's documented edition. No popularity winner is evidenced; use this best-documented ruleset and label the setup/ending conventions that sources leave open |
| 1 | Crazyhouse | Standard two-player drop chess. Combine chess move semantics with hand/drop input |
| 1 | Congo | Original two-player rules. Specify river, drowning, animal movement and promotions |
| 1 | Jeson Mor | Documented Mongolian knight game. Verify the center-square win sequence |
| 1 | Suffragetto | Original published two-player rules. Verify capture and headquarters victory |
| 1 | Dameo | Standard two-player edition. Support line moves and mandatory capture sequences |
| 1 | Gess | Standard two-player edition. Support movable formations and ring loss |
| 1 | Duell | Standard 1976 edition. Track die orientation, movement and rolls as the rules specify |
| 1 | Ploy | Standard two-player edition first. Verify rotation, movement and any documented multi-seat extension |
| 2 | Hexagonal chess | Gliński's 91-cell game, the best-known version. Reuse hex geometry where it fits and implement distinct pawn and stalemate rules. [Variant overview](https://en.wikipedia.org/wiki/Hexagonal_chess) |
| 2 | Hnefatafl | Copenhagen 11×11, a documented tournament standard. Verify shield walls and edge forts. [Rules](https://aagenielsen.dk/copenhagen_summary.php) |
| 2 | Rollerball (chess variant) | Documented Rollerball layout and movement by location. Verify board topology and promotion |
| 2 | Kruzno | Document the linked hex-checkers game's setup and jumps. Reconcile the catalog and linked article's edition details |
| 2 | Rithmomachia | Pin one historical rules reconstruction, including numerical captures and victory. [Historical reconstruction reference](https://jducoeur.org/game-hist/mebben.ryth.html) |
| 2 | Shogi variants | Chu Shogi, an established large-board choice. Verify lion restrictions and optional promotion. [Variant overview](https://lishogi.org/variant) |
| 2 | Ko Shogi | Separate entry. Pin the modern reconstruction of the historical game and verify its compound moves before bot work |
| 2 | Arimaa | Standard two-player game. Multi-step turns, traps, push and pull require turn-aware input and search. [Official rules](https://arimaa.com/arimaa/learn/rulesIntro.html) |
| 2 | Hive | Base two-player publisher edition. Support a boardless hex field, connectivity and stacks. [Publisher rules](https://www.gen42.com/wp-content/uploads/Hive-rules.pdf) |
| 3 | Four-handed chess | Use modern four-seat Free-for-All as the evidenced tournament default. Treat this as a choice of format, with no verified popularity ranking across eras. [Event rules](https://www.chess.com/article/view/official-event-rules-2025) |
| 3 | Chaturaji | Historically attested four-seat dice reconstruction. Use injected randomness and record rolls for replay. [Variant overview](https://en.wikipedia.org/wiki/Chaturaji) |
| 3 | Djambi | Standard four-seat game. Verify elimination, corpses, special pieces and text-free play |
| 3 | Martian chess | Current two-player base edition. Evaluate documented larger layouts for a follow-up. Pieces are controlled by zone. [Publisher edition](https://www.looneylabs.com/games/martian-chess) |
| 4 | Apocalypse | Standard two-player edition with simultaneous secret moves. Seal both choices and resolve together |
| 4 | Game of the Generals | Standard two-player edition with hidden ranks and an automated arbiter. Use private views for both clients and bots |
| 4 | Senterej | Documented Ethiopian rules with free simultaneous mobilization until the first capture. Use authoritative event ordering and separate views where local input cannot reproduce the opening |
| 5 | Infinite chess | InfiniteChess.org Classical. Validate unbounded moves and endgames with sparse coordinates and ray queries. Limit bot candidate search only. Assess [Apeiron](https://github.com/Infinite-Chess/apeiron) as a browser bot. [Classical rules](https://www.infinitechess.org/guide) |

Schedule Three-player Chess bots near the start of Wave 1 as a separate feature. Use its online extension before the other Wave 3 invite rooms to validate generic seats. Build new primitives when a game first needs them. Use bounded Web Worker search with a legal fallback. Two-seat perfect-information games can start with ai-core. Multi-seat, dice, simultaneous and hidden-state games need suitable search and filtered state per seat. Test a human against bots in every seat and role, with bots filling all other seats.

For newly authored or published titles, establish permission or an applicable license covering a faithful digital project before scheduling that implementation. Use independently created UI, art and rules explanations. Arimaa and Martian Chess have explicit publisher permission processes. Hive and other authored titles have unverified authorization for this project. Track these per title and surface any requirement that would change the requested rules or release. [Arimaa licensing](https://arimaa.com/arimaa/license/) · [Looney Labs digital games policy](https://www.looneylabs.com/looney-labs-electronic-arcade)

Rights gate update, 2026-11-26: Djambi, Martian Chess, Apocalypse and Game of the Generals are recorded as blocked before implementation in `feature_list.json`; their source/adoption/rights reports are under each `apps/<game>/docs/`. No external contact was made. Senterej uses a clean-room profile grounded in Plowden's public-domain historical account and corroborating research. `plat-023` now provides actor-aware local history, review, protocol snapshots, server replay and legal retractions; Senterej is active. Stage it on Melon before public promotion.

## Release checks

- Implement one shipped PWA per game with its own site config, server service, rules and assets. Use English initially for new products unless another language is specified. Complete each declared locale.
- Ship an interactive tutorial for the selected ruleset. Make it easy to find from the home page and teach the objective, legal actions, turn order, how the game ends, and defining mechanics with guided practice and feedback. Complete it in every declared language. Reuse the shared lesson player where it supports the game’s board and actions.
- Ship a full game against bots and same-device play when private information or simultaneous inputs can be preserved. Provide private online invite rooms wherever applicable. Hidden-state and simultaneous games can use a private handoff when practical, with online rooms for mechanics that need separate devices or concurrent input.
- Online rooms validate every action server-side and test seat assignment, reconnect, private information, turn or phase resolution, and completion. Keep the no-chat rule. Quick match, ranked play and multiple difficulties are outside the initial minimum.
- Record rules fixtures, Variant conformance, bot legality and responsiveness, and browser tests for tutorial completion, a complete game, multiplayer and mobile PWA. Use reference engine comparison when it implements the selected rules. Verify live HTTPS, modes and server health before publishing the directory entry.
- Commit each verified increment directly to main. Keep game deployment and later directory publication distinct where the destination must be verified first. After CI passes, deploy to Melon via SSH. Configure secrets, the product hostname and isolated persistent storage for online play. Keep the previous healthy release available for rollback.

## Deployment on Melon

Melon is the deployment target for all games and the Beanroti catalog. Cloudflare is a fallback only if a concrete server limitation prevents delivery. Record the limitation and the proposed fallback before changing the hosting target. GitHub Actions verifies and builds pushes to main. Production release runs on Melon over `ssh melon`.

Verified on 2026-11-24. SSH access works. The server is Linux x86_64 with Docker, Docker Compose, a Caddy container listening on HTTP and HTTPS, four CPUs, about 8 GB RAM and 62 GB free on the root filesystem. All seven existing games have Node 22 containers serving standalone `workerd` origins. Makruk and Three-player Chess returned healthy responses on their loopback ports. Keep the existing runtime and Caddy layout as the starting point. Those probes establish origin health and do not establish public DNS routing, catalog hosting, or persistent online state for a new release.

### First release on Melon

Follow the [Melon release runbook](MELON-RELEASE.md).

1. Turn the existing standalone container setup into a repeatable release command. Build a verified main SHA, run it under a spare loopback port, and smoke the assets, API, PWA and WebSocket handshake before switching Caddy. Release one product at a time. Keep the previous container and Caddy route available for rollback.
2. Verify an isolated persistent volume per game. Confirm the standalone runtime's database and Durable Object storage behavior against the selected configuration. If a binding lacks the required durability, adapt that server layer to a Melon-hosted store. Test migrations, an online game, reconnect and state across container recreation, plus backup and restore, before calling online deployment ready.
3. Review Caddy, DNS and TLS for each hostname and validate a real HTTPS and WebSocket session. Inventory the Beanroti catalog origin and publish its update on Melon only after the target URL passes production smoke.
4. Use classical Shatranj to prove the full path. Follow it with the Three-player Chess tutorial, bots and online rooms. Check CPU and memory with realistic concurrent games as more containers are added, then consolidate hosting processes if needed while preserving product routes and state isolation.
