import { GameScreen as Screen, type GameScreenProps as ScreenProps } from '@chaturanga/game-shell/ui';
import { type Game, type Piece, xiangqi } from '@chaturanga/xiangqi';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../stores/settings';
import { BoardLines } from '../board/BoardLines';
import { PieceSvg } from '../board/PieceSvg';
import { boardTheme } from '../board/themes';

/** Rough Xiangqi material values in soldiers, for the advantage shown next to each player. */
export const PIECE_VALUE: Record<string, number> = { k: 0, r: 9, c: 4.5, n: 4, b: 2, a: 2, p: 1 };

type Injected =
  | 'variant'
  | 'theme'
  | 'showCoordinates'
  | 'renderPiece'
  | 'boardLabel'
  | 'describeSquare'
  | 'pieceValues'
  | 'boardGrid'
  | 'boardUnderlay';

export type GameScreenProps = Omit<ScreenProps<Game>, Injected>;

export { undoAllowed } from '@chaturanga/game-shell/ui';

/** The Xiangqi game screen: the shared screen on a points board with carved-disc pieces. */
export function GameScreen(props: GameScreenProps) {
  const { t } = useTranslation();
  const theme = boardTheme(useSettings((st) => st.boardTheme));
  const showCoordinates = useSettings((st) => st.showCoordinates);
  const pieceName = (piece: Piece) => t('board.pieceName', { piece: t(`pieces.${piece.type}`), color: t(`colors.${piece.color}`) });

  return (
    <Screen
      {...props}
      variant={xiangqi}
      theme={theme}
      showCoordinates={showCoordinates}
      renderPiece={(piece, className) => <PieceSvg piece={piece as Piece} className={className} />}
      boardLabel={t('board.label')}
      describeSquare={(point, piece) =>
        piece ? t('board.pointWithPiece', { point, piece: pieceName(piece as Piece) }) : t('board.emptyPoint', { point })
      }
      pieceValues={PIECE_VALUE}
      boardGrid="points"
      boardUnderlay={<BoardLines theme={theme} />}
    />
  );
}
