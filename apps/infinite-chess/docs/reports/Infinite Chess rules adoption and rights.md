# Infinite Chess rules adoption and rights

**Research date:** 2026-11-26

**Decision:** Select the official Classical default and proceed with product-local AGPL-3.0-or-later licensing for source-derived software. No external contact was made.

## Edition selection and adoption

Infinite Chess has many possible initial configurations and named variants. InfiniteChess.org identifies “Classical”
as its default variant. Its news archive says the first tournament on the site was played on Classical (September
2024); its next tournament announcement describes a different “Chess on an Infinite Plane” starting position
(March 2025). These are evidence that both editions have been used competitively, but the public sources reviewed
do not provide comparative game counts or participation data. The roadmap's existing Classical selection is
retained as the official default and an established tournament edition; this report does not call it the proven
most popular variant.

The project's separate Apeiron engine is a public Rust/WASM engine for infinite chess. The GitHub listing showed
GPL-3.0 and zero stars at research time; that is not popularity evidence for a game edition. The official web
project's repository showed AGPL-3.0 and a much larger visible GitHub audience, but repository stars are not player
counts and are not used as a proxy for variant popularity.

## Rules profile to use if cleared

The official guide says the rules are almost identical to classical chess, with an unbounded board, unlimited
sliding movement, coordinate-pair squares, and fixed pawn promotion ranks in Classical. It names checkmate,
stalemate, threefold repetition, the 50-move rule, castling, and en passant as inherited rules. The official guide
maps `a1` to `(1,1)` and `h8` to `(8,8)`. The official site describes the board as borderless in every direction and
says pawns promote at ranks 1 and 8.

An independent Infinite Chess Notation (ICN) repository provides a concrete Classical setup and examples showing
negative coordinates, en passant, promotion, castling and check. It is useful corroboration for exact-position
work, but it is not a substitute for documenting the official site's complete rules. Before implementation, verify
the initial setup and exact castling, en-passant, repetition, 50-move, promotion-choice, and stalemate semantics
against the official implementation/source. The broad phrase “same as classical chess” does not settle every
digital edge case.

## Rights review

The official `infinitechess.org` repository's `docs/COPYING.md` says files are AGPL-3.0-or-later unless an exception
applies, and that works derived from its software must use the same license. Infinite Chess product-specific source
derived from that project will use AGPL-3.0-or-later and preserve Naviary's copyright/license notices; the rest of
the monorepo keeps its GPL-3.0-or-later terms. The GNU FAQ says AGPLv3 and GPLv3 code may be combined; the AGPL
section 13 network-source requirement applies to the combined program. The product therefore needs a prominent
source link to complete corresponding source covering the web client and online service.

This establishes a source-license route for a derived software implementation. It does not grant the
InfiniteChess.org brand, art, prose or files excluded by the official COPYING exceptions; those will not be reused.
New product code, art, interface and tutorial wording will be original and the app will be independently branded.
The separate Apeiron engine has GPL-3.0 terms and is not part of the selected implementation. This review is not a
legal opinion. No external contact was made or is needed for this route.

## Sources

- [Official Infinite Chess guide](https://www.infinitechess.org/guide) — Classical default, board, sliding movement, coordinate system and inherited chess rules.
- [Official Infinite Chess homepage](https://www.infinitechess.org/) — project description, infinite board, checkmate objective, pawn ranks, release identity and creator context.
- [Official Infinite Chess news archive](https://www.infinitechess.org/news) — tournament editions, variant activity and release history.
- [Official site's copying terms](https://github.com/Infinite-Chess/infinitechess.org/blob/main/docs/COPYING.md) — AGPL coverage and exceptions.
- [Official site's GitHub repository](https://github.com/Infinite-Chess/infinitechess.org) — public source and AGPL-3.0 license metadata.
- [Apeiron engine repository](https://github.com/Infinite-Chess/apeiron) — engine description, Rust/WASM implementation, and GPL-3.0 metadata.
- [Infinite Chess Notation repository](https://github.com/tsevasa/infinite-chess-notation) — corroborating Classical position and move notation examples; not treated as the official rules authority.

## Implementation outline if rights clear

- Store only occupied sparse cells; use exact serializable integer coordinates and ray queries.
- Validate actions on the server against the same rules engine. Keep viewport bounds out of rules.
- Make bounded bot move generation explicit; the legal destination space for each sliding move is infinite.
- Build a custom pannable/zoomable board, a complete guided tutorial, local play against bots, pass-and-play and private invite rooms.
- Release as an independent English PWA on Melon with isolated storage, then verify restart/restore and public routing before catalog publication.
