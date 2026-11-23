import { LessonPlayer as Player } from '@chaturanga/game-shell/ui';
import { type Piece, janggi } from '@chaturanga/janggi';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../stores/settings';
import { BoardLines } from '../board/BoardLines';
import { PieceSvg } from '../board/PieceSvg';
import { boardTheme } from '../board/themes';
import { type EndingExample, type Lesson, useL10n } from './types';

export interface LessonPlayerProps {
  lesson: Lesson;
  onExit: () => void;
  onFinish: (stars: 1 | 2 | 3) => void;
}

/** The Janggi lesson player: the shared player on a points board with octagonal pieces. */
export function LessonPlayer(props: LessonPlayerProps) {
  const { t } = useTranslation();
  const translate = useL10n();
  const theme = boardTheme(useSettings((s) => s.boardTheme));
  const showCoordinates = useSettings((s) => s.showCoordinates);
  const pieceSet = useSettings((s) => s.pieceSet);
  const pieceName = (piece: Piece) => t('board.pieceName', { piece: t(`pieces.${piece.type}`), color: t(`colors.${piece.color}`) });

  return (
    <Player<ReturnType<typeof janggi.createGame>, EndingExample>
      {...props}
      variant={janggi}
      translate={translate}
      theme={theme}
      showCoordinates={showCoordinates}
      renderPiece={(piece, className) => <PieceSvg piece={piece as Piece} set={pieceSet} className={className} />}
      boardLabel={t('board.label')}
      describeSquare={(point, piece) =>
        piece ? t('board.pointWithPiece', { point, piece: pieceName(piece as Piece) }) : t('board.emptyPoint', { point })
      }
      boardGrid="points"
      boardUnderlay={<BoardLines theme={theme} />}
    />
  );
}
