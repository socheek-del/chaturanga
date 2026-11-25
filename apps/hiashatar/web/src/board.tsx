import type { Color, Square } from '@chaturanga/rules-core';
import type { BoardTheme } from '@chaturanga/board-ui';
import type { Piece } from '@chaturanga/rules-core';
import { useTranslation } from 'react-i18next';

export const boardTheme: BoardTheme = {
  board: 'transparent', line: '#756b58', coordinate: '#263840', selected: '#e8a74b',
  lastMove: '#dfa34e66', check: '#b83e31', hint: '#1b8279ad',
};

export function renderPiece(piece: Piece, className: string) {
  return <span aria-hidden className={`piece ${className}`} data-side={piece.color} data-kind={piece.type}><i /></span>;
}

export function Chequer() {
  return <div aria-hidden className="chequer" />;
}

export function AuraGrid({ zones, orientation }: { zones: Record<Color, readonly Square[]>; orientation: Color }) {
  const white = new Set(zones.w);
  const black = new Set(zones.b);
  return <div className="aura-grid" style={{ gridTemplateColumns: 'repeat(10, minmax(0, 1fr))' }}>
    {Array.from({ length: 100 }, (_, index) => {
      const row = Math.floor(index / 10);
      const col = index % 10;
      const rank = orientation === 'w' ? 9 - row : row;
      const file = orientation === 'w' ? col : 9 - col;
      const square = rank * 10 + file;
      const side = white.has(square) && black.has(square) ? 'both' : white.has(square) ? 'w' : black.has(square) ? 'b' : undefined;
      return <span key={square} data-aura={side} />;
    })}
  </div>;
}

export function useBoardIdentity() {
  const { t } = useTranslation();
  return {
    theme: boardTheme,
    showCoordinates: true,
    renderPiece,
    boardLabel: t('board.label'),
    describeSquare: (square: string, piece: Piece | null) => piece
      ? t('board.squareWithPiece', {
          square, piece: t('board.pieceName', { color: t(`colors.${piece.color}`), piece: t(`pieces.${piece.type}`) }),
        })
      : t('board.emptySquare', { square }),
    boardUnderlay: <Chequer />,
  };
}
