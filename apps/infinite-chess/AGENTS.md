# Infinite Chess

The selected planning edition is InfiniteChess.org's Classical default. Keep its source and rights decisions in
`docs/PLAN.md` and `docs/reports/Infinite Chess rules adoption and rights.md`; the source-grounded rules contract
is `packages/infinite-chess/RULES.md`.

## Rules and license decisions (2026-11-26)

- The official guide calls Classical its default, and the official news archive records the first site tournament
  on Classical. No public comparative play counts were found, so the selection is the established default and
  tournament edition; do not claim it is statistically the most popular.
- The official web project is AGPL-3.0-or-later and Apeiron is GPL-3.0. The product plan uses the official source
  license for source-derived product software, preserves required notices, and provides a prominent link to the
  complete corresponding source as required for network use. The repository's GPL-3.0-or-later code may be combined
  with AGPLv3 code; see the recorded GNU references in `docs/PLAN.md`.
- Implement rules independently. Do not copy upstream source, art, logo, page text, or product identity. Before any
  later upstream adaptation, check the exact file against the official COPYING exceptions and preserve its notices.
  Use original code, art, interface and tutorial wording. The product plan and rules contract record the license
  scope; the engine, bot, PWA, tutorial and isolated room service are implemented.
- No external contact was made. Do not contact the creator or maintainers without owner authorization.
- Full workspace verification, product build, local browser smoke and offline PWA checks pass. Remaining release
  work under `infinite-chess-001` is exact-SHA CI, the Melon stage browser/PWA smoke and storage recovery. Public
  promotion also requires DNS, TLS, HTTPS and WSS checks.
