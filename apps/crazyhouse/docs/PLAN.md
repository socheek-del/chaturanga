# Crazyhouse

## Edition

Implement the standard two-player online Crazyhouse rules documented by FICS and Lichess. Captured pieces reverse color and enter the capturer's pocket; pocket pieces may be dropped as moves. Promoted pieces revert to pawns when captured. The target list names Crazyhouse as one game rather than presenting competing Crazyhouse editions. A current academic review describes its growth through online servers. The exact selection and rights notes are in `docs/reports/Crazyhouse rules and rights.md`.

## Product

- Independent English PWA with its own design identity, site configuration, manifest, rules package and server service.
- Play against a bounded bot and as either color; include pass-and-play.
- Private two-seat online invite rooms with server-side legality, reconnect and isolated persistence; no chat.
- Interactive tutorial covering pockets, captures, legal drops, checks, pawn restrictions, promotion, special moves and endings.
- Use original product prose, art and tutorial content.

## Rules decisions

The initial position and normal moves follow orthodox chess. Captures add the captured piece to the moving player's pocket. Drops may block check and give check or mate. Pawns cannot be dropped on ranks one or eight; same-file drops and pawn-drop mate are legal. A pawn dropped on its own second rank retains the ordinary first-move double step. A captured promoted piece reverts to a pawn in hand. Checkmate, stalemate, repetition and the 50-move rule apply to the full position, including pockets and promotion provenance. Fairy-Stockfish does not automatically adjudicate insufficient material in Crazyhouse, even for king versus king or a lone minor; follow that behavior.

Use Crazyhouse FEN with bracketed pockets and `~` promoted-pawn markers. FEN dialects differ among servers, so treat the selected serialization as a product contract and verify round trips. Fairy-Stockfish's `crazyhouse` preset will be the rules oracle; do not copy its engine implementation.

## Implementation sequence

1. [x] Pure `@chaturanga/crazyhouse` rules package, FEN and full chess/drop behavior; shared Variant conformance, focused Fairy-Stockfish fixtures and 16 seeded lock-step games pass.
2. [x] Bounded single-player bot with pocket-aware evaluation, legal fallback and drop-aware tactics; all six levels make legal moves as both colors.
3. [x] Standalone English PWA with custom Crazyhouse identity, board and hand trays, 14 interactive lessons, local saves, takeback and pass-and-play; production-preview install/offline checks pass.
4. [x] Server-validated two-seat invite rooms and quick match, reconnect, Crazyhouse pocket/drop moves, chat-free play and isolated persistent storage.
5. Full CI, browser/offline checks, exact-SHA Melon stage, restart and backup/restore; public HTTPS/WebSocket smoke and catalog publication after DNS resolves.

## Open release risks

- Direct probes and focused tests confirm dropped-pawn double-step, `P@square` drop notation and the selected draw behavior against bundled Fairy-Stockfish 0.7.10.
- Crazyhouse does not have one universal FEN dialect. Keep the bracket-pocket format and promoted marker documented and stable.
- The Crazyhouse hostname is `crazyhouse.beanroti.com`; Melon DNS may need to be added before public promotion.
- Use original rules prose, interface, artwork and code. The rights review identified no permission gate for the game method itself; do not copy platform expression or branding.
