# Ko Shogi (廣象棋) — product plan

Ko Shogi is a historical two-player reconstruction. The evidence does not support calling any edition the most popular. V1 is named **Ko Shogi, reconstructed rules**, based on Ogyū Sorai’s 1770 *Kōshōgifu* and Bun’yū’s 1773 *Kōshōgifu Gukai*, with the digital choices in [`packages/ko-shogi/RULES.md`](../../../packages/ko-shogi/RULES.md).

## Rules and rights gate

The source transcription and complete playable movement chart are now in [`research_notes/Ko Shogi rules adoption rights/transcription.md`](research_notes/Ko%20Shogi%20rules%20adoption%20rights/transcription.md) and `packages/ko-shogi/RULES.md`. The formation has 90 pieces per side and seven occupied ranks on a 19×19 intersection board. The base and promoted movement profiles are listed individually. The catalog’s 53-versus-65 figures are reconciled as 65 piece forms (34 starting + 31 promoted) and 53 unique movement profiles after removing 12 duplicate profiles; the catalogs do not explain their counting method.

The rules-content rights gate is clear for the two original books: Sorai died in 1728 and Bun’yū in 1763, both before Japan’s general 70-year author term expired. Tōhoku/NIJL/Waseda scan conditions remain separate. No archive scan, modern prose, or diagram is reused. The product’s own art, interface, tutorial text, and notation will be original.

The product follows the detailed English profile where an old text is incomplete or the surviving readings differ. It explicitly labels choices for Black’s first move, move-before-shot, Banner-and-Drum role substitution, five-intersection area, Governor inclusion, net immobilization, promotion timing, no-move loss, and repeated play. The scan and differences are recorded in the research notes. Public-facing wording must say “reconstructed rules,” not imply an uncontested historical standard or popularity winner.

## Product requirements

- Independent product under `apps/ko-shogi/` and `packages/ko-shogi/`; no Ko-specific identity or content in shared packages or other games.
- English v1, with all visible strings in locale keys and the locale completeness checks enabled.
- 19×19 responsive intersection board, 90-piece opening, original rank glyphs, route chooser for compound moves and post-move shots, local saves, and pass-and-play.
- Six deterministic bounded bots for both colors, implemented on `@chaturanga/ai-core`; engine legality remains authoritative.
- Interactive tutorial that teaches the setup, ordinary moves, shots, multi-leg turns, promotions, suppression/burn/net effects, objective, repetition, and the reconstruction’s digital conventions. Exercises use the rules engine.
- Installable offline PWA with its own site setting, manifest, service worker and fonts/assets. Public domain remains unset until DNS/TLS is verified.
- Server-authoritative private two-player rooms, no chat, isolated Worker and persistent storage, server validation through the Ko Shogi Variant, reconnect/restart/copied-state recovery.
- Melon stage and verification through `ssh melon`. Keep Cloudflare as fallback only if a documented Melon limitation prevents delivery. Do not add Caddy routing or the app-directory entry until DNS, HTTPS, TLS and WSS pass.

## Work sequence

1. **Rules contract and provenance** — complete. Use this document and `packages/ko-shogi/RULES.md` as the frozen v1 profile; change it only when a test exposes a contradiction or a newly verified source passage requires a documented decision.
2. **Pure rules package** — complete. `packages/ko-shogi` implements the 19×19 setup/FEN, all declared piece profiles, routes/shots, promotions/effects, objectives, repetition, undo/replay and `Variant` conformance. The focused fixtures and full workspace verification pass; downstream product checks remain.
3. **Bots** — six deterministic strength levels, both roles, bounded node budgets and legality/strength evidence.
4. **Product shell and identity** — original design proposal in `apps/ko-shogi/docs/design.md`; keep name/design proposal separate from historical rules. Do not use association branding or trace archive/Commons diagrams.
5. **PWA and tutorial** — English locale, local/pass-and-play/bot, complete interactive tutorial, saves, install/offline operation and narrow phone-board usability.
6. **Private online play** — isolated Worker and storage, room reconnect and authoritative moves; verify restart and copied-state recovery.
7. **Release checks** — full verification, product build, exact-SHA CI, Melon stage browser/PWA smoke, recovery checks, then public DNS/TLS/HTTPS/WSS. No product route/catalog entry until the public gate passes.

## Melon allocation

- Product Worker development port: `8794`.
- Private stage loopback port: `19926`.
- Keep `KO_SHOGI_SITE_URL` empty for local/private stage builds. Do not publish or reserve a hostname until the product and DNS checks are ready.
- Stage directory and pinned commit will be written here and in `session-handoff.md` after deployment.

## Current state — 2026-11-27

- Primary-source setup and movement pages were reviewed; the source-derived setup has been normalized into coordinates and sums to 90 pieces per side.
- `packages/ko-shogi/RULES.md` has the complete v1 movement/promotion chart and records the disputed mechanics. The product-local transcription and source-rights update are recorded with the rules gate.
- The pure Variant and focused rule fixtures are implemented in `packages/ko-shogi`; full workspace verification passed. Bot, app, Worker, tutorial, PWA, rooms, product build and Melon stage are still outstanding. Continue with the bounded bot package.
