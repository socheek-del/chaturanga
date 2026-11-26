import { describeVariantConformance } from '@chaturanga/rules-core/testing';
import { describe, expect, it } from 'vitest';
import { BOARD_SIZE, FILES, PIECE_TYPES, RANKS, STARTING_PIECES, Game, attackedSquares, destinationOfMove, fenOf, koShogi, makePiece, squareOf, startingPosition, type Position } from './index';

function emptyPosition(turn: 'w' | 'b' = 'w'): Position {
  const position: Position = {
    board: Array.from({ length: BOARD_SIZE }, () => null),
    turn,
    priestLost: { w: false, b: false },
  };
  position.board[squareOf('a1')!] = makePiece('w', 'general');
  position.board[squareOf('s19')!] = makePiece('b', 'general');
  return position;
}

describeVariantConformance(koShogi, {
  fens: [fenOf({ ...startingPosition(), turn: 'w' }), fenOf({ ...emptyPosition(), priestLost: { w: true, b: false } })],
  invalidFens: ['', `${koShogi.startFen} trailing`, koShogi.startFen.replace(' b ', ' x '), koShogi.startFen.replace('ks1', 'ks2')],
  illegalMoves: ['a1-a3', 'a1-a1', '???', 'P@a2'],
  sampleLegalMove: (game, random) => {
    const moves = game.legalUci();
    return moves.length ? moves[Math.floor(random() * moves.length)]! : null;
  },
  destinationOfMove,
}, { seededGamesMs: 120_000, attackedSquaresMs: 120_000 });

