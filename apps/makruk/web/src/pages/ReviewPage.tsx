import { ReviewScreen } from '@chaturanga/game-shell/ui';
import type { Piece } from '@chaturanga/makruk';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { PieceSvg } from '../features/board/PieceSvg';
import { boardTheme } from '../features/board/themes';
import { makrukReview } from '../features/review/kit';
import { useReviewLinks } from '../features/review/links';
import { useSettings } from '../stores/settings';

/** Review of one saved Makruk game (review-002): the shared Review screen with the Wat board and pieces. */
export function ReviewPage() {
  const { t } = useTranslation();
  const { gameId = '' } = useParams();
  const theme = boardTheme(useSettings((s) => s.boardTheme));
  const showCoordinates = useSettings((s) => s.showCoordinates);
  const pieceName = (piece: Piece) =>
    t('board.pieceName', { piece: t(piece.promoted ? 'pieces.promoted' : `pieces.${piece.type}`), color: t(`colors.${piece.color}`) });

  return (
    <ReviewScreen
      kit={makrukReview}
      gameId={gameId}
      links={useReviewLinks()}
      look={{
        theme,
        showCoordinates,
        renderPiece: (piece, className) => <PieceSvg piece={piece as Piece} className={className} />,
        boardLabel: t('board.label'),
        describeSquare: (square, piece) =>
          piece ? t('board.squareWithPiece', { square, piece: pieceName(piece as Piece) }) : t('board.emptySquare', { square }),
      }}
    />
  );
}
