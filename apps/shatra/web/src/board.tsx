import type { BoardTheme } from '@chaturanga/board-ui';
import type { Piece } from '@chaturanga/rules-core';
import { FILES, RANKS, fieldOf, isFortress, isGate, square as parseSquare, type PieceType } from '@chaturanga/shatra';
import { useTranslation } from 'react-i18next';

export const boardTheme: BoardTheme = {
  board: '#e7d9bc', line: '#7b715c', coordinate: '#59584c', selected: '#dfad4f99',
  lastMove: '#e6c77888', check: '#b1443c', hint: '#60796fbb',
};

const sigil: Record<PieceType, string> = { k: 'K', s: 'S', b: 'B' };

export function renderPiece(piece: Piece, className: string) {
  const type = piece.type as PieceType;
  return <span aria-hidden className={`piece ${className}`} data-side={piece.color} data-kind={type} data-promoted={piece.promoted || undefined}>
    <i />
    <b>{sigil[type]}</b>
    {piece.promoted && <span className="piece-star">✦</span>}
  </span>;
}

export function useBoardIdentity() {
  const { t } = useTranslation();
  return {
    theme: boardTheme,
    showCoordinates: true,
    renderPiece,
    boardLabel: t('board.label'),
    routeChoiceTitle: t('play.chooseRoute'),
    describeSquare: (name: string, piece: Piece | null) => {
      const index = parseSquare(name);
      const field = fieldOf(index)!;
      const occupant = piece ? t('board.pieceName', { color: t(`colors.${piece.color}`), piece: t(`pieces.${piece.type}`) }) : t('board.empty');
      if (isGate(index)) return t('board.gate', { field, occupant });
      if (isFortress(index)) return t('board.fortress', { field, occupant });
      return piece ? t('board.squareWithPiece', { field, occupant }) : t('board.emptySquare', { field });
    },
  };
}

export const boardDimensions = { files: FILES, ranks: RANKS } as const;
