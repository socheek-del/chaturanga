import { LessonPlayer as Player } from '@chaturanga/game-shell/ui';
import { type Piece, xiangqi } from '@chaturanga/xiangqi';
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

/** The Xiangqi lesson player: the shared player on a points board with carved-disc pieces. */
export function LessonPlayer(props: LessonPlayerProps) {
  const { t } = useTranslation();
  const translate = useL10n();
  const theme = boardTheme(useSettings((s) => s.boardTheme));
  const showCoordinates = useSettings((s) => s.showCoordinates);
  const pieceName = (piece: Piece) => t('board.pieceName', { piece: t(`pieces.${piece.type}`), color: t(`colors.${piece.color}`) });

  return (
    <Player<ReturnType<typeof xiangqi.createGame>, EndingExample>
      {...props}
      variant={xiangqi}
      translate={translate}
      theme={theme}
      showCoordinates={showCoordinates}
      renderPiece={(piece, className) => <PieceSvg piece={piece as Piece} className={className} />}
      boardLabel={t('board.label')}
      describeSquare={(point, piece) =>
        piece ? t('board.pointWithPiece', { point, piece: pieceName(piece as Piece) }) : t('board.emptyPoint', { point })
      }
      boardGrid="points"
      boardUnderlay={<BoardLines theme={theme} />}
    />
  );
}
