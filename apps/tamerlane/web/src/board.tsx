import type { BoardTheme } from '@chaturanga/board-ui';
import type { Piece } from '@chaturanga/rules-core';
import { PAWN_TARGET, isPawn, type PieceType } from '@chaturanga/tamerlane';
import { useTranslation } from 'react-i18next';

export const boardTheme: BoardTheme = {
  board: '#ead9a5', line: 'transparent', coordinate: '#4c452d', selected: '#fbdb83',
  lastMove: '#f9e08a90', check: '#a52642', hint: '#4e6129b0',
};

export function renderPiece(piece: Piece, className: string) {
  const type = piece.type as PieceType;
  const pawn = isPawn(type);
  const badge = type === 'y' ? undefined : PAWN_TARGET[type];
  return <span aria-hidden className={`piece ${className}`} data-side={piece.color} data-kind={pawn ? 'p' : type}>
    <i />
    {badge ? <span data-badge data-kind={badge}><i /></span> : pawn && <span data-badge data-stage>
      {type === 'p' ? 'Ⅰ' : type === 'x' ? 'Ⅱ' : 'Ⅲ'}
    </span>}
  </span>;
}

export function useBoardIdentity() {
  const { t } = useTranslation();
  return {
    theme: boardTheme,
    showCoordinates: true,
    renderPiece,
    boardLabel: t('board.label'),
    describeSquare: (square: string, piece: Piece | null) => {
      const occupant = piece ? t('board.pieceName', { color: t(`colors.${piece.color}`), piece: t(`pieces.${piece.type}`) }) : t('board.empty');
      const citadel = square === 'a9' ? 'b' : square === 'm2' ? 'w' : null;
      if (citadel) return t('board.citadel', { square, color: t(`colors.${citadel}`), occupant });
      return piece ? t('board.squareWithPiece', { square, piece: occupant }) : t('board.emptySquare', { square });
    },
  };
}
