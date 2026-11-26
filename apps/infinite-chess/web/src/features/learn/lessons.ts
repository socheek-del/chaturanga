import { Game } from '@chaturanga/infinite-chess';

export type TutorialMoveRule =
  | { kind: 'exact'; uci: string }
  | { kind: 'promotion'; from: string; to: string }
  | { kind: 'check-evasion' }
  | { kind: 'mate'; uci: string }
  | { kind: 'sequence'; ucis: readonly string[]; result: 'repetition' }
  | { kind: 'ending-move'; uci: string; result: 'fifty-move' | 'insufficient-material' }
  | { kind: 'quiz'; answer: 'draw' };

export interface TutorialLesson {
  id: string;
  title: string;
  description: string;
  prompt: string;
  fen: string;
  rule: TutorialMoveRule;
}

export const LESSONS: readonly TutorialLesson[] = [
  {
    id: 'coordinates', title: 'Coordinates and distance', description: 'Find any square with its exact integer pair.',
    prompt: 'Move the rook from (2,2) to (2,14). Enter the destination if it is beyond the view.',
    fen: 'K0,0|R2,2|k20,20 w - - 0 1', rule: { kind: 'exact', uci: '2,2>2,14' },
  },
  {
    id: 'promotion', title: 'Pawns reach a fixed rank', description: 'Promotion happens on rank 8 for White and rank 1 for Black.',
    prompt: 'Move the pawn from (3,7) to (3,8), then choose one of the four promotion pieces.',
    fen: 'K0,0|P3,7|k10,10 w - - 0 1', rule: { kind: 'promotion', from: '3,7', to: '3,8' },
  },
  {
    id: 'check', title: 'Answer a check', description: 'A king may not stay in check; block, capture the attacker, or move away.',
    prompt: 'The white king is checked by the rook. Move the king or block the rook’s line with the knight.',
    fen: 'K0,0|N2,2|r0,5|k10,10 w - - 0 1', rule: { kind: 'check-evasion' },
  },
  {
    id: 'mate', title: 'Win by checkmate', description: 'Checkmate leaves the other king in check with no legal reply.',
    prompt: 'Move the queen to (7,7). The king at (7,8) will have no legal escape.',
    fen: 'K0,0|Q1,7|B8,8|R6,10|R8,10|k7,8 w - - 0 1', rule: { kind: 'mate', uci: '1,7>7,7' },
  },
  {
    id: 'stalemate', title: 'Recognize stalemate', description: 'If the side to move has no legal move and is not checked, the game is drawn.',
    prompt: 'This position has no legal move for White. Choose its result.',
    fen: 'K0,0|r1,2|r2,1|r-1,2|r-2,1|r1,-2|r2,-1|r-1,-2|r-2,-1|k20,20 w - - 0 1',
    rule: { kind: 'quiz', answer: 'draw' },
  },
  {
    id: 'castling', title: 'Castle to safety', description: 'The king and rook move together when castling rights remain and the route is safe.',
    prompt: 'Castle kingside: move the king two squares toward the rook.',
    fen: 'K5,1|R8,1|k5,8 w K - 0 1', rule: { kind: 'exact', uci: '5,1>7,1' },
  },
  {
    id: 'en-passant', title: 'Capture en passant', description: 'A pawn can capture an adjacent pawn that just advanced two squares.',
    prompt: 'Capture the black pawn on its passed square.',
    fen: 'K0,0|P1,5|p2,5|k10,10 w - 2,6 0 2', rule: { kind: 'exact', uci: '1,5>2,6' },
  },
  {
    id: 'repetition', title: 'Draw by repetition', description: 'The same position, side to move, castling rights, and legal en-passant options three times is a draw.',
    prompt: 'Repeat this four-move king cycle twice. Play both colors in the practice.',
    fen: 'K0,0|k3,0|R100,100 w - - 0 1',
    rule: { kind: 'sequence', ucis: ['0,0>0,1', '3,0>3,1', '0,1>0,0', '3,1>3,0', '0,0>0,1', '3,0>3,1', '0,1>0,0', '3,1>3,0'], result: 'repetition' },
  },
  {
    id: 'fifty-move', title: 'The 50-move rule', description: 'A draw is available after 100 half-moves without a pawn move or capture.',
    prompt: 'Make one quiet rook move to reach the 100-half-move threshold.',
    fen: 'K0,0|R1,0|k10,10 w - - 99 1', rule: { kind: 'ending-move', uci: '1,0>2,0', result: 'fifty-move' },
  },
  {
    id: 'insufficient-material', title: 'Dead positions', description: 'The game is drawn when no possible sequence can produce checkmate.',
    prompt: 'Capture the last opposing minor piece. Neither side can mate afterward.',
    fen: 'K0,0|B1,1|n2,2|k10,9 w - - 0 1', rule: { kind: 'ending-move', uci: '1,1>2,2', result: 'insufficient-material' },
  },
];

