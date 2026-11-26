import type { BoardTheme } from '@chaturanga/board-ui';
import type { Piece as KoPiece } from '@chaturanga/ko-shogi';
import type { Piece as BoardPiece } from '@chaturanga/rules-core';
import { useTranslation } from 'react-i18next';
import { PieceSeal } from './components/PieceSeal';

export const KO_BOARD_THEME: BoardTheme = {
  board: '#e8dfcd',
  boardAlternate: '#e8dfcd',
  line: '#625e52',
  coordinate: '#536365',
  selected: 'rgba(197, 74, 53, .25)',
  lastMove: 'rgba(51, 102, 88, .16)',
  check: '#c74733',
  hint: '#ba4b37',
};

export function renderPiece(piece: BoardPiece, className: string) {
  return <PieceSeal piece={piece as KoPiece} className={className} />;
}

export function useBoardIdentity() {
  const { t } = useTranslation();
  return {
    theme: KO_BOARD_THEME,
    grid: 'points' as const,
    showCoordinates: true,
    renderPiece,
    label: t('board.label'),
    fileLabels: 'abcdefghijklmnopqrs'.split(''),
    rankLabels: Array.from({ length: 19 }, (_, index) => String(index + 1)),
    underlay: <svg viewBox="0 0 19 19" preserveAspectRatio="none" aria-hidden="true">
      {Array.from({ length: 19 }, (_, index) => <g key={index}>
        <path d={`M${index + .5} .5V18.5`} />
        <path d={`M.5 ${index + .5}H18.5`} />
      </g>)}
      <path className="board-center-mark" d="M7.5 7.5h4v4h-4zM6.5 6.5h6v6h-6z" />
    </svg>,
    describeSquare: (square: string, piece: BoardPiece | null) => {
      if (!piece) return t('board.squareEmpty', { square });
      return t('board.squarePiece', {
        square,
        color: t(`colors.${piece.color}`),
        piece: t(`pieces.${piece.type}.name`),
        promoted: piece.promoted ? t('board.promoted') : '',
      });
    },
  };
}
