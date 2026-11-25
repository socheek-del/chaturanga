import type { BoardTheme } from '@chaturanga/board-ui';
import { type Piece, type Square } from '@chaturanga/rules-core';
import { PYRAMID_COMPONENTS } from '@chaturanga/rithmomachia';
import { useTranslation } from 'react-i18next';
import { PieceArt, pieceInfo } from './components/PieceArt';

export const RITHMOMACHIA_BOARD_THEME: BoardTheme = {
  board: 'var(--board-light)',
  boardAlternate: 'var(--board-dark)',
  line: 'var(--board-frame)',
  coordinate: 'var(--board-coordinate)',
  selected: '#c9953d',
  lastMove: 'rgba(201, 149, 61, 0.28)',
  check: '#a33f38',
  hint: '#9a5d19',
};

export function renderPiece(piece: Piece, className: string) {
  return <PieceArt piece={piece} className={className} />;
}

export function promotionName(type: string, color: 'w' | 'b', t: ReturnType<typeof useTranslation>['t']): string {
  if (type === 'z') return t('capture.siegeAll');
  const index = type.charCodeAt(0) - 97;
  const component = PYRAMID_COMPONENTS[index];
  return component
    ? t('capture.takeComponent', { shape: t(`shapes.${component.shape}`), value: component.value })
    : t('capture.unknownComponent', { color: t(`colors.${color}`) });
}

function pieceName(piece: Piece | null, t: ReturnType<typeof useTranslation>['t']): string {
  if (!piece) return t('pieces.empty');
  const info = pieceInfo(piece.type, piece.color);
  return info.special === 'siege'
    ? t('capture.siegeAll')
    : `${t(`colors.${piece.color}`)} ${t(`shapes.${info.shape}`)} ${info.value}`;
}

export function useBoardIdentity() {
  const { t } = useTranslation();
  return {
    theme: RITHMOMACHIA_BOARD_THEME,
    showCoordinates: true,
    renderPiece,
    boardLabel: t('board.label'),
    describeSquare: (squareName: string, piece: Piece | null) =>
      t('board.square', { square: squareName, piece: pieceName(piece, t) }),
  };
}

/** Stable rank-16-to-rank-1 square order for the small opening diagram. */
export const DISPLAY_SQUARES: readonly Square[] = Object.freeze(
  Array.from({ length: 128 }, (_, index) => (15 - Math.floor(index / 8)) * 8 + (index % 8)),
);
