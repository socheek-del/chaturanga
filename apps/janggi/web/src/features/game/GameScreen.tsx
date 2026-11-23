import { GameScreen as Screen, type GameScreenProps as ScreenProps } from '@chaturanga/game-shell/ui';
import { type Game, type Piece, janggi } from '@chaturanga/janggi';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../stores/settings';
import { BoardLines } from '../board/BoardLines';
import { PieceSvg } from '../board/PieceSvg';
import { boardTheme } from '../board/themes';
import { PassButton } from './PassButton';
import { PointsLine } from './PointsLine';

/** Janggi's own points, for the advantage shown next to each player (Han's 1.5 is in the points line). */
export const PIECE_VALUE: Record<string, number> = { k: 0, r: 13, c: 7, n: 5, b: 3, a: 3, p: 2 };

type Injected =
  | 'variant'
  | 'theme'
  | 'showCoordinates'
  | 'attackMap'
  | 'renderPiece'
  | 'boardLabel'
  | 'describeSquare'
  | 'pieceValues'
  | 'boardGrid'
  | 'boardUnderlay'
  | 'renderCounting';

export type GameScreenProps = Omit<ScreenProps<Game>, Injected>;

export { undoAllowed } from '@chaturanga/game-shell/ui';

/** The Janggi game screen: the shared screen on a points board with octagonal pieces, a pass button and the points. */
export function GameScreen(props: GameScreenProps) {
  const { t } = useTranslation();
  const theme = boardTheme(useSettings((st) => st.boardTheme));
  const showCoordinates = useSettings((st) => st.showCoordinates);
  const showAttackMap = useSettings((st) => st.showAttackMap);
  const updateSettings = useSettings((st) => st.update);
  const pieceSet = useSettings((st) => st.pieceSet);
  const pieceName = (piece: Piece) => t('board.pieceName', { piece: t(`pieces.${piece.type}`), color: t(`colors.${piece.color}`) });

  return (
    <Screen
      {...props}
      variant={janggi}
      theme={theme}
      showCoordinates={showCoordinates}
      attackMap={{ on: showAttackMap, onToggle: (on) => updateSettings({ showAttackMap: on }) }}
      renderPiece={(piece, className) => <PieceSvg piece={piece as Piece} set={pieceSet} className={className} />}
      boardLabel={t('board.label')}
      describeSquare={(point, piece) =>
        piece ? t('board.pointWithPiece', { point, piece: pieceName(piece as Piece) }) : t('board.emptyPoint', { point })
      }
      renderCounting={(game) => <PointsLine game={game} />}
      actions={
        <div className="grid auto-cols-fr grid-flow-col gap-2">
          <PassButton useSession={props.useSession} enabled={props.inputEnabled} />
          {props.actions}
        </div>
      }
      pieceValues={PIECE_VALUE}
      boardGrid="points"
      boardUnderlay={<BoardLines theme={theme} />}
    />
  );
}
