import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { hexAt, RADIUS, SIZE, parseSquare, squareName, type Game, type Player, type PieceType } from '@chaturanga/threechess';

export type ParsedMove = { uci: string; from: number; to: number; promotion?: Exclude<PieceType, 'p' | 'k'> };
const FILES = 'abcdefghijk';
export const GLYPHS: Record<Player, Record<PieceType, string>> = {
  w: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' },
  b: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' },
  r: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' },
};

export function parseUci(uci: string): ParsedMove | null {
  const match = /^([a-k](?:1[01]|[1-9]))([a-k](?:1[01]|[1-9]))([qrbn])?$/.exec(uci);
  if (!match) return null;
  const from = parseSquare(match[1]!);
  const to = parseSquare(match[2]!);
  if (from === null || to === null) return null;
  return { uci, from, to, ...(match[3] ? { promotion: match[3] as ParsedMove['promotion'] } : {}) };
}

function getPieceLabel(piece: ReturnType<Game['pieceAt']>, t: (key: string, options?: Record<string, string>) => string) {
  if (!piece) return '';
  return ` · ${t('pieces.withOwner', { player: t(`players.${piece.color}`), piece: t(`pieces.${piece.type}`) })}`;
}

export function HexBoard({
  game, selected = null, destinations = [], lastMove, onSquareClick, children,
}: {
  game: Game;
  selected?: number | null;
  destinations?: readonly ParsedMove[];
  lastMove?: ParsedMove | null;
  onSquareClick?: (square: number) => void;
  children?: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <div className="board-frame">
      <div className="board-grid" role="grid" aria-label={t('game.turn', { player: t(`players.${game.turn}`) })}>
        {Array.from({ length: SIZE }, (_, rank) => rank).map((rank) => (
          <div className="board-row" role="row" key={rank} aria-label={t('game.boardLabel', { rank: rank + 1 })}>
            {Array.from({ length: SIZE }, (_, file) => {
              const q = file - RADIUS;
              const r = rank - RADIUS;
              const square = hexAt(q, r);
              if (square === null) return null;
              const shade = ((q - r) % 3 + 3) % 3;
              const piece = game.pieceAt(square);
              const destinationMoves = destinations.filter((move) => move.to === square);
              const capture = destinationMoves.length > 0 && !!piece;
              const isLast = square === lastMove?.from || square === lastMove?.to;
              const ariaPiece = getPieceLabel(piece, t);
              return (
                <button
                  type="button"
                  disabled={!onSquareClick}
                  role="gridcell"
                  key={square}
                  data-testid={`cell-${squareName(square)}`}
                  data-legal={destinationMoves.length > 0 || undefined}
                  aria-label={t('game.squareLabel', { file: FILES[file], rank: rank + 1, piece: ariaPiece })}
                  aria-pressed={selected === square}
                  onClick={() => onSquareClick?.(square)}
                  style={{ left: `${50 + (q + r / 2) * 100 / SIZE}%`, top: `${50 + r * 75 / 8.5}%` }}
                  className={`square hex-shade-${shade} ${selected === square ? 'is-selected' : ''} ${destinationMoves.length ? 'is-destination' : ''} ${capture ? 'is-capture' : ''} ${isLast ? 'is-last-move' : ''}`}
                >
                  {piece && <span className={`piece seat-token piece-${piece.color}`} aria-hidden="true">{GLYPHS[piece.color][piece.type]}</span>}
                  {!piece && destinationMoves.length > 0 && <span className="move-dot" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      {children}
    </div>
  );
}

export function PromotionPicker({ player, moves, onMove, onCancel }: {
  player: Player;
  moves: readonly ParsedMove[];
  onMove: (move: ParsedMove) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  return <div className="promotion-popover" role="dialog" aria-label={t('game.promotion')}>
    <p>{t('game.promotion')}</p>
    <div className="promotion-options">
      {moves.map((move) => <button
        key={move.uci} type="button" className="promotion-piece" onClick={() => onMove(move)}
        aria-label={t('game.promoteTo', { piece: t(`pieces.${move.promotion}`) })}>
        <span className={`seat-token piece-${player}`} aria-hidden>{GLYPHS[player][move.promotion!]}</span>
      </button>)}
    </div>
    <button type="button" className="promotion-cancel" onClick={onCancel}>{t('game.cancel')}</button>
  </div>;
}
