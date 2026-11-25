import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  hasWallBetween,
  isPlayable,
  parseSquare,
  squareName,
  type Game,
  type PieceType,
  type Seat,
} from '@chaturanga/fortress';

export interface ParsedMove {
  uci: string;
  from: number | null;
  to: number;
  promotion?: Exclude<PieceType, 'p' | 'k'>;
  placement?: Extract<PieceType, 'b' | 'n' | 'r'>;
}

const files = 'abcdefghijklmnop';
const glyphs: Record<Seat, Record<PieceType, string>> = {
  r: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' },
  b: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' },
  w: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' },
  k: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' },
};

export function parseUci(uci: string): ParsedMove | null {
  const placement = /^([NBR])@([a-p](?:1[0-6]|[1-9]))$/.exec(uci);
  if (placement) {
    const to = parseSquare(placement[2]!);
    return to === null
      ? null
      : { uci, from: null, to, placement: placement[1]!.toLowerCase() as ParsedMove['placement'] };
  }
  const match = /^([a-p](?:1[0-6]|[1-9]))([a-p](?:1[0-6]|[1-9]))([qrbn])?$/.exec(uci);
  if (!match) return null;
  const from = parseSquare(match[1]!);
  const to = parseSquare(match[2]!);
  if (from === null || to === null) return null;
  return { uci, from, to, ...(match[3] ? { promotion: match[3] as ParsedMove['promotion'] } : {}) };
}

function describePiece(game: Game, square: number, t: (key: string) => string): string {
  const piece = game.pieceAt(square);
  return piece ? `, ${t(`players.${piece.color}`)} ${t(`pieces.${piece.type}`)}` : '';
}

function wallClasses(square: number): string {
  const file = square % 16;
  const rank = Math.floor(square / 16);
  const edges = [
    file > 0 && hasWallBetween(square, square - 1) ? 'wall-left' : '',
    file < 15 && hasWallBetween(square, square + 1) ? 'wall-right' : '',
    rank > 0 && hasWallBetween(square, square - 16) ? 'wall-bottom' : '',
    rank < 15 && hasWallBetween(square, square + 16) ? 'wall-top' : '',
  ];
  return edges.filter(Boolean).join(' ');
}

export function Board({
  game,
  selected = null,
  destinations = [],
  lastMove = null,
  lessonMove = null,
  onSquareClick,
  children,
}: {
  game: Game;
  selected?: number | null;
  destinations?: readonly ParsedMove[];
  lastMove?: ParsedMove | null;
  lessonMove?: ParsedMove | null;
  onSquareClick?: (square: number) => void;
  children?: ReactNode;
}) {
  const { t } = useTranslation();
  const bySquare = new Map<number, ParsedMove[]>();
  for (const move of destinations) bySquare.set(move.to, [...(bySquare.get(move.to) ?? []), move]);

  return (
    <div className="board-frame" data-testid="board-frame">
      <div className="board-grid" role="grid" aria-label={t('game.boardLabel')}>
        {Array.from({ length: 256 }, (_, square) => {
          if (!isPlayable(square)) return <span className="board-void" key={square} aria-hidden="true" />;
          const name = squareName(square);
          const piece = game.pieceAt(square);
          const targetMoves = bySquare.get(square) ?? [];
          const capture = targetMoves.length > 0 && !!piece;
          const isLast = square === lastMove?.from || square === lastMove?.to;
          const isLesson = square === lessonMove?.from || square === lessonMove?.to;
          const shade = ((square % 16) + Math.floor(square / 16)) % 2 === 0 ? 'light' : 'dark';
          return (
            <button
              key={square}
              type="button"
              role="gridcell"
              disabled={!onSquareClick}
              data-testid={`square-${name}`}
              data-legal={targetMoves.length > 0 || undefined}
              aria-label={`${name}${describePiece(game, square, t)}`}
              aria-pressed={selected === square}
              onClick={() => onSquareClick?.(square)}
              className={`board-cell cell-${shade} ${selected === square ? 'is-selected' : ''} ${targetMoves.length ? 'is-target' : ''} ${capture ? 'is-capture' : ''} ${isLast ? 'is-last' : ''} ${isLesson ? 'is-lesson' : ''} ${wallClasses(square)}`}
            >
              <span className="cell-coordinate" aria-hidden="true">
                {name}
              </span>
              {piece && (
                <span className={`piece piece-${piece.color}`} aria-hidden="true">
                  {glyphs[piece.color][piece.type]}
                </span>
              )}
              {!piece && targetMoves.length > 0 && <span className="move-dot" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
      {children}
    </div>
  );
}

export function PromotionPicker({
  player,
  moves,
  onMove,
  onCancel,
}: {
  player: Seat;
  moves: readonly ParsedMove[];
  onMove: (move: ParsedMove) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="promotion-panel" role="dialog" aria-label={t('game.promotion')}>
      <p>{t('game.promotion')}</p>
      {moves.map((move) => (
        <button
          key={move.uci}
          type="button"
          onClick={() => onMove(move)}
          aria-label={t('game.promoteTo', { piece: t(`pieces.${move.promotion}`) })}
        >
          <span className={`piece piece-${player}`} aria-hidden="true">
            {glyphs[player][move.promotion!]}
          </span>
        </button>
      ))}
      <button type="button" className="text-action" onClick={onCancel}>
        {t('game.cancel')}
      </button>
    </div>
  );
}

export const fileName = (square: number): string => files[square % 16]!;
