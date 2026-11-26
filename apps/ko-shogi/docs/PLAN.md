# Ko Shogi (廣象棋) — research gate

Ko Shogi is the next historical game after Chu Shogi in the chess-like rollout. The available evidence supports a source-based reconstruction, not a proven popular edition. The 1770 source and its archive scan are now accessible. Do not begin engine implementation until the complete setup and move chart is transcribed and checked.

## Candidate rules basis

Use Ogyū Sorai's 1770 *Kōshōgifu* as the controlling source and compare Bun'yū's separately catalogued 1773 *Kōshōgifu Gukai* where the commentary is accessible. Tōhoku University's record provides a 14-image scan of the 1770 book. Visual review confirms that its setup order is given in text and its movement rules are illustrated on later pages; this is source access, not a completed transcription. The Noda City Library record labels a *Gukai* item 1770, while other catalogs distinguish the 1773 second volume, so do not use the Noda item as proof of the 1773 edition. The modern English profile describes a 19×19 intersection board, 90 pieces per side and 34 starting types, but its complete movement chart has not yet been independently transcribed. Modern summaries disagree on whether there are 53 or 65 distinct moves.

Before freezing the rules contract, transcribe every setup cell and each base/promoted move from the historical pages, compare the relevant 1773 commentary, define what is counted by the 53-versus-65 totals, and record decisions for shooting turns, Banner-and-Drum substitution, Poison Flame effects, five-intersection ranges, and Governor's inclusion. Identify each convention as an inference where the sources are unclear. See [the source-linked research report](reports/Ko%20Shogi%20rules%20adoption%20rights.md) and its notes under `research_notes/Ko Shogi rules adoption rights/`.

## Adoption and rights

No evidence supports calling one Ko Shogi form the most popular. Available records show historical rule texts and modern listings, but no comparable participation data, recurring competition record, or active association standard. Describe the product as “Ko Shogi, reconstructed rules” if it eventually ships; do not treat Wikipedia's unexplained 1997 date as an origin date.

Write any future code, tutorial, notation and diagrams independently from source facts. Do not copy the modern English reconstruction's prose, layout, examples or diagrams. For Sorai's 1770 source, the project rights gate for using the historical rule facts is met: the National Diet Library dates Sorai 1666–1728, and Japan's Copyright Act sets the general term at 70 years after an author's death. This is an inference about the old text, not permission to reuse a modern digitization. Tōhoku University applies item-specific image conditions, and Waseda requires advance application to reuse its scan; do not republish or trace archive images. The separate 1773 commentary should be rights-checked if it supplies rules not in the 1770 source. The Commons setup SVG has CC BY 3.0 terms if reused; original artwork avoids that obligation. No rights-holder contact has been made.

## Current status — 2026-11-27

- Research notes and the report are saved under this product's `docs/` directory.
- No Ko Shogi package, web app, worker, rules contract or public route exists.
- Ko Shogi remains blocked before engine code until all setup cells, movements, promotions and special mechanics are source-checked and the 53-versus-65 count is explained. The 1770 rules-content rights gate is clear; scan images remain excluded.
- Continue this source transcription rather than skipping to Arimaa. If a disputed rule depends on the 1773 commentary, verify that source and document the playable convention before implementation.
