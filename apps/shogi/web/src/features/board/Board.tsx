import { Board as BoardView, type BoardProps as BoardViewProps } from '@chaturanga/board-ui';
import type { Piece } from '@chaturanga/shogi';
import { useTranslation } from 'react-i18next';
import { FILE_LABELS, RANK_LABELS } from '../game/GameScreen';
import { PieceSvg } from './PieceSvg';
import type { PieceSetId } from './pieceSets';
import { StarPoints } from './StarPoints';
import type { BoardTheme } from './themes';

export type BoardProps = Omit<
  BoardViewProps,
  'renderPiece' | 'label' | 'describeSquare' | 'underlay' | 'files' | 'ranks' | 'theme' | 'fileLabels' | 'rankLabels'
> & { theme: BoardTheme; pieceSet?: PieceSetId; tintGote?: boolean };

/** The Shogi board: the shared 9x9 board with wooden tiles, star points and traditional coordinates. */
export function Board({ theme, orientation = 'w', pieceSet = 'kanji', tintGote = false, ...props }: BoardProps) {
  const { t } = useTranslation();
  const pieceName = (piece: Piece) =>
    t('board.pieceName', { piece: t(`pieces.${piece.promoted ? `+${piece.type}` : piece.type}`), color: t(`colors.${piece.color}`) });

  return (
    <BoardView
      {...props}
      orientation={orientation}
      files={9}
      ranks={9}
      theme={theme}
      label={t('board.label')}
      renderPiece={(piece, className) => (
        <PieceSvg
          piece={piece as Piece}
          theme={theme}
          upsideDown={(piece as Piece).color !== orientation}
          set={pieceSet}
          tint={tintGote}
          className={className}
        />
      )}
      describeSquare={(square, piece) =>
        piece ? t('board.squareWithPiece', { square, piece: pieceName(piece as Piece) }) : t('board.emptySquare', { square })
      }
      underlay={<StarPoints theme={theme} />}
      fileLabels={FILE_LABELS}
      rankLabels={RANK_LABELS}
    />
  );
}
