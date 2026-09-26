import { GameScreen as Screen, type GameScreenProps as ScreenProps } from '@chaturanga/game-shell/ui';
import { type Game, type Piece, sittuyin } from '@chaturanga/sittuyin';
import { useTranslation } from 'react-i18next';
import { PieceSvg } from '../board/PieceSvg';
import { PromotionDiagonals } from '../board/PromotionDiagonals';
import { boardTheme } from '../board/themes';
import { useSettings } from '../../stores/settings';
import { CountingIndicator } from './CountingIndicator';

/** Rough Sittuyin material values; the Sit-ke is weak, so it sits below the Sin. */
export const PIECE_VALUE: Record<string, number> = { k: 0, r: 5, n: 3, s: 2.5, f: 2, p: 1 };

type Injected =
  | 'variant'
  | 'theme'
  | 'showCoordinates'
  | 'attackMap'
  | 'renderPiece'
  | 'boardLabel'
  | 'describeSquare'
  | 'pieceValues'
  | 'renderCounting'
  | 'handLabel'
  | 'describeHandPiece'
  | 'boardOverlay';

export type GameScreenProps = Omit<ScreenProps<Game>, Injected>;

export { undoAllowed } from '@chaturanga/game-shell/ui';

/** The Sittuyin game screen: the shared screen with yun pieces, lacquer board, hand trays and counting. */
export function GameScreen(props: GameScreenProps) {
  const { t } = useTranslation();
  const theme = boardTheme(useSettings((st) => st.boardTheme));
  const showCoordinates = useSettings((st) => st.showCoordinates);
  const showAttackMap = useSettings((st) => st.showAttackMap);
  const updateSettings = useSettings((st) => st.update);

  const pieceName = (piece: Piece) =>
    t('board.pieceName', {
      piece: t(piece.promoted ? 'pieces.promoted' : `pieces.${piece.type}`),
      color: t(`colors.${piece.color}`),
    });

  return (
    <Screen
      {...props}
      variant={sittuyin}
      theme={theme}
      showCoordinates={showCoordinates}
      attackMap={{ on: showAttackMap, onToggle: (on) => updateSettings({ showAttackMap: on }) }}
      renderPiece={(piece, className) => <PieceSvg piece={piece as Piece} className={className} />}
      boardLabel={t('board.label')}
      describeSquare={(square, piece) =>
        piece ? t('board.squareWithPiece', { square, piece: pieceName(piece as Piece) }) : t('board.emptySquare', { square })
      }
      pieceValues={PIECE_VALUE}
      boardOverlay={<PromotionDiagonals colour={theme.diagonal} />}
      handLabel={(color) => t('setup.hand', { color: t(`colors.${color}`) })}
      describeHandPiece={(type, count) => t('setup.handPiece', { piece: t(`pieces.${type}`), count })}
      renderCounting={(game) => {
        const counting = game.counting();
        return counting && <CountingIndicator counting={counting} />;
      }}
    />
  );
}
