import { GameScreen as Screen, type GameScreenProps as ScreenProps } from '@chaturanga/game-shell/ui';
import { type Color, type Game, type Piece, shogi } from '@chaturanga/shogi';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../stores/settings';
import { PieceSvg } from '../board/PieceSvg';
import { StarPoints } from '../board/StarPoints';
import { boardTheme } from '../board/themes';

/** Rough Shogi material values in pawns, for the advantage shown next to each player. */
export const PIECE_VALUE: Record<string, number> = { k: 0, r: 10, b: 8.5, g: 6, s: 5.5, n: 4, l: 3.5, p: 1 };

/** Files read 9 to 1 from the left and ranks 一 to 九 downwards, as on a real board (D12). */
export const FILE_LABELS = ['9', '8', '7', '6', '5', '4', '3', '2', '1'] as const;
export const RANK_LABELS = ['一', '二', '三', '四', '五', '六', '七', '八', '九'] as const;

type Injected =
  | 'variant'
  | 'theme'
  | 'showCoordinates'
  | 'renderPiece'
  | 'boardLabel'
  | 'describeSquare'
  | 'pieceValues'
  | 'boardUnderlay'
  | 'fileLabels'
  | 'rankLabels'
  | 'handLabel'
  | 'describeHandPiece';

export type GameScreenProps = Omit<ScreenProps<Game>, Injected>;

export { undoAllowed } from '@chaturanga/game-shell/ui';

/** The Shogi game screen: the shared screen with wooden tiles, hand trays and traditional coordinates. */
export function GameScreen(props: GameScreenProps) {
  const { t } = useTranslation();
  const theme = boardTheme(useSettings((st) => st.boardTheme));
  const showCoordinates = useSettings((st) => st.showCoordinates);
  const pieceSet = useSettings((st) => st.pieceSet);
  const tintGote = useSettings((st) => st.tintGote);
  const pieceName = (piece: Piece) =>
    t('board.pieceName', { piece: t(`pieces.${piece.promoted ? `+${piece.type}` : piece.type}`), color: t(`colors.${piece.color}`) });

  return (
    <Screen
      {...props}
      variant={shogi}
      theme={theme}
      showCoordinates={showCoordinates}
      // A tile points away from its owner, so the far player's pieces are turned around.
      renderPiece={(piece, className) => (
        <PieceSvg
          piece={piece as Piece}
          theme={theme}
          upsideDown={(piece as Piece).color !== props.orientation}
          set={pieceSet}
          tint={tintGote}
          className={className}
        />
      )}
      boardLabel={t('board.label')}
      describeSquare={(square, piece) =>
        piece ? t('board.squareWithPiece', { square, piece: pieceName(piece as Piece) }) : t('board.emptySquare', { square })
      }
      pieceValues={PIECE_VALUE}
      boardUnderlay={<StarPoints theme={theme} />}
      fileLabels={FILE_LABELS}
      rankLabels={RANK_LABELS}
      handLabel={(color: Color) => t('board.hand', { color: t(`colors.${color}`) })}
      describeHandPiece={(type: string, count: number) => t('board.handPiece', { piece: t(`pieces.${type}`), count })}
    />
  );
}
