import { LessonPlayer as Player } from '@chaturanga/game-shell/ui';
import { type Color, type Piece, shogi } from '@chaturanga/shogi';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../stores/settings';
import { PieceSvg } from '../board/PieceSvg';
import { StarPoints } from '../board/StarPoints';
import { boardTheme } from '../board/themes';
import { type EndingExample, type Lesson, useL10n } from './types';

export interface LessonPlayerProps {
  lesson: Lesson;
  onExit: () => void;
  onFinish: (stars: 1 | 2 | 3) => void;
}

/** The Shogi lesson player: the shared player on the 9x9 board with wooden tiles. */
export function LessonPlayer(props: LessonPlayerProps) {
  const { t } = useTranslation();
  const translate = useL10n();
  const theme = boardTheme(useSettings((s) => s.boardTheme));
  const showCoordinates = useSettings((s) => s.showCoordinates);
  const pieceName = (piece: Piece) =>
    t('board.pieceName', {
      piece: t(`pieces.${piece.promoted ? `+${piece.type}` : piece.type}`),
      color: t(`colors.${piece.color}`),
    });

  return (
    <Player<ReturnType<typeof shogi.createGame>, EndingExample>
      {...props}
      variant={shogi}
      translate={translate}
      theme={theme}
      showCoordinates={showCoordinates}
      renderPiece={(piece, className) => (
        <PieceSvg piece={piece as Piece} theme={theme} upsideDown={(piece as Piece).color === 'b'} className={className} />
      )}
      boardLabel={t('board.label')}
      describeSquare={(square, piece) =>
        piece ? t('board.squareWithPiece', { square, piece: pieceName(piece as Piece) }) : t('board.emptySquare', { square })
      }
      boardUnderlay={<StarPoints theme={theme} />}
      handLabel={(color: Color) => t('board.hand', { color: t(`colors.${color}`) })}
      describeHandPiece={(type: string, count: number) => t('board.handPiece', { piece: t(`pieces.${type}`), count })}
    />
  );
}
