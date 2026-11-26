# Infinite Chess product plan

**Status:** selected for implementation after the shared unbounded-board prerequisite. Product-specific code derived from the official software will be released under AGPL-3.0-or-later.

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
castling and en passant. The official Classical preset in `src/shared/chess/variants/variantdictionary.ts` confirms
the standard 32-piece arrangement and the four choices knight, bishop, rook or queen. The official game rules set
the 50-move threshold to 100 half-moves and reset it after a pawn move or capture (`variant.ts`, `movepiece.ts`, and
`state.ts`). Use the orthodox castling and en-passant conditions from that Classical preset. These sources are linked
in the rules contract; no upstream code will be copied into the implementation.

The engine uses sparse coordinates and validates a selected destination by ray queries; it never allocates the
infinite plane or enumerates every destination on an unbounded sliding ray. State and move coordinates use a
serializable exact-integer representation, with arithmetic and server validation independent of the viewport. Bot
search uses a documented bounded candidate policy because a sliding piece has infinitely many empty destinations.
The board pans and zooms and accepts a far destination by exact coordinates. Check, checkmate and stalemate use
rule-level existence queries rather than full move lists.

This is a two-player, perfect-information game. Local human-vs-bot and pass-and-play apply. Invite rooms are
applicable and use isolated server storage with server-side move validation and no chat. The independent English PWA
includes an interactive tutorial covering coordinates, unbounded movement, castling, en passant, pawn promotion,
check evasions, checkmate, stalemate, repetition, the 50-move rule, dead positions and practice feedback.

## Rights and license plan

The official website's [`docs/COPYING.md`](https://github.com/Infinite-Chess/infinitechess.org/blob/main/docs/COPYING.md)
licenses project files AGPL-3.0-or-later unless a listed exception applies, and requires derived software to use that
license. Source-derived Infinite Chess product code will use AGPL-3.0-or-later and preserve Naviary's copyright and
license notices. The shared repository remains GPL-3.0-or-later; GNU's license text and FAQ explicitly permit
AGPLv3/GPLv3 combinations, with AGPL section 13's network-source requirement applying to the combined program. The
product must show a prominent source link to the complete corresponding source for the web client and online service.
Product-local packages, app files and deployment instructions must make this scope clear. This is a documented
license-compliance route, not a legal opinion.

We will write original game code, board UI, piece art and tutorial wording, and will not adopt InfiniteChess.org's
brand or copy assets/prose. Before adapting any upstream file, check its path against the official COPYING
exceptions and retain attribution. Apeiron is not the chosen bot dependency; its separate GPL-3.0 license would
need to be assessed independently if that changes. No external contact has been made or is needed for this route.

`plat-024` has passed: sparse string coordinates and bounded attack queries are available through the shared
`Variant` contract while numeric-square defaults remain intact. The pure Variant, bounded bot, ten-practice
interactive tutorial, independent PWA and private multiplayer are implemented. Full workspace verification, the
product build, five local browser scenarios and two offline/installability scenarios pass. Next commit and push the
verified increment, confirm exact-SHA CI, stage on Melon, then run built-stage browser/PWA, restart and copied-state
recovery checks. Public promotion still requires DNS, TLS, HTTPS/WSS and catalog checks.
