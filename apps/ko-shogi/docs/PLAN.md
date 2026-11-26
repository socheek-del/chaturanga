# Ko Shogi (廣象棋) — research gate

Ko Shogi is the next historical game after Chu Shogi in the chess-like rollout. The available evidence supports a source-based reconstruction, not a proven popular edition. Do not begin implementation until the rules profile is checked against the source texts and the repository's permission gate is satisfied.

## Candidate rules basis

Use Ogyū Sorai's 1770 *Kōshōgifu* and the 1773 *Kōshōgifu Gukai* commentary as the primary basis. The commentary's catalog date has a conflicting 1770 entry at Noda City Library; 1773 is better supported by other catalogs. The modern English profile describes a 19×19 intersection board, 90 pieces per side and 34 starting types, but its complete movement chart has not yet been independently transcribed. Modern summaries disagree on whether there are 53 or 65 distinct moves.

Before freezing the rules contract, verify each setup cell and piece movement against readable source diagrams and record decisions for shooting timing, Banner-and-Drum substitution, Poison Flame effects, five-intersection ranges, and Governor's inclusion. Identify each modern convention as an inference where the historical texts are unclear. See [the source-linked research report](reports/Ko%20Shogi%20rules%20adoption%20rights.md) and its notes under `research_notes/Ko Shogi rules adoption rights/`.

## Adoption and rights

No evidence supports calling one Ko Shogi form the most popular. Available records show historical rule texts and modern listings, but no comparable participation data, recurring competition record, or active association standard. Describe the product as “Ko Shogi, reconstructed rules” if it eventually ships; do not treat Wikipedia's unexplained 1997 date as an origin date.

Write any future code, tutorial, notation and diagrams independently from source facts. Do not copy the modern English reconstruction's prose, layout, examples or diagrams. The modern reconstruction's author/license and the exact NIJL item reuse marker remain unverified. Waseda asks for advance application to reuse its digital scan; do not republish scan images without clearing that process. The Commons setup SVG has CC BY 3.0 terms if reused; original artwork avoids that obligation. No rights-holder contact has been made.

## Current status — 2026-11-26

- Research notes and the report are saved under this product's `docs/` directory.
- No Ko Shogi package, web app, worker, rules contract or public route exists.
- Block implementation until the full movement/setup chart is reviewed and the project rights requirement is met through public-domain/appropriately licensed source material or written permission.
- If that gate cannot be met, leave Ko Shogi blocked and proceed to the next ready roadmap item, Arimaa.
