import type { BoardTheme } from '@chaturanga/board-ui';
import type { Piece, Square } from '@chaturanga/rules-core';
import { squareName } from '@chaturanga/chu-shogi';
import { useTranslation } from 'react-i18next';
import { activeRank, PieceGlyph } from './components/PieceGlyph';

export const CHU_BOARD_THEME: BoardTheme = {
  board: 'var(--board-field)',
  boardAlternate: 'var(--board-field)',
  line: 'var(--board-line)',
  coordinate: 'var(--muted)',
  selected: '#aa7934',
  lastMove: 'rgba(36, 86, 90, .18)',
  check: '#b34c39',
  hint: '#aa7934',
};

export function renderPiece(piece: Piece, className: string) {
  return <PieceGlyph piece={piece} className={className} />;
}

export function useBoardIdentity() {
  const { t } = useTranslation();
  return {
    theme: CHU_BOARD_THEME,
    showCoordinates: true,
    renderPiece,
    boardLabel: t('board.label'),
    fileLabels: 'abcdefghijkl'.split(''),
    rankLabels: Array.from({ length: 12 }, (_, index) => String(index + 1)),
    boardOverlay: <svg className="board-registration" viewBox="0 0 12 12" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 4h12M0 9h12" />
    </svg>,
    describeSquare: (name: string, piece: Piece | null) => {
      if (!piece) return t('board.squareEmpty', { square: name });
      const rank = activeRank(piece);
      return t('board.squarePiece', {
        square: name,
        color: t(`colors.${piece.color}`),
        piece: rank ? t(`atlas.ranks.${rank.nameKey}.name`) : t(`pieces.${piece.type}`),
        promoted: piece.promoted ? t('board.promoted') : '',
      });
    },
  };
}

export const DISPLAY_SQUARES: readonly Square[] = Object.freeze(
  Array.from({ length: 144 }, (_, index) => (11 - Math.floor(index / 12)) * 12 + (index % 12)),
);

export const describeSquareName = squareName;