export function acceptsTutorialMove(rule: TutorialMoveRule, uci: string, game: Game, sequenceIndex = 0): boolean {
  const [fromTo, promotion = ''] = [uci.replace(/[qrbn]$/, ''), uci.match(/[qrbn]$/)?.[0] ?? ''];
  const [from, to] = fromTo!.split('>');
  switch (rule.kind) {
    case 'exact': return uci === rule.uci;
    case 'promotion': return from === rule.from && to === rule.to && ['q', 'r', 'b', 'n'].includes(promotion);
    case 'check-evasion': return game.inCheck() && game.legalUciIn([to!]).includes(uci);
    case 'mate': return uci === rule.uci;
    case 'sequence': return uci === rule.ucis[sequenceIndex];
    case 'ending-move': return uci === rule.uci;
    case 'quiz': return false;
  }
}

export function validateLessons(): void {
  for (const lesson of LESSONS) {
    const game = new Game(lesson.fen);
    if (lesson.rule.kind === 'exact' || lesson.rule.kind === 'mate' || lesson.rule.kind === 'ending-move') {
      if (!game.legalUciIn([lesson.rule.uci.split('>')[1]!.replace(/[qrbn]$/, '')]).includes(lesson.rule.uci)) {
        throw new Error(`Tutorial move is illegal in ${lesson.id}`);
      }
      if (lesson.rule.kind === 'ending-move') {
        game.move(lesson.rule.uci);
        if (game.status().kind !== lesson.rule.result) throw new Error(`Tutorial move does not produce ${lesson.rule.result} in ${lesson.id}`);
      }
    }
    if (lesson.rule.kind === 'promotion') {
      if (!game.legalUciIn([lesson.rule.to]).some((uci) => acceptsTutorialMove(lesson.rule, uci, game))) {
        throw new Error(`Tutorial promotion is illegal in ${lesson.id}`);
      }
    }
    if (lesson.rule.kind === 'check-evasion') {
      if (!game.inCheck() || !game.legalUciIn(['1,0', '-1,0', '0,1', '0,-1', '1,1', '1,-1', '-1,1', '-1,-1', '0,3'])
        .some((uci) => acceptsTutorialMove(lesson.rule, uci, game))) throw new Error('Tutorial check has no legal evasion');
    }
    if (lesson.rule.kind === 'sequence') {
      for (const uci of lesson.rule.ucis) {
        const target = uci.split('>')[1]!.replace(/[qrbn]$/, '');
        if (!game.legalUciIn([target]).includes(uci)) throw new Error(`Tutorial sequence has an illegal move in ${lesson.id}: ${uci}`);
        game.move(uci);
      }
      if (game.status().kind !== lesson.rule.result) throw new Error(`Tutorial sequence does not produce ${lesson.rule.result} in ${lesson.id}`);
    }
    if (lesson.rule.kind === 'quiz' && game.status().kind !== 'stalemate') throw new Error('Tutorial ending is not stalemate');
  }
}
