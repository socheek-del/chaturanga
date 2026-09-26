import { GameScreen as Screen, type GameScreenProps as ScreenProps } from '@chaturanga/game-shell/ui';
import { type Game, makruk, type Piece } from '@chaturanga/makruk';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { PieceSvg } from '../board/PieceSvg';
import { boardTheme } from '../board/themes';
import { playSound } from '../sound/sound';
import { useSettings } from '../../stores/settings';
import { CountingIndicator } from './CountingIndicator';
import { PIECE_VALUE } from './result';

/** Props the Makruk product fills in for every game screen. */
type Injected =
  | 'variant'
  | 'theme'
  | 'showCoordinates'
  | 'attackMap'
  | 'renderPiece'
  | 'boardLabel'
  | 'describeSquare'
  | 'pieceValues'
  | 'onSound'
  | 'renderCounting';

export type GameScreenProps = Omit<ScreenProps<Game>, Injected | 'review'> & {
  /** The saved game this screen is writing (review-001); its result dialog then offers a review (review-002). */
  reviewId?: string | null;
};

export { undoAllowed } from '@chaturanga/game-shell/ui';

/** The Makruk game screen: the shared screen with Makruk pieces, board colours, sounds and counting. */
export function GameScreen({ reviewId, ...props }: GameScreenProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
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
      variant={makruk}
      theme={theme}
      showCoordinates={showCoordinates}
      attackMap={{ on: showAttackMap, onToggle: (on) => updateSettings({ showAttackMap: on }) }}
      renderPiece={(piece, className) => <PieceSvg piece={piece as Piece} className={className} />}
      boardLabel={t('board.label')}
      describeSquare={(square, piece) =>
        piece ? t('board.squareWithPiece', { square, piece: pieceName(piece as Piece) }) : t('board.emptySquare', { square })
      }
      pieceValues={PIECE_VALUE}
      onSound={playSound}
      review={reviewId ? { label: t('play.gameReview'), onReview: () => navigate(`/games/${reviewId}`) } : undefined}
      renderCounting={(game) => {
        const counting = game.counting();
        return counting && <CountingIndicator counting={counting} />;
      }}
    />
  );
}
