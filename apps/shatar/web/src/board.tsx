import type { BoardTheme } from '@chaturanga/board-ui';
import type { Piece } from '@chaturanga/rules-core';
import { useTranslation } from 'react-i18next';

export const boardTheme: BoardTheme = {
  board: 'transparent', line: '#53728e', coordinate: '#192c42', selected: '#fbc772',
  lastMove: '#ffdc907f', check: '#a52642', hint: '#245478ad',
};

export function renderPiece(piece: Piece, className: string) {
  return <span aria-hidden className={`piece ${className}`} data-side={piece.color} data-kind={piece.type}><i /></span>;
}

export function Chequer() {
  return <div aria-hidden className="chequer" />;
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
