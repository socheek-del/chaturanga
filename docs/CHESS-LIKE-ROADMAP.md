# Chess and chess-like games rollout

Scope snapshot, 2026-11-24. The [Wikipedia section](https://en.wikipedia.org/wiki/List_of_abstract_strategy_games#Chess_and_chess-like_games) lists 42 entries. Six existing products already provide bots, local multiplayer and online rooms. Three-player Chess is live with local multiplayer and needs bots and online rooms. The other 35 entries need new products, including one representative of the Shogi variants entry.

The section defines the catalog. For each game, use its linked description and primary rules where available. Record the selected edition, source, setup, turn, edge cases and outcomes in the product rules document before implementing. Prefer the most widely played documented variant when supported by evidence. Where usage data is missing, use an established tournament edition or a clearly identified reconstruction. The selections below are planning defaults. Confirm incomplete or conflicting rules before committing an engine.

## Existing products

| Wikipedia entry | Work |
| --- | --- |
| Chess | Keep standard international chess and existing modes |
| Janggi | Keep current Korean chess rules and existing modes |
| Makruk | Keep current Thai chess rules and existing modes |
| Shogi | Keep standard 9×9 rules and existing modes |
| Sittuyin | Keep current Burmese chess rules and existing modes |
| Xiangqi | Keep current Chinese chess rules and existing modes |
| Three-player chess | Keep the owner's 91-cell hex game. Add one-human/two-bot play and three-seat invite rooms. Preserve existing saves and local play |

## Build order

Each row is one product. Complete and release one at a time. A source or permission blocker on one row leaves the next ready row available.

| Wave | Wikipedia entry | Default and implementation dependency |
| --- | --- | --- |
| 1 | Shatranj | Classical Persian/Arabic rules with ferz promotion, stalemate as a win and immediate reciprocal baring as a draw. [Historical rules reference](https://www.chessvariants.org/historic.dir/HistoricalChessVariants.pdf) |
| 1 | Chaturanga | Two-player historical reconstruction. Pin the elephant movement and victory rules to a named source such as [Ludii's documented reconstruction](https://ludii.games/data.php?gameId=123) |
| 1 | Maharajah and the Sepoys | Orthodox army versus one maharajah. Verify both winning conditions and army restrictions |
| 1 | Courier chess | Historical 12×8 game. Pin opening and promotion conventions |
| 1 | Grande Acedrex | Alfonso X's *Libro de los juegos* reconstruction. Confirm movement and any opening conventions |
| 1 | Tamerlane chess | Standard 11×10 historical reconstruction including citadels and distinct pawn promotions |
| 1 | Shatar | Standard Mongolian game, with a pinned mate and opening convention |
| 1 | Hiashatar | Separate Mongolian game with bodyguards. Verify the bodyguard zone from the selected rules |
| 1 | Shatra | Altai game. Verify setup, capture and endgame from a documented edition |
| 1 | Fortress chess | Russian fortress variant. Pin a source covering the board extensions and setup |
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

## Release checks

- Implement one shipped PWA per game with its own site config, Worker, rules and assets. Use English initially for new products unless another language is specified. Complete each declared locale.
- Ship a full game against bots and same-device play when private information or simultaneous inputs can be preserved. Provide private online invite rooms wherever applicable. Hidden-state and simultaneous games can use a private handoff when practical, with online rooms for mechanics that need separate devices or concurrent input.
- Online rooms validate every action server-side and test seat assignment, reconnect, private information, turn or phase resolution, and completion. Keep the no-chat rule. Quick match, ranked play, tutorials and multiple difficulties are outside the initial minimum.
- Record rules fixtures, Variant conformance, bot legality and responsiveness, and browser tests for a complete game, multiplayer and mobile PWA. Use reference engine comparison when it implements the selected rules. Verify live HTTPS, modes and Worker health before publishing the directory entry.
- Commit each verified increment directly to main. Keep game deployment and later directory publication distinct where the destination must be verified first. Use a dedicated database and migrations, configure secrets and the custom domain, and check the production smoke after CI finishes. Keep the previous healthy Worker version available for rollback.

## Deployment readiness

- GitHub main and Actions are reachable. The workflow has separate path-filtered deploy jobs and references Cloudflare credentials. The 2026-11-24 baseline run failed during verification on a Three-player Chess test fixture TypeScript error. Deployment jobs depend on verification. Check the next clean run and confirm deploy credentials and zone permissions with a real release. [Baseline run](https://github.com/socheek-del/chaturanga/actions/runs/45311784040)
- Wrangler authenticated and listed ten D1 databases on 2026-11-24. The account previously rejected another creation at that count. The current dedicated-database model needs up to 36 more slots for this roadmap, including Three-player Chess online. The simplest path is owner approval for Workers Paid. The alternative is owner approval to change the storage architecture while retaining per-product isolation. The prior Three-player Chess exception supports browser storage for that release. Any similar offline-first release needs its own scope decision and leaves online work open. [D1 limits](https://developers.cloudflare.com/d1/platform/limits/) · [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)
- Keep the per-game Worker model. Verify remaining Worker and custom-domain capacity, token scope, and production migration access before provisioning each wave. The published Free limit is 100 Workers per account. Actual Worker inventory and future domain assignments still need confirmation. [Workers limits](https://developers.cloudflare.com/workers/platform/limits/)
- First implementation after planning is Shatranj, with a pinned rules contract and a bot plus local play verified in development. Online release depends on dedicated D1 capacity. Three-player Chess bot work can follow without new cloud resources.
