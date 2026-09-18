import { chess, type Game, type Piece } from '@chaturanga/chess';
import { GameScreen as Screen, type GameScreenProps as ScreenProps } from '@chaturanga/game-shell/ui';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../stores/settings';
import { Chequer } from '../board/Chequer';
import { PieceSvg } from '../board/PieceSvg';
import { boardTheme } from '../board/themes';

/** Ordinary chess piece values in pawns, for the advantage shown next to each player. */
export const PIECE_VALUE: Record<string, number> = { k: 0, q: 9, r: 5, b: 3, n: 3, p: 1 };

type Injected =
  | 'variant'
  | 'theme'
  | 'showCoordinates'
  | 'renderPiece'
  | 'boardLabel'
  | 'describeSquare'
  | 'pieceValues'
  | 'boardUnderlay'
  | 'describePromotion';

export type GameScreenProps = Omit<ScreenProps<Game>, Injected>;

export { undoAllowed } from '@chaturanga/game-shell/ui';

/** The chess game screen: the shared screen with the Marble board and piece set. */
export function GameScreen(props: GameScreenProps) {
  const { t } = useTranslation();
  const theme = boardTheme(useSettings((st) => st.boardTheme));
  const showCoordinates = useSettings((st) => st.showCoordinates);
  const pieceName = (piece: Piece) => t('board.pieceName', { piece: t(`pieces.${piece.type}`), color: t(`colors.${piece.color}`) });

  return (
    <Screen
      {...props}
      variant={chess}
      theme={theme}
      showCoordinates={showCoordinates}
      renderPiece={(piece, className) => <PieceSvg piece={piece as Piece} theme={theme} className={className} />}
      boardLabel={t('board.label')}
      describeSquare={(square, piece) =>
        piece ? t('board.squareWithPiece', { square, piece: pieceName(piece as Piece) }) : t('board.emptySquare', { square })
      }
      pieceValues={PIECE_VALUE}
      boardUnderlay={<Chequer theme={theme} />}
      describePromotion={(piece) => t(`pieces.${piece.type}`)}
    />
  );
}
