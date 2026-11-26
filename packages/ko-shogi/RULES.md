# Ko Shogi reconstructed rules

This package implements **Ko Shogi, reconstructed rules**: a 19×19 intersection game with 90 pieces per side and no drops. No evidence establishes a most-played modern edition. The playable profile follows the detailed English Ko Shogi description in the target Wikipedia article, checked against Ogyū Sorai’s 1770 *Kōshōgifu* and Bun’yū’s 1773 *Kōshōgifu Gukai*. Where the source texts do not settle a mechanic, this document records the digital choice.

The old Japanese books are the source for rules facts. Code, explanations, move notation, piece art, and board diagrams in this repository are original. The scanned archive pages are not included or traced.

## Sources and reconstruction choices

- Sorai, *Kōshōgifu* (1770): Tōhoku University’s record and 14-image scan, [catalog and IIIF viewer](https://touda.tohoku.ac.jp/collection/database/library/10010000019232). The setup text and movement pages were visually checked.
- Bun’yū, *Kōshōgifu Gukai* (1773): [NIJL catalog record](https://kokusho.nijl.ac.jp/biblio/100169203) and the separately catalogued volume listed by the [German Union Catalogue](https://rep.adw-goe.de/bitstream/handle/11858/2327/2397_VOHD_XXVII5.pdf?sequence=1). It clarifies that a shooting piece must first move. Noda’s catalog assigns the commentary a 1770 date; the German, Risshō, and Kanazawa records support 1773.
- Bun’yū is catalogued as 1700–1763 by [Kotobank](https://kotobank.jp/word/%E6%96%87%E9%9B%84-16912). Along with Sorai’s 1666–1728 dates and Japan’s general 70-years-after-death author term, this clears use of mechanics from both original texts as rules facts. This is a project inference, not permission to reuse a library scan.
- The [modern English profile](https://en.wikipedia.org/wiki/Ko_shogi) supplies a convenient playable synthesis for several under-explained moves and endings. Its wording, tables, examples, and diagrams are not reused.

The surviving texts do not prove which reconstruction is most popular. This product names its profile plainly. Black moves first as a digital convention; the scanned setup text does not state a first-move rule. A five-intersection effect uses Chebyshev distance (the square is within five king-steps), an inference from the ambiguous phrase “within five intersections.” Skyward/Earthward Nets immobilize enemies on unobstructed rays along their listed ranging directions. Banner-and-Drum fills either or both Banner/Drum roles while it remains on the board. A multi-leg turn may promote if its route touches the six-rank enemy camp. Promotion opportunities in camp are optional; special capture promotions below are automatic. When all legal moves are exhausted, the player with no move loses; this is the digital stalemate convention.

The 1770 movement passage and modern English piece chart differ on a few individual movement readings. This implementation follows the English chart where the intended move is stated clearly; the disputed lines remain listed in `apps/ko-shogi/docs/research_notes/Ko Shogi rules adoption rights/transcription.md`. Do not present those readings as a scholarly translation.

## Board and opening setup

Files run `a`–`s`; ranks run `1`–`19`. White’s home is rank 1 and White advances toward rank 19. Black’s formation is White’s 180° rotation and Black moves first. The seven occupied ranks are consecutive. Read each line from the center file `j` outward; a paired entry is placed at both files the given distance from `j`, and a left/right pair uses the named sides from that player’s perspective. Black’s seven lines are rotated 180°.

| White rank | Center-out formation (offsets 0–9) | Count |
| --- | --- | ---: |
| 7 | General; Staff Officer / Clerk; Aide-de-camp; Sumo Wrestler; Aide; Staff; Chief of Staff; Engineer; Taoist Priest / Spiritual Monk; Advance Guard | 19 |
| 6 | Middle Troop; Banner / Drum; Sentry; empty; Millenary; empty; Quartermaster; empty; Centuria; Rear Guard | 13 |
| 5 | Frankish Cannon; Elephant; Longbow; Crossbow; Cannon; Elephant; Longbow; Crossbow; Cannon; Elephant | 19 |
| 4 | empty; Cavalryman; empty; Cavalryman; empty; Cavalryman; empty; Cavalryman; empty; Cavalry | 10 |
| 3 | Patrol Unit; empty; Pawn; empty; Pawn; empty; Pawn; empty; Patrol Unit; empty | 9 |
| 2 | Shield Unit; Chariot; Shield; Chariot; Shield; Chariot; Shield; Chariot; Shield Unit; Chariot Unit | 19 |
| 1 | Vanguard at file `j`; all other points empty | 1 |

The mirror layout and inventory give exactly 90 pieces per side. Captured pieces leave play permanently; there are no hands or drops. The enemy camp is its six farthest ranks, beginning at the opponent’s Chariot rank.

## Movement notation

- **Step:** move to one adjacent intersection in a listed direction.
- **Range:** move any number of clear intersections along a listed straight line. A piece stops before a friendly piece and captures the first enemy piece on that ray.
- **Limited range:** as a range move, with the stated maximum distance.
- **Jump:** land at the stated displacement, ignoring intervening pieces.
- **Forward/back/sideways:** directions relative to the moving player. A king-step is any one of the eight neighboring intersections.
- **Shot:** remove an enemy piece without moving the shooter. A shooter has to move before shooting. Shots are optional after a move. A multi-leg shooter may shoot after each leg.
- A piece may not land on a friendly piece. A piece may capture by displacement unless a restriction below says otherwise. No move must protect a General or Governor; pins and royal safety do not apply.

## Starting pieces and promotions

There are 34 starting piece forms and 31 promoted forms (65 forms total). “Distinct move profiles” can be counted as 53 by merging the 12 repeated movement profiles listed after the table; the source does not define the catalog’s counting method, so this is a reproducible explanation rather than a historical claim.

| Starting piece | Movement | Promotion |
| --- | --- | --- |
| General | One king-step. | None. |
| Clerk | One diagonal step, or jump exactly two orthogonally. | Master-at-Arms: the same move, up to two movement legs in a turn. |
| Staff Officer | One orthogonal step, or jump exactly two diagonally. | Banner-and-Drum: the same move, up to two legs; may fill Banner/Drum roles. |
| Aide-de-camp | One king-step except straight backward. | Quartermaster. |
| Sumo Wrestler | Up to two king-steps in a turn, with turns allowed. | None. |
| Aide | One orthogonal step or one forward-diagonal step. | Town Brigade. |
| Staff | One diagonal step or one forward step. | Village Brigade. |
| Chief of Staff | One diagonal, forward, or backward step. | Vice Commander. |
| Engineer | One forward, backward, or forward-diagonal step. | Poison Flame. |
| Taoist Priest | Jump exactly two intersections in any direction; after landing it may shoot one adjacent enemy. Displacement captures only the Priest/Monk family. It may not land adjacent to its own Taoist Priest. | Five-li Fog. |
| Spiritual Monk | Same movement and shot as Taoist Priest. It may not land adjacent to its own Spiritual Monk. | Immaculate Light. |
| Advance Guard | Forward range; one backward step. | Skyward Net. |
| Middle Troop | One king-step. | Governor: one king-step and a second commander. |
| Drum | One diagonal or sideways step. If captured, friendly Pawns lose their forward step. | Thunderclap. |
| Banner | One diagonal or sideways step. | Flag Waver. |
| Sentry | One king-step except straight forward. | Centuria. |
| Millenary | Range in all eight directions. | Dragon Ascending. |
| Quartermaster | Orthogonal range or one diagonal step. | Tiger Wing. |
| Centuria | Diagonal range or one orthogonal step. | War Hawk. |
| Rear Guard | Backward range; one forward step. | Earthward Net. |
| Frankish Cannon | One diagonal step; after moving, may shoot up to two targets along any of eight lines, each at most seven intersections away. The second shot may hit a target exposed by the first. | Chariot of the Gods. |
| Elephant | Diagonal range. | None. |
| Longbow | One diagonal step; after moving, may shoot along any line up to three intersections away. | Longbow Cavalryman. |
| Crossbow | One diagonal step; after moving, may shoot along any line up to five intersections away. | Crossbow Cavalryman. |
| Cannon | One diagonal step; after moving, may shoot along any line up to five intersections away, passing intervening pieces except Shield Units and Heavenly Fortresses. | Gun Carriage. |
| Cavalryman | One knight jump (two orthogonal plus one diagonal). | Cavalry. It also promotes on capturing a Frankish Cannon. |
| Cavalry | One or two knight jumps. On a two-jump move both jumps use the same orthogonal direction; it may instead return to its origin on the second leg. | Winged Horse. |
| Pawn | One orthogonal step. It cannot move forward after its Drum is captured. | Patrol Unit. |
| Patrol Unit | Forward/backward range, or one sideways step. | Commissar. |
| Shield | One diagonal step. | Shield Unit. |
| Shield Unit | Sideways range or one diagonal step. | Heavenly Fortress. |
| Chariot | Orthogonal limited range, one to five intersections. | Chariot Unit. |
| Chariot Unit | Orthogonal range. | Millenary. |
| Vanguard | Forward limited range, one to five intersections. | Commissar. |

Promoted movement:

| Promoted piece | Movement and additional effect |
| --- | --- |
| Town Brigade | Forward/backward range, or one king-step. |
| Village Brigade | Sideways range, or one king-step. |
| Vice Commander | Diagonal range or forward range. |
| Poison Flame | Keeps the Engineer’s steps. Each time it arrives on a point, every other piece on an adjacent intersection—friendly or enemy—is removed before any later effect. |
| Five-li Fog | Keeps the Taoist Priest’s jump and shot, but may take two jump legs and shoot after each. Enemy Longbows, Crossbows, Cannons, and Frankish Cannons within five intersections cannot shoot. |
| Immaculate Light | Keeps the Spiritual Monk’s jump and shot, but may take two jump legs and shoot after each. It returns any Five-li Fog within five intersections to Taoist Priest. |
| Skyward Net | Backward step; range sideways and along the two forward diagonals. Immobilizes enemies on those unobstructed rays. |
| Thunderclap | Exactly five orthogonal step legs with three turns; may capture on each landing. If its Taoist Priest is captured, it reverts to Drum. |
| Flag Waver | One to five orthogonal steps along a single direction in a turn; may capture along the route. If its Taoist Priest is captured, it reverts to Banner. |
| Dragon Ascending | Millenary range or up to two king-steps, turning after the first. |
| Tiger Wing | Orthogonal range or up to two diagonal steps, with a capture on either step. |
| War Hawk | Diagonal range or up to two orthogonal steps, with a capture on either step. |
| Earthward Net | Forward step; range sideways and along the two rear diagonals. Immobilizes enemies on those unobstructed rays. |
| Chariot of the Gods | Orthogonal limited range, one to five intersections, and the Frankish Cannon’s double shot. |
| Longbow Cavalryman | One knight jump, then one Longbow shot from the landing point. |
| Crossbow Cavalryman | One knight jump, then one Crossbow shot from the landing point. |
| Gun Carriage | Orthogonal limited range, one to five intersections, then one Cannon shot from the landing point. |
| Winged Horse | Up to two knight jumps; no same-direction restriction. |
| Commissar | Diagonal range or forward/backward range. |
| Heavenly Fortress | Diagonal range or sideways range. |

The repeated movement profiles accounting for the `65 - 12 = 53` distinct-profile count are: General/Middle Troop/Governor; Banner/Drum; Taoist Priest/Spiritual Monk; Aide-de-camp’s promotion/starting Quartermaster; Sentry’s promotion/starting Centuria; Cavalryman’s promotion/starting Cavalry; Pawn’s promotion/starting Patrol Unit; Shield’s promotion/starting Shield Unit; Chariot’s promotion/starting Chariot Unit; Chariot Unit’s promotion/starting Millenary; and the two promotions to Commissar. The first group removes two duplicates; each remaining group removes one.

## Shots and immunity

- Longbow-family shots cannot remove Shields, Shield Units, Chariots, Chariot Units, Heavenly Fortresses, or Five-li Fogs.
- Cannon-family shots cannot remove Shield Units, Heavenly Fortresses, or Five-li Fogs. A Cannon/Gun Carriage shot can pass over ordinary pieces but not a Shield Unit or Heavenly Fortress of either color.
- Frankish Cannon/Chariot of the Gods shots cannot remove Shield Units or Heavenly Fortresses. They can shoot a Five-li Fog only from distance six or seven.
- Taoist Priest-family shots can remove any adjacent enemy piece. Taoist Priests, Spiritual Monks, Five-li Fogs, and Immaculate Lights can displace-capture only an enemy member of that four-piece family.
- A Shield cannot be shot by bow-family pieces. A Shield Unit cannot be shot by any shooter. A Heavenly Fortress cannot be shot by any shooter and cannot be captured by displacement by Chariot, Chariot Unit, Gun Carriage, or Chariot of the Gods.
- Other shooting-capable pieces may also capture by displacement.

## Promotion and cross-piece effects

A player may promote an eligible base piece when its completed turn enters, leaves, or stays within the enemy’s six-rank camp. The General, Sumo Wrestler, and Elephant never promote; promoted pieces do not promote again.

An eligible piece also promotes immediately when it captures the General, Governor, Middle Troop, Banner, or Drum; when a one-step mover captures a Sumo Wrestler, Dragon Ascending, Flag Waver, or Thunderclap; or when a Cavalryman captures a Frankish Cannon. These triggers are the “merit” promotions described in the source profile.

When a Clerk promotes to Master-at-Arms, every friendly Advance Guard and Rear Guard promotes too, and every enemy Poison Flame is removed. If a Taoist Priest is captured, that player’s Banner and Drum cannot promote; promoted Flag Wavers and Thunderclaps revert immediately. The Taoist Priest’s death does not undo a Banner-and-Drum substitution. A Five-li Fog within five intersections of an Immaculate Light reverts immediately.

## Objective, repetition, and endings

- The command condition is satisfied while the player has a General, a Governor, or both a Middle Troop and a Banner. A player loses once none of those conditions remains. Thus, without a Governor, capturing the General and either the Middle Troop or Banner wins. With a Governor, the opponent must also capture the Governor after the General and Banner; the Middle Troop/Banner pair still protects a player who has no General or Governor.
- There is no check rule or required response to an attack. A player may move into an attack or capture a commander while it is attacked. Continuous checking of a player’s sole objective piece is prohibited; a repeating side that does so loses.
- The same complete position with the same player to move occurring four times is a no-contest draw, unless the repetition is perpetual check as defined above.
- Resignation is available in the product. There are no drops. A failed or malformed digital move is rejected without changing the game; this is the product’s casual-play handling of the source profile’s illegal-move penalty.
- If the player to move has no legal action and neither capture victory nor repetition has ended the game, that player loses (digital stalemate convention).

## Digital move records

A serialized move records its origin, every landing square in route order, any shot target after the landing where the shot is taken, and the final promotion choice. A route, all its captures, promotions, burn/reversion effects, and turn change are one atomic action for save/replay and server validation. For example, `j3-j4-j3` is a two-leg return route; `j5-k6@l6` is a move followed by a shot. The engine’s canonical grammar and FEN version are defined alongside its parser in `src/` and covered by round-trip tests.

## References

- [Tōhoku University record for the 1770 *Kōshōgifu*](https://touda.tohoku.ac.jp/collection/database/library/10010000019232)
- [NIJL catalog record for the 1773 *Gukai*](https://kokusho.nijl.ac.jp/biblio/100169203)
- [German Union Catalogue, entry 283](https://rep.adw-goe.de/bitstream/handle/11858/2327/2397_VOHD_XXVII5.pdf?sequence=1)
- [Ko Shogi source-difference notes](https://en.wikipedia.org/wiki/Ko_shogi#Notes)
