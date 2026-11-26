import { Game, TRAPS, type PieceType } from '@chaturanga/arimaa';
import { squareName, type Color, type Piece, type Square } from '@chaturanga/rules-core';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

const ICONS: Readonly<Record<PieceType, string>> = {
  e: 'M8 31 15 9h18l7 22-16 12z',
  m: 'M32 6 47 24 32 42 17 24z',
  h: 'M13 39V24c0-10 7-17 18-17h6v10h-5c-5 0-8 3-8 8v14z',
  d: 'M11 12h30v10H21v10h20v10H11z',
  c: 'M18 8h18l12 16-12 18H18L6 24z',
  r: 'M8 33 32 9l24 24H42L32 23 22 33z',
};

export function PieceMark({ piece, compact = false }: { piece: Piece<PieceType, Color>; compact?: boolean }) {
  return <span className={`piece-mark ${piece.color === 'w' ? 'is-gold' : 'is-silver'}${compact ? ' is-compact' : ''}`} aria-hidden="true">
    <svg viewBox="0 0 64 50" focusable="false"><path d={ICONS[piece.type]} /></svg>
    <b>{piece.type.toUpperCase()}</b>
  </span>;
}

function adjacent(left: Square, right: Square): boolean {
  return Math.abs((left % 8) - (right % 8)) + Math.abs(Math.floor(left / 8) - Math.floor(right / 8)) === 1;
}

function stepPairs(actions: readonly string[]): Array<{ square: number; index: number }> {
  const marks: Array<{ square: number; index: number }> = [];
  let index = 1;
  for (const action of actions) {
    const coordinates = action.match(/[a-h][1-8]/g) ?? [];
    for (let offset = 0; offset + 1 < coordinates.length; offset += 2) {
      const from = coordinates[offset]!;
      const to = coordinates[offset + 1]!;
      marks.push({ square: (Number(from[1]) - 1) * 8 + from.charCodeAt(0) - 97, index });
      marks.push({ square: (Number(to[1]) - 1) * 8 + to.charCodeAt(0) - 97, index });
      index++;
    }
  }
  return marks;
}

export interface ArimaaBoardProps {
  game: Game;
  orientation: Color;
  selected?: Square | null;
  destinations?: readonly Square[];
  draftActions?: readonly string[];
  disabled?: boolean;
  onSquare?: (square: Square) => void;
}

export function ArimaaBoard({
  game,
  orientation,
  selected = null,
  destinations = [],
  draftActions = [],
  disabled = false,
  onSquare,
}: ArimaaBoardProps) {
  const { t } = useTranslation();
  // Game instances are mutable. Online sessions bump their version while retaining this same object, so
  // derive the 64-square lookup on every render instead of hiding an optimistic move behind object memoization.
  const pieces = new Map(game.pieces().map(({ square, piece }) => [square, piece]));
  const route = useMemo(() => stepPairs(draftActions), [draftActions]);
  const routeMarks = new Map(route.map(({ square, index }) => [square, index]));
  const ranks = orientation === 'w' ? [...Array(8).keys()].reverse() : [...Array(8).keys()];
  const files = orientation === 'w' ? [...Array(8).keys()] : [...Array(8).keys()].reverse();
  const destinationSet = new Set(destinations);

  return <div className="board-frame">
    <div className="board-grid" role="group" aria-label={t('board.label')}>
      {ranks.map((rank) => <div className="board-row" key={rank}>
        {files.map((file) => {
          const square = rank * 8 + file;
          const name = squareName(square);
          const piece = pieces.get(square) ?? null;
          const trap = TRAPS.includes(square);
          const supported = piece !== null && game.pieces().some(({ square: neighbor, piece: friendly }) => friendly.color === piece.color && adjacent(square, neighbor));
          const routeIndex = routeMarks.get(square);
          const trapDescription = trap ? t(supported ? 'board.supported' : 'board.unsupported') : '';
          const pieceDescription = piece ? `${t(`colors.${piece.color}`)} ${t(`pieces.${piece.type}`)}` : t('board.empty');
          const ariaLabel = t('board.square', { square: name, piece: pieceDescription, trap: trap ? `${t('board.trap')}${trapDescription}` : '' });
          const tone = (file + rank) % 2 === 0 ? 'light' : 'dark';
          const selectedClass = selected === square ? ' is-selected' : '';
          const destinationClass = destinationSet.has(square) ? ' is-destination' : '';
          return <button
            className={`board-square tone-${tone}${trap ? ' is-trap' : ''}${selectedClass}${destinationClass}`}
            type="button"
            key={square}
            aria-label={ariaLabel}
            aria-pressed={selected === square}
            disabled={disabled}
            onClick={() => onSquare?.(square)}
          >
            {trap && <span className={`trap-well${supported ? ' has-support' : ''}`} aria-hidden="true" />}
            {piece && <PieceMark piece={piece} />}
            {routeIndex !== undefined && <span className="route-marker" aria-label={t('board.routeStep', { step: routeIndex })}>{routeIndex}</span>}
            {file === (orientation === 'w' ? 0 : 7) && <span className="rank-coordinate" aria-hidden="true">{rank + 1}</span>}
            {rank === (orientation === 'w' ? 0 : 7) && <span className="file-coordinate" aria-hidden="true">{String.fromCharCode(97 + file)}</span>}
          </button>;
        })}
      </div>)}
    </div>
  </div>;
}
