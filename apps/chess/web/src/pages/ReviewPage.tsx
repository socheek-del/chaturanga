import { ReviewScreen } from '@chaturanga/game-shell/ui';
import type { Piece } from '@chaturanga/chess';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { Chequer } from '../features/board/Chequer';
import { PieceSvg } from '../features/board/PieceSvg';
import { boardTheme } from '../features/board/themes';
import { chessReview } from '../features/review/kit';
import { useReviewLinks } from '../features/review/links';
import { useSettings } from '../stores/settings';

/** Review of one saved chess game (ch-016): the shared Review screen with the Marble board and pieces. */
export function ReviewPage() {
  const { t } = useTranslation();
  const { gameId = '' } = useParams();
  const theme = boardTheme(useSettings((s) => s.boardTheme));
  const pieceSet = useSettings((s) => s.pieceSet);
  const showCoordinates = useSettings((s) => s.showCoordinates);
  const pieceName = (piece: Piece) => t('board.pieceName', { piece: t(`pieces.${piece.type}`), color: t(`colors.${piece.color}`) });

  return (
    <ReviewScreen
      kit={chessReview}
      gameId={gameId}
      links={useReviewLinks()}
      look={{
        theme,
        showCoordinates,
        renderPiece: (piece, className) => <PieceSvg piece={piece as Piece} theme={theme} set={pieceSet} className={className} />,
        boardLabel: t('board.label'),
        describeSquare: (square, piece) =>
          piece ? t('board.squareWithPiece', { square, piece: pieceName(piece as Piece) }) : t('board.emptySquare', { square }),
        boardUnderlay: <Chequer theme={theme} />,
      }}
    />
  );
}
