# Ko Shogi source transcription and profile decisions

Updated 2026-11-27. This is an independent working transcript of rules facts and coordinate conventions, not a translation, reproduction, or scan surrogate. The primary source is Ogyū Sorai’s 1770 *Kōshōgifu*, held in a 14-image scan at [Tōhoku University](https://touda.tohoku.ac.jp/collection/database/library/10010000019232). The corresponding 1773 *Kōshōgifu Gukai* is catalogued by [NIJL](https://kokusho.nijl.ac.jp/biblio/100169203) and by the [German Union Catalogue](https://rep.adw-goe.de/bitstream/handle/11858/2327/2397_VOHD_XXVII5.pdf?sequence=1). The old pages were visually checked from temporary research copies only; those copies are not in the repository.

The full playable movement chart and digital contract live in [`packages/ko-shogi/RULES.md`](../../../../packages/ko-shogi/RULES.md). The chart follows the detailed English profile where that profile resolves an incomplete or disputed source passage; it is not represented as a critical translation. This file records the formation and the source-to-product decisions so future work does not have to reconstruct them.

## Setup transcribed from the 1770 “position” section

The source describes seven “lines,” each arranged from the center outward and symmetrically placed on both sides, except explicitly named right/left pieces. Using files `a` through `s`, file `j` is the center. The White-side ranks below are the seven rows; Black is the 180° rotation. A paired piece occupies both points at the stated offset. Empty entries are intentional.

| Rank | Offset 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | Piece count |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | ---: |
| 7 | General | Staff Officer / Clerk | Aide-de-camp ×2 | Sumo Wrestler ×2 | Aide ×2 | Staff ×2 | Chief of Staff ×2 | Engineer ×2 | Taoist Priest / Spiritual Monk | Advance Guard ×2 | 19 |
| 6 | Middle Troop | Banner / Drum | Sentry ×2 | empty | Millenary ×2 | empty | Quartermaster ×2 | empty | Centuria ×2 | Rear Guard ×2 | 13 |
| 5 | Frankish Cannon | Elephant ×2 | Longbow ×2 | Crossbow ×2 | Cannon ×2 | Elephant ×2 | Longbow ×2 | Crossbow ×2 | Cannon ×2 | Elephant ×2 | 19 |
| 4 | empty | Cavalryman ×2 | empty | Cavalryman ×2 | empty | Cavalryman ×2 | empty | Cavalryman ×2 | empty | Cavalry ×2 | 10 |
| 3 | Patrol Unit | empty | Pawn ×2 | empty | Pawn ×2 | empty | Pawn ×2 | empty | Patrol Unit ×2 | empty | 9 |
| 2 | Shield Unit | Chariot ×2 | Shield ×2 | Chariot ×2 | Shield ×2 | Chariot ×2 | Shield ×2 | Chariot ×2 | Shield Unit ×2 | Chariot Unit ×2 | 19 |
| 1 | Vanguard | empty | empty | empty | empty | empty | empty | empty | empty | empty | 1 |

Per-side line totals are `19 + 13 + 19 + 10 + 9 + 19 + 1 = 90`. This matches the original preface’s 90 black and 90 white pieces and the modern inventory list. The source defines the enemy camp as the six ranks beginning at the opponent’s Chariot line. It exempts General, Sumo Wrestler and Elephant from promotion there.

## Movement and promotion coverage

The setup names 34 starting forms. The promotion mapping gives 31 further forms, for 65 total forms. Every one has a movement line, promotion destination and applicable special condition in `packages/ko-shogi/RULES.md`. `Count` is piece forms, not unit copies.

| Coverage block | Forms covered |
| --- | ---: |
| Command and near ranks: General, Clerk, Staff Officer, Aide-de-camp, Sumo Wrestler, Aide, Staff, Chief of Staff, Engineer, Taoist Priest, Spiritual Monk, Advance Guard | 12 starting + 10 promoted = 22 |
| Second line: Middle Troop, Drum, Banner, Sentry, Millenary, Quartermaster, Centuria, Rear Guard | 8 starting + 8 promoted = 16 |
| Artillery and Elephant line: Frankish Cannon, Elephant, Longbow, Crossbow, Cannon | 5 starting + 4 promoted = 9 |
| Cavalry line: Cavalryman and Cavalry | 2 starting + 2 promoted = 4 |
| Pawn and Patrol line | 2 starting + 2 promoted = 4 |
| Shield, Chariot, and Vanguard lines | 5 starting + 5 promoted = 10 |
| **Total** | **34 + 31 = 65** |

The separate catalog’s “53 different moves” can be reproduced by treating each distinct movement/shot profile as one move and merging 12 duplicates: General/Middle Troop/Governor (three forms to one profile, two duplicates); Banner/Drum; Taoist Priest/Spiritual Monk; Aide-de-camp promotion/Quartermaster; Sentry promotion/Centuria; Cavalryman promotion/Cavalry; Pawn promotion/Patrol Unit; Shield promotion/Shield Unit; Chariot promotion/Chariot Unit; Chariot Unit promotion/Millenary; and the two promotions to Commissar. The source does not say whether “move” counts movement profile, piece form, or special effects, so 53 remains a plausible arithmetic reconciliation, not a verified bibliographic definition.

## Source comparisons and selected conventions

| Rule | Source evidence | V1 decision |
| --- | --- | --- |
| Shoot timing | The 1770 text lists shooting powers but does not say when they occur. The 1773 commentary requires a move first. | A shooter moves first; its shots are optional and can follow each allowed movement leg. |
| Poison Flame | The 1770 passage says adjacent pieces of either side are killed, including Taoist Priest and Spiritual Monk; the commentary omits that exception. | Burn every adjacent piece immediately on arrival, before any later shot or leg. |
| Banner-and-Drum | 1770 says the promoted Staff Officer may stand in for Banner and Drum but does not explain how; 1773 omits this role. | It fills both command/pawn-support roles while alive. No retroactive reversion from this piece when the Taoist Priest is captured. |
| Five-intersection effect | “Within five intersections” can be read as an area or a line. | Use an area: Chebyshev distance at most five. |
| Net effect | The source says the piece immobilizes what it “points at”; exact ray-blocking detail is not stated. | Immobilize enemy pieces on unobstructed movement rays listed for that Net. |
| Governor | The 1770 and 1773 texts do not name Governor; the modern gameplay profile includes it as promoted Middle Troop. | Include Governor and its second-commander role, clearly labeled as part of the reconstruction. |
| Gun Carriage / Chariot of the Gods | The 1773 commentary names the promotions more clearly than the 1770 text. | Include both promoted forms, with their movement/shot rules from the selected profile. |
| Displacement capture by shooters | Some modern summaries prohibit it broadly; the surviving profile explicitly restricts certain special pieces and large chariots. | Other shooters may capture by displacement, with each explicit target restriction retained. |
| Setup wording | 1770 gives the seven center-out lines but not modern coordinate notation or a formal side-to-move rule. | Use the exact symmetric inventory above; Black-first is a labeled digital convention. |
| Camp promotion | Source says pieces entering the opposing camp change; the modern profile makes camp promotion optional and also allows promotion on exit/within. | Permit optional promotion if the completed route enters, exits, or stays in the opponent’s six-rank camp. |
| Repetition / no-move | The modern profile supplies fourfold no-contest and a ban on perpetual check; it does not give a detailed no-legal-move result. | Four occurrences with same side to move draw unless one side perpetually checks the sole objective (that side loses); no legal move loses as a digital convention. |
| Chief of Staff movement | The old-text transcription associated with the scan and the modern English movement chart differ on this piece’s lateral-range wording. | Follow the detailed English movement chart for the playable profile and preserve this mismatch for scholarly review; do not describe it as settled by translation. |

## Rights update

Ogyū Sorai (1666–1728) and Bun’yū (1700–1763) both died more than 70 years before the current date. The project therefore treats mechanics derived from both original books as public-domain rule facts under Japan’s general author-life term. This does not authorize republication, tracing, or bundling of Tōhoku, NIJL, or Waseda scans; no such images or image-derived artwork are included. See [`rights.md`](rights.md) for the full jurisdiction and image-terms boundary. No rights-holder contact was made.
