import { LessonPlayer as Player } from '@chaturanga/game-shell/ui';
import { chess, type Piece } from '@chaturanga/chess';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../stores/settings';
import { PieceSvg } from '../board/PieceSvg';
import { Chequer } from '../board/Chequer';
import { boardTheme } from '../board/themes';
import { type EndingExample, type Lesson, useL10n } from './types';

export interface LessonPlayerProps {
  lesson: Lesson;
  onExit: () => void;
  onFinish: (stars: 1 | 2 | 3) => void;
}

/** The chess lesson player: the shared player on the Marble board. */
export function LessonPlayer(props: LessonPlayerProps) {
  const { t } = useTranslation();
  const translate = useL10n();
  const theme = boardTheme(useSettings((s) => s.boardTheme));
  const showCoordinates = useSettings((s) => s.showCoordinates);
  const pieceSet = useSettings((s) => s.pieceSet);
  const pieceName = (piece: Piece) => t('board.pieceName', { piece: t(`pieces.${piece.type}`), color: t(`colors.${piece.color}`) });

  return (
    <Player<ReturnType<typeof chess.createGame>, EndingExample>
      {...props}
      variant={chess}
      translate={translate}
      theme={theme}
      showCoordinates={showCoordinates}
      renderPiece={(piece, className) => <PieceSvg piece={piece as Piece} theme={theme} set={pieceSet} className={className} />}
      boardLabel={t('board.label')}
      describeSquare={(square, piece) =>
        piece ? t('board.squareWithPiece', { square, piece: pieceName(piece as Piece) }) : t('board.emptySquare', { square })
      }
      boardUnderlay={<Chequer theme={theme} />}
    />
  );
}
