# Infinite Chess product plan

**Status:** blocked before implementation pending an adaptation-rights decision.

**Selected edition:** InfiniteChess.org Classical default.

**Research report:** [`Infinite Chess rules adoption and rights`](reports/Infinite%20Chess%20rules%20adoption%20and%20rights.md)

**Rules contract:** [`packages/infinite-chess/RULES.md`](../../../packages/infinite-chess/RULES.md)

## Selection and evidence

The InfiniteChess.org guide calls Classical the default variant. Its news archive documents the first official-site
tournament on Classical in September 2024 and a second tournament using a different “Chess on an Infinite Plane”
starting position in 2025. Public comparative usage counts were not found. Classical is therefore selected as the
official default and an established tournament edition, without claiming it is statistically the most popular.

## Rules source and implementation requirements

The official guide says the board is unbounded in both directions, sliding pieces have no range limit, squares use
integer `(x,y)` coordinates with `a1 = (1,1)` and `h8 = (8,8)`, and Classical pawns promote on ranks 8 and 1. It says
the remaining rules follow classical chess, naming checkmate, stalemate, threefold repetition, the 50-move rule,
castling and en passant. Before coding, pin the exact initial position and the precise draw, castling, en-passant
and promotion semantics against the official implementation or a sufficiently explicit source.

If cleared, the rules engine will use sparse coordinates and validate a selected destination by ray queries; it
must never allocate the infinite plane or enumerate every destination on an unbounded sliding ray. State and move
coordinates need a serializable exact-integer representation, with arithmetic and server validation independent of
the viewport. Bot search must use a documented bounded candidate policy because a sliding piece has infinitely many
empty destinations. The UI needs a pannable/zoomable board and a way to select a far destination without relying on
a finite grid widget. Check, checkmate and stalemate need rule-level existence queries rather than full move lists.

This is a two-player, perfect-information game. Local human-vs-bot and pass-and-play apply. Invite rooms are
applicable and should use isolated server storage with server-side move validation and no chat. The independent
English PWA must include an interactive tutorial covering the objective, coordinates, unbounded movement, pawn
promotion, check/endings, and practice with feedback.

## Rights and release gate

The official website source is licensed AGPL-3.0-or-later and Apeiron is GPL-3.0. These are software licenses; the
review found no separate adaptation grant for this repository. The repository is GPL-3.0 and requires an applicable
license or permission for a faithful digital adaptation of newly authored/published games. Do not start the engine,
reuse upstream assets or prose, adopt the InfiniteChess.org identity, or publish this product until an applicable
rights basis is recorded and any AGPL compatibility obligations are resolved. No external contact has been made.

After clearance: implement and verify the pure Variant, bounded bot, interactive tutorial, independent PWA, and
private multiplayer; pass workspace verification/build and exact-SHA CI; stage on Melon, then run browser/PWA,
restart and copied-state recovery checks. Public promotion still requires DNS, TLS, HTTPS/WSS and catalog checks.