describe('Ko Shogi position and reconstructed rules', () => {
  it('builds the documented 19×19, 90-piece setup with Black first', () => {
    const game = new Game();
    expect([FILES, RANKS]).toEqual([19, 19]);
    expect(STARTING_PIECES).toHaveLength(90);
    expect(game.pieces()).toHaveLength(180);
    expect(game.turn).toBe('b');
    expect(new Game(game.fen()).fen()).toBe(game.fen());
    expect(game.pieces().filter(({ piece }) => piece.color === 'w')).toHaveLength(90);
    expect(game.pieces().filter(({ piece }) => piece.color === 'b')).toHaveLength(90);
  });

  it.each(PIECE_TYPES)('has a defined movement profile for %s', (type) => {
    const position = emptyPosition();
    position.board[squareOf('j10')!] = makePiece('w', type, !['general', 'clerk', 'staff-officer', 'aide-de-camp', 'sumo', 'aide', 'staff', 'chief-of-staff', 'engineer', 'taoist-priest', 'spiritual-monk', 'advance-guard', 'middle-troop', 'drum', 'banner', 'sentry', 'millenary', 'quartermaster', 'centuria', 'rear-guard', 'frankish-cannon', 'elephant', 'longbow', 'crossbow', 'cannon', 'cavalryman', 'cavalry', 'pawn', 'patrol-unit', 'shield', 'shield-unit', 'chariot', 'chariot-unit', 'vanguard'].includes(type));
    expect(new Game(fenOf(position)).legalUci().some((uci) => uci.startsWith('j10-'))).toBe(true);
  });

  it('records a move, flips the turn, replays its FEN, and undoes cleanly', () => {
    const position = emptyPosition();
    position.board[squareOf('e5')!] = makePiece('w', 'elephant');
    const game = new Game(fenOf(position));
    const record = game.move('e5-f6');
    expect(record).toMatchObject({ uci: 'e5-f6', color: 'w', to: squareOf('f6'), captured: null });
    expect(game.turn).toBe('b');
    expect(game.pieceAt(squareOf('f6')!)).toMatchObject({ type: 'elephant', color: 'w' });
    expect(new Game(game.fen()).fen()).toBe(game.fen());
    expect(game.undo()).toBe(record);
    expect(game.fen()).toBe(fenOf(position));
  });

  it('makes a Longbow move before an optional shot and records the target capture', () => {
    const position = emptyPosition();
    position.board[squareOf('e5')!] = makePiece('w', 'longbow');
    position.board[squareOf('h8')!] = makePiece('b', 'pawn');
    const game = new Game(fenOf(position));
    expect(game.legalUci()).toContain('e5-f6@h8');
    const record = game.move('e5-f6@h8');
    expect(record.captured).toMatchObject({ type: 'pawn', color: 'b' });
    expect(game.pieceAt(squareOf('h8')!)).toBeNull();
  });

  it('enforces shooter immunities and lets a Cannon shot pass ordinary blockers', () => {
    const bow = emptyPosition();
    bow.board[squareOf('e5')!] = makePiece('w', 'longbow');
    bow.board[squareOf('h8')!] = makePiece('b', 'shield');
    expect(new Game(fenOf(bow)).legalUci()).not.toContain('e5-f6@h8');

    const cannon = emptyPosition();
    cannon.board[squareOf('e5')!] = makePiece('w', 'cannon');
    cannon.board[squareOf('g7')!] = makePiece('w', 'pawn');
    cannon.board[squareOf('h8')!] = makePiece('b', 'pawn');
    expect(new Game(fenOf(cannon)).legalUci()).toContain('e5-f6@h8');

    cannon.board[squareOf('g7')!] = makePiece('w', 'shield-unit');
    expect(new Game(fenOf(cannon)).legalUci()).not.toContain('e5-f6@h8');
  });

  it('applies capture merit promotion immediately', () => {
    const position = emptyPosition();
    position.board[squareOf('e5')!] = makePiece('w', 'clerk');
    position.board[squareOf('g5')!] = makePiece('b', 'middle-troop');
    const game = new Game(fenOf(position));
    game.move('e5-g5');
    expect(game.pieceAt(squareOf('g5')!)).toMatchObject({ type: 'master-at-arms', promoted: true });
  });

  it('allows compound routes for Master-at-Arms, Cavalry, and Thunderclap', () => {
    const position = emptyPosition();
    position.board[squareOf('e5')!] = makePiece('w', 'master-at-arms', true);
    position.board[squareOf('j10')!] = makePiece('w', 'cavalry');
    position.board[squareOf('j14')!] = makePiece('w', 'thunderclap', true);
    const game = new Game(fenOf(position));
    const legal = game.legalUci();
    expect(legal).toContain('e5-f6-g7');
    expect(legal).toContain('j10-l11-n12');
    expect(legal).toContain('j10-l11-j10');
    expect(legal).not.toContain('j10-l11-m13');
    expect(legal).toContain('j14-k14-l14-l15-l14-k14');
    expect(legal).not.toContain('j14-k14-l14-l15-l16-m16');
  });

  it('offers camp promotion and applies the Master-at-Arms side effects', () => {
    const inCamp = emptyPosition();
    inCamp.board[squareOf('m13')!] = makePiece('w', 'aide');
    const campGame = new Game(fenOf(inCamp));
    expect(campGame.legalUci()).toContain('m13-m14=town-brigade');
    campGame.move('m13-m14=town-brigade');
    expect(campGame.pieceAt(squareOf('m14')!)).toMatchObject({ type: 'town-brigade', promoted: true });

    const clerkCapture = emptyPosition();
    clerkCapture.board[squareOf('e5')!] = makePiece('w', 'clerk');
    clerkCapture.board[squareOf('g5')!] = makePiece('b', 'middle-troop');
    clerkCapture.board[squareOf('c3')!] = makePiece('w', 'advance-guard');
    clerkCapture.board[squareOf('q17')!] = makePiece('b', 'poison-flame', true);
    const effectsGame = new Game(fenOf(clerkCapture));
    effectsGame.move('e5-g5');
    expect(effectsGame.pieceAt(squareOf('c3')!)).toMatchObject({ type: 'skyward-net', promoted: true });
    expect(effectsGame.pieceAt(squareOf('q17')!)).toBeNull();
  });

  it('burns every adjacent piece when a Poison Flame arrives', () => {
    const position = emptyPosition();
    position.board[squareOf('e5')!] = makePiece('w', 'poison-flame', true);
    position.board[squareOf('f6')!] = makePiece('b', 'pawn');
    position.board[squareOf('e7')!] = makePiece('w', 'pawn');
    const game = new Game(fenOf(position));
    game.move('e5-e6');
    expect(game.pieceAt(squareOf('e6')!)).toMatchObject({ type: 'poison-flame' });
    expect(game.pieceAt(squareOf('f6')!)).toBeNull();
    expect(game.pieceAt(squareOf('e7')!)).toBeNull();
  });

  it('suppresses enemy ranged shots inside the selected five-intersection area', () => {
    const position = emptyPosition();
    position.board[squareOf('e5')!] = makePiece('w', 'longbow');
    position.board[squareOf('h8')!] = makePiece('b', 'pawn');
    position.board[squareOf('d4')!] = makePiece('b', 'five-li-fog', true);
    const game = new Game(fenOf(position));
    expect(game.legalUci()).not.toContain('e5-f6@h8');
  });

  it('reverts Banner/Drum promotions when either priest-family piece is captured', () => {
    const position = emptyPosition();
    position.board[squareOf('e4')!] = makePiece('w', 'chariot-unit', true);
    position.board[squareOf('e5')!] = makePiece('b', 'taoist-priest');
    position.board[squareOf('h10')!] = makePiece('b', 'flag-waver', true);
    position.board[squareOf('h12')!] = makePiece('b', 'thunderclap', true);
    const game = new Game(fenOf(position));
    game.move('e4-e5');
    expect(game.pieceAt(squareOf('h10')!)).toMatchObject({ type: 'banner', promoted: false });
    expect(game.pieceAt(squareOf('h12')!)).toMatchObject({ type: 'drum', promoted: false });
    expect(new Game(game.fen()).fen()).toBe(game.fen());
  });

  it('reverts a Five-li Fog inside five intersections of an Immaculate Light', () => {
    const position = emptyPosition();
    position.board[squareOf('c2')!] = makePiece('w', 'immaculate-light', true);
    position.board[squareOf('j9')!] = makePiece('b', 'five-li-fog', true);
    const game = new Game(fenOf(position));
    game.move('c2-e4');
    expect(game.pieceAt(squareOf('j9')!)).toMatchObject({ type: 'taoist-priest', promoted: false });
  });

  it('immobilizes enemies on clear Net rays but permits a move after a blocker interrupts the ray', () => {
    const position = emptyPosition();
    position.board[squareOf('e5')!] = makePiece('b', 'earthward-net', true);
    position.board[squareOf('h8')!] = makePiece('w', 'pawn');
    let game = new Game(fenOf(position));
    expect(game.legalUci().some((uci) => uci.startsWith('h8-'))).toBe(false);

    position.board[squareOf('g7')!] = makePiece('b', 'pawn');
    game = new Game(fenOf(position));
    expect(game.legalUci().some((uci) => uci.startsWith('h8-'))).toBe(true);
  });

  it('wins by removing the opponent’s last command condition and loses on no legal move', () => {
    const position = emptyPosition();
    position.board[squareOf('a2')!] = makePiece('w', 'chariot-unit', true);
    position.board[squareOf('a4')!] = makePiece('b', 'general');
    position.board[squareOf('s19')!] = null;
    const game = new Game(fenOf(position));
    game.move('a2-a4');
    expect(game.status()).toEqual({ kind: 'progression', winner: 'w' });

    const immobilized = emptyPosition('b');
    immobilized.board[squareOf('s19')!] = null;
    immobilized.board[squareOf('h8')!] = makePiece('b', 'general');
    immobilized.board[squareOf('e5')!] = makePiece('w', 'skyward-net', true);
    const blocked = new Game(fenOf(immobilized));
    expect(blocked.legalUci()).toEqual([]);
    expect(blocked.status()).toEqual({ kind: 'stalemate', winner: 'w' });
  });

  it('draws the fourth complete-position repetition and restores it on undo', () => {
    const position = emptyPosition();
    position.board[squareOf('s19')!] = null;
    position.board[squareOf('r19')!] = makePiece('b', 'general');
    const game = new Game(fenOf(position));
    for (let cycle = 0; cycle < 3; cycle++) {
      game.move('a1-b1');
      game.move('r19-s19');
      game.move('b1-a1');
      game.move('s19-r19');
    }
    expect(game.status()).toEqual({ kind: 'repetition' });
    expect(game.undo()).not.toBeNull();
    expect(game.status()).toEqual({ kind: 'ongoing' });
  });

  it('assigns a fourth-position perpetual attack on a sole objective to the repeating side as a loss', () => {
    const position = emptyPosition();
    position.board[squareOf('e5')!] = makePiece('w', 'drum');
    position.board[squareOf('h5')!] = makePiece('w', 'pawn');
    position.board[squareOf('b2')!] = makePiece('b', 'elephant');
    const game = new Game(fenOf(position));
    for (let cycle = 0; cycle < 3; cycle++) {
      game.move('h5-h6');
      game.move('b2-c3');
      game.move('h6-h5');
      game.move('c3-b2');
    }
    expect(game.status()).toEqual({ kind: 'perpetual-check', winner: 'w' });
  });

  it('removes only a Pawn’s forward step when its side has no Drum role', () => {
    const position = emptyPosition();
    position.board[squareOf('h5')!] = makePiece('w', 'pawn');
    const withoutDrum = new Game(fenOf(position)).legalUci();
    expect(withoutDrum).not.toContain('h5-h6');
    expect(withoutDrum).toContain('h5-h4');
    expect(withoutDrum).toContain('h5-i5');

    position.board[squareOf('e5')!] = makePiece('w', 'banner-and-drum', true);
    expect(new Game(fenOf(position)).legalUci()).toContain('h5-h6');
  });

  it('reports unique, sorted attacks within the 19×19 board', () => {
    const game = new Game();
    const attacks = attackedSquares(startingPosition().board, 'w');
    expect(attacks).toEqual([...new Set(attacks)].sort((a, b) => a - b));
    expect(attacks.every((square) => square >= 0 && square < BOARD_SIZE)).toBe(true);
    expect(game.attackedSquares('w')).toEqual(attacks);
  });
});
