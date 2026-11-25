import type { BoardTheme } from '@chaturanga/board-ui';
import { type Piece, type Square } from '@chaturanga/rules-core';
import { useTranslation } from 'react-i18next';
import { PieceArt } from './components/PieceArt';

export const DAMEO_BOARD_THEME: BoardTheme = {
  board: 'transparent',
  line: '#8F9B89',
  coordinate: '#566468',
  selected: '#D26D48',
  lastMove: 'rgba(192, 108, 66, 0.34)',
  check: '#9E3B35',
  hint: '#668574',
};

export function renderPiece(piece: Piece, className: string) {
  return <PieceArt piece={piece} className={className} />;
}

function pieceName(piece: Piece | null, t: ReturnType<typeof useTranslation>['t']): string {
  if (!piece) return t('pieces.empty');
  return `${t(`colors.${piece.color}`)} ${t(`pieces.${piece.type}`)}`;
}

export function useBoardIdentity() {
  const { t } = useTranslation();
  return {
    theme: DAMEO_BOARD_THEME,
    showCoordinates: true,
    renderPiece,
    boardLabel: t('board.label'),
    describeSquare: (squareName: string, piece: Piece | null) =>
      t('board.square', { square: squareName, piece: pieceName(piece, t) }),
  };
}

/** Stable square iteration for home-board vignettes. */
export const DISPLAY_SQUARES: readonly Square[] = Object.freeze(
  Array.from({ length: 64 }, (_, index) => (7 - Math.floor(index / 8)) * 8 + (index % 8)),
);
