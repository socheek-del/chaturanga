# Three-player chess

The playable version uses an original 91-cell hex board with three rotated armies. The layout follows
the hexagonal-cell category in the three-player chess article. Movement, promotion and endings
are specified in `packages/threechess/RULES.md`.

The app is English pass-and-play. Games save in the browser under a hex-specific key. Previous ring
positions use a separate key because their boards and moves cannot be replayed on the hexagon.
The owner approved hosting this product on its own Cloudflare Worker without D1.
