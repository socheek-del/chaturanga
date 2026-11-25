# Crazyhouse — digital rules

This package implements standard two-player Crazyhouse: orthodox chess where captured pieces return to the capturing player's pocket and may be dropped onto the board. The selected rules are documented in `apps/crazyhouse/docs/PLAN.md` and `apps/crazyhouse/docs/reports/Crazyhouse rules and rights.md`.

## Board and start

- The board is orthodox 8×8 chess, with the standard starting array, White to move, normal castling rights and no en-passant target.
- Both pockets start empty.
- Each side has one king. Kings cannot be captured, dropped or held in a pocket.

## Board moves and captures

- All non-drop moves follow orthodox chess: piece movement, check, legal king safety, castling, en passant, pawn double-step and promotion.
- A captured non-king piece changes to the capturing side's color and enters that side's pocket.
- Capturing a promoted piece adds a pawn to the capturer's pocket, regardless of the promoted piece's current type.
- Board moves that leave the moving side's king in check are illegal. A player in check may answer with any legal board move or drop that removes the check.

## Drops

- A drop consumes the turn and places one piece from the mover's pocket on an empty square.
- Kings cannot be dropped. Every other pocket piece keeps its type when dropped.
- A pawn cannot be dropped on rank one or eight. Multiple same-color pawns on a file are allowed.
- A pawn dropped on its own second rank may make a two-square advance on its next move if both forward squares are empty, like an unmoved pawn on its starting rank. This creates the usual en-passant target, which may be captured only by the opponent's immediate next move. A pawn dropped on another rank cannot make an initial two-square advance.
- Drops may give check, including immediate checkmate. Pawn-drop mate is legal.
- A drop that does not answer an existing check remains illegal if the king would still be in check.

## Promotion and endings

- A pawn that reaches the final rank must promote to a queen, rook, bishop or knight, as in chess.
- Promotion provenance is retained in the position. A promoted piece later captured returns to its capturer's pocket as a pawn.
- Checkmate wins and stalemate draws. Threefold repetition and the 50-move rule apply to the complete Crazyhouse position, including pockets and promoted-pawn provenance. Fairy-Stockfish does not automatically declare insufficient material in Crazyhouse, even for king versus king or a lone minor; this product follows that behavior.

## Serialization

- Crazyhouse FEN extends ordinary FEN with the pocket contents in square brackets immediately after the board placement. The `~` suffix marks a promoted pawn currently represented by another piece.
- The product orders pocket pieces `QRBNPqrbnp` (white then black, each by queen/rook/bishop/knight/pawn) and uses the first four Crazyhouse FEN fields as repetition identity, including pockets and promotion markers. These serialization details must remain stable across local saves, online replay and undo.

## Verification contract

- Implement `Variant` from `@chaturanga/rules-core` and pass `describeVariantConformance`.
- Compare start moves, captures-to-pocket, drops, check evasion, pawn-drop mate, pawn-drop restrictions, double steps, promotions, promoted recapture, castling, en passant and draw outcomes with Fairy-Stockfish's `crazyhouse` variant.
- Keep the engine pure: no DOM, network, timers or unseeded randomness.
