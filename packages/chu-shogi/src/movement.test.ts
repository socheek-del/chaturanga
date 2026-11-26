import { describe, expect, it } from 'vitest';
import { BOARD_SIZE, FILES, RANKS } from './layout';
import { applyMove, generateMoves, type Move } from './movement';
import { makePiece, square, type PieceType, type Position } from './position';

function position(pieces: Record<string, string>, turn: 'w' | 'b' = 'w'): Position {
  const board: Position['board'] = Array.from({ length: BOARD_SIZE }, () => null);
  for (const [name, token] of Object.entries(pieces)) {
    const [color, type, flag] = token.split(':');
    board[square(name)] = makePiece(color as 'w' | 'b', type as PieceType, flag === '+', flag !== '!');
  }
  return { board, turn, counterstrike: null, ply: 0 };
}

function movesFrom(state: Position, from: string): Move[] {
  return generateMoves(state).filter((move) => move.from === square(from));
}
function uciFrom(state: Position, from: string): string[] {
  return movesFrom(state, from).map((move) => move.uci);
}

describe('Chu Shogi movement', () => {
  it('moves King, Drunk Elephant, Blind Tiger, and Ferocious Leopard by their source directions', () => {
    const king = position({ f6: 'w:king' });
    expect(uciFrom(king, 'f6')).toHaveLength(8);
    expect(uciFrom(king, 'f6')).toEqual(expect.arrayContaining(['f6e5', 'f6f5', 'f6g5', 'f6e6', 'f6g6', 'f6e7', 'f6f7', 'f6g7']));

    const drunk = position({ f6: 'w:drunk-elephant' });
    expect(uciFrom(drunk, 'f6')).toContain('f6f7');
    expect(uciFrom(drunk, 'f6')).not.toContain('f6f5');

    const tiger = position({ f6: 'w:blind-tiger' });
    expect(uciFrom(tiger, 'f6')).toContain('f6f5');
    expect(uciFrom(tiger, 'f6')).not.toContain('f6f7');

    const leopard = position({ f6: 'w:ferocious-leopard' });
    expect(uciFrom(leopard, 'f6')).toEqual(expect.arrayContaining(['f6f7', 'f6f5', 'f6e7', 'f6g7', 'f6e5', 'f6g5']));
    expect(uciFrom(leopard, 'f6')).not.toContain('f6e6');
  });

  it('moves Kirin and Phoenix with steps and jumps that pass over occupied squares', () => {
    const kirin = position({ f6: 'w:kirin', f7: 'w:pawn', g6: 'b:pawn' });
    expect(uciFrom(kirin, 'f6')).toEqual(expect.arrayContaining(['f6e5', 'f6g5', 'f6e7', 'f6g7', 'f6f8', 'f6d6', 'f6h6', 'f6f4']));
    expect(uciFrom(kirin, 'f6')).not.toContain('f6f7');
    expect(movesFrom(kirin, 'f6').find((move) => move.uci === 'f6h6')?.captures).toEqual([]);

    const phoenix = position({ f6: 'w:phoenix', g6: 'b:pawn' });
    expect(uciFrom(phoenix, 'f6')).toEqual(expect.arrayContaining(['f6f7', 'f6g6', 'f6f5', 'f6e6', 'f6h8', 'f6d8', 'f6h4', 'f6d4']));
    expect(movesFrom(phoenix, 'f6').find((move) => move.uci === 'f6h8')?.captures).toEqual([]);
  });

  it('slides until blocked and captures the first enemy piece without jumping over it', () => {
    const state = position({ f6: 'w:rook', f8: 'b:pawn', f9: 'b:king', h6: 'w:pawn' });
    const moves = uciFrom(state, 'f6');
    expect(moves).toEqual(expect.arrayContaining(['f6f7', 'f6f8', 'f6e6', 'f6d6', 'f6g6']));
    expect(moves).not.toContain('f6f9');
    const captured = movesFrom(state, 'f6').find((move) => move.uci === 'f6f8')!;
    expect(captured.captures).toMatchObject([{ square: square('f8'), piece: { color: 'b', type: 'pawn' } }]);
    expect(moves).not.toContain('f6h6');
  });

  it('adds promoted moves for entry, captures in the zone, and Pawn/Lance rescue', () => {
    const entering = position({ d8: 'w:pawn' });
    expect(uciFrom(entering, 'd8')).toEqual(expect.arrayContaining(['d8d9', 'd8d9+']));

    const declined = position({ d9: 'w:pawn:!' });
    expect(uciFrom(declined, 'd9')).toContain('d9d10');
    expect(uciFrom(declined, 'd9')).not.toContain('d9d10+');

    const capturedInZone = position({ d9: 'w:pawn:!', d10: 'b:pawn' });
    expect(uciFrom(capturedInZone, 'd9')).toContain('d9d10+');

    const pawnAtLastRank = position({ d11: 'w:pawn' });
    expect(uciFrom(pawnAtLastRank, 'd11')).toEqual(['d11d12', 'd11d12+']);

    const lanceAtLastRank = position({ d11: 'w:lance' });
    expect(uciFrom(lanceAtLastRank, 'd11')).toContain('d11d12+');
  });

  it('generates complete Lion routes, jumps, Igui captures, and Jitto passes', () => {
    const open = position({ f6: 'w:lion', f7: 'w:pawn' });
    const openMoves = uciFrom(open, 'f6');
    expect(openMoves).toContain('f6f8'); // Direct jump ignores the friendly piece on f7.
    expect(openMoves).not.toContain('f6f7f8');

    const routes = position({ f6: 'w:lion', g6: 'b:pawn' });
    const moves = movesFrom(routes, 'f6');
    expect(moves.find((move) => move.uci === 'f6g6f6')?.captures).toMatchObject([{ square: square('g6') }]);
    expect(moves.find((move) => move.uci === 'f6g7f6')?.captures).toEqual([]);

    const doubleCapture = position({ f6: 'w:lion', g6: 'b:gold-general', h6: 'b:pawn' });
    expect(movesFrom(doubleCapture, 'f6').find((move) => move.uci === 'f6g6h6')?.captures).toHaveLength(2);
  });

  it('limits Horned Falcon and Soaring Eagle lion power to their forward rays', () => {
    const falcon = position({ f6: 'w:dragon-horse:+' });
    const falconMoves = uciFrom(falcon, 'f6');
    expect(falconMoves).toContain('f6f8');
    expect(falconMoves).toContain('f6f7f8');
    expect(falconMoves).toContain('f6f7f6');
    expect(falconMoves).not.toContain('f6g6g7');

    const eagle = position({ f6: 'w:dragon-king:+' });
    const eagleMoves = uciFrom(eagle, 'f6');
    expect(eagleMoves).toContain('f6g7h8');
    expect(eagleMoves).toContain('f6g7f6');
    expect(eagleMoves).not.toContain('f6f7e8');
  });

  it('pins every starting and promoted rank to its published movement family', () => {
    const examples = [
      { token: 'w:king', reaches: ['f6g7'], blocked: ['f6h7'] },
      { token: 'w:free-king', reaches: ['f6l6', 'f6g7'], blocked: ['f6g8'] },
      { token: 'w:drunk-elephant', reaches: ['f6f7', 'f6g6'], blocked: ['f6f5'] },
      { token: 'w:kirin', reaches: ['f6g7', 'f6h6'], blocked: ['f6f7'] },
      { token: 'w:phoenix', reaches: ['f6f7', 'f6h8'], blocked: ['f6g7'] },
      { token: 'w:rook', reaches: ['f6f12', 'f6l6'], blocked: ['f6g7'] },
      { token: 'w:bishop', reaches: ['f6l12', 'f6g7'], blocked: ['f6f7'] },
      { token: 'w:dragon-king', reaches: ['f6f12', 'f6g7'], blocked: ['f6g8'] },
      { token: 'w:dragon-horse', reaches: ['f6l12', 'f6f7'], blocked: ['f6g8'] },
      { token: 'w:vertical-mover', reaches: ['f6f12', 'f6g6'], blocked: ['f6g7'] },
      { token: 'w:side-mover', reaches: ['f6l6', 'f6f7'], blocked: ['f6g7'] },
      { token: 'w:reverse-chariot', reaches: ['f6f12'], blocked: ['f6g6'] },
      { token: 'w:lance', reaches: ['f6f12'], blocked: ['f6f5'] },
      { token: 'w:blind-tiger', reaches: ['f6f5', 'f6g6'], blocked: ['f6f7'] },
      { token: 'w:ferocious-leopard', reaches: ['f6g7', 'f6f5'], blocked: ['f6g6'] },
      { token: 'w:gold-general', reaches: ['f6g7', 'f6f5'], blocked: ['f6e5'] },
      { token: 'w:silver-general', reaches: ['f6g7', 'f6e5'], blocked: ['f6f5'] },
      { token: 'w:copper-general', reaches: ['f6g7', 'f6f5'], blocked: ['f6f7'] },
      { token: 'w:go-between', reaches: ['f6f7', 'f6f5'], blocked: ['f6g6'] },
      { token: 'w:pawn', reaches: ['f6f7'], blocked: ['f6f5'] },
      { token: 'w:drunk-elephant:+', reaches: ['f6g7', 'f6f5'], blocked: ['f6g8'] },
      { token: 'w:phoenix:+', reaches: ['f6l6', 'f6g7'], blocked: ['f6g8'] },
      { token: 'w:rook:+', reaches: ['f6f12', 'f6g7'], blocked: ['f6g8'] },
      { token: 'w:bishop:+', reaches: ['f6l12', 'f6f7'], blocked: ['f6g8'] },
      { token: 'w:dragon-king:+', reaches: ['f6f12', 'f6g7', 'f6g7h8'], blocked: ['f6g8'] },
      { token: 'w:dragon-horse:+', reaches: ['f6l6', 'f6f7', 'f6f7f8'], blocked: ['f6g8'] },
      { token: 'w:vertical-mover:+', reaches: ['f6f12', 'f6g7'], blocked: ['f6g6'] },
      { token: 'w:side-mover:+', reaches: ['f6l6', 'f6g7'], blocked: ['f6f12'] },
      { token: 'w:reverse-chariot:+', reaches: ['f6f12', 'f6e5'], blocked: ['f6g7'] },
      { token: 'w:lance:+', reaches: ['f6f12', 'f6g7'], blocked: ['f6g5'] },
      { token: 'w:blind-tiger:+', reaches: ['f6f10', 'f6g6'], blocked: ['f6g8'] },
      { token: 'w:ferocious-leopard:+', reaches: ['f6l12'], blocked: ['f6f12'] },
      { token: 'w:gold-general:+', reaches: ['f6f12', 'f6l6'], blocked: ['f6g7'] },
      { token: 'w:silver-general:+', reaches: ['f6f12', 'f6g6'], blocked: ['f6g7'] },
      { token: 'w:copper-general:+', reaches: ['f6l6', 'f6f7'], blocked: ['f6g7'] },
      { token: 'w:go-between:+', reaches: ['f6f7', 'f6g6'], blocked: ['f6f5'] },
      { token: 'w:pawn:+', reaches: ['f6f7', 'f6g7'], blocked: ['f6g8'] },
    ];
    for (const { token, reaches, blocked } of examples) {
      const moves = uciFrom(position({ f6: token }), 'f6');
      for (const uci of reaches) expect(moves, `${token} should include ${uci}`).toContain(uci);
      for (const uci of blocked) expect(moves, `${token} should exclude ${uci}`).not.toContain(uci);
    }
  });

  it('blocks protected Lion captures except adjacent captures and eligible tsukegui routes', () => {
    const protectedLion = position({ f4: 'w:lion', f6: 'b:lion', f7: 'b:pawn' });
    expect(uciFrom(protectedLion, 'f4')).not.toContain('f4f5f6');

    const adjacent = position({ f5: 'w:lion', f6: 'b:lion', f7: 'b:pawn' });
    expect(uciFrom(adjacent, 'f5')).toContain('f5f6');

    const tsukegui = position({ f4: 'w:lion', f5: 'b:gold-general', f6: 'b:lion', f7: 'b:pawn' });
    const move = movesFrom(tsukegui, 'f4').find((candidate) => candidate.uci === 'f4f5f6');
    expect(move?.captures.map(({ piece }) => piece.type)).toEqual(['gold-general', 'lion']);
  });

  it('keeps a sole Pawn foot effective for the complete Lion route', () => {
    const state = position({ g8: 'w:lion', f7: 'b:pawn', f6: 'b:lion' });
    expect(uciFrom(state, 'g8')).not.toContain('g8f7f6');
  });

  it('applies the protected first-Lion counterstrike for one reply', () => {
    const before = position({ a6: 'w:rook', f6: 'b:lion', f5: 'w:lion', f4: 'w:pawn', a5: 'b:rook' });
    const capture = generateMoves(before).find((move) => move.uci === 'a6f6')!;
    const after = applyMove(before, capture);
    expect(after.counterstrike).toEqual({ forbiddenColor: 'b', protectedLion: square('f5') });
    expect(generateMoves(after).map((move) => move.uci)).not.toContain('a5f5');

    const reply = generateMoves(after).find((move) => move.uci === 'a5a4')!;
    expect(applyMove(after, reply).counterstrike).toBeNull();
  });

  it('applies movement, capture, promotion state, and undo-ready immutable snapshots', () => {
    const state = position({ d8: 'w:pawn', d9: 'b:pawn' });
    const move = movesFrom(state, 'd8').find((candidate) => candidate.uci === 'd8d9+')!;
    const after = applyMove(state, move);
    expect(state.board[square('d8')]).toMatchObject({ type: 'pawn', promoted: false });
    expect(after.board[square('d8')]).toBeNull();
    expect(after.board[square('d9')]).toMatchObject({ color: 'w', type: 'pawn', promoted: true, promotionEligible: false });
    expect(after.turn).toBe('b');
    expect(after.ply).toBe(1);
    expect(after.board).toHaveLength(BOARD_SIZE);
    expect(after.board.filter(Boolean)).toHaveLength(1);
    expect(FILES).toBe(12);
    expect(RANKS).toBe(12);
  });
});
