import { type Game, senterej, type Piece as SenterejPiece } from '@chaturanga/senterej';
import { type Piece } from '@chaturanga/rules-core';
import { GameScreen as SharedGameScreen, type GameScreenProps as SharedProps } from '@chaturanga/game-shell/ui';
import { useTranslation } from 'react-i18next';
import { PieceMark } from '../board/PieceMark';

export { undoAllowed } from '@chaturanga/game-shell/ui';

const PIECE_VALUE: Record<string, number> = { k: 0, r: 5.2, n: 3.1, b: 2.2, q: 1.8, p: 1.1 };

type Injected = 'variant' | 'theme' | 'showCoordinates' | 'renderPiece' | 'boardLabel' | 'describeSquare' | 'pieceValues';
export type GameScreenProps = Omit<SharedProps<Game>, Injected>;

export const BOARD_THEME = {
  board: '#e9d8b5',
  line: '#9a563b',
  coordinate: '#654438',
  selected: 'rgba(31, 92, 102, 0.32)',
  lastMove: 'rgba(198, 114, 74, 0.22)',
  check: 'rgba(179, 62, 51, 0.55)',
  hint: 'rgba(31, 92, 102, 0.58)',
};

export function GameScreen(props: GameScreenProps) {
  const { t } = useTranslation();
  const pieceName = (piece: Piece) => t(`pieces.${piece.type}`);
  return (
    <SharedGameScreen
      {...props}
      variant={senterej}
      theme={BOARD_THEME}
      showCoordinates
      renderPiece={(piece, className) => <PieceMark piece={piece as SenterejPiece} className={className} />}
      boardLabel={t('board.label')}
      describeSquare={(square, piece) => piece
        ? t('board.squareWithPiece', { square, piece: pieceName(piece as Piece), color: t(`colors.${piece.color}`) })
        : t('board.emptySquare', { square })}
      pieceValues={PIECE_VALUE}
    />
  );
}
