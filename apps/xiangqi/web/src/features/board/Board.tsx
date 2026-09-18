import { Board as BoardView, type BoardProps as BoardViewProps } from '@chaturanga/board-ui';
import type { Piece } from '@chaturanga/xiangqi';
import { useTranslation } from 'react-i18next';
import { BoardLines } from './BoardLines';
import { PieceSvg } from './PieceSvg';
import type { PieceSetId } from './pieceSets';
import type { BoardTheme } from './themes';

export type BoardProps = Omit<
  BoardViewProps,
  'renderPiece' | 'label' | 'describeSquare' | 'underlay' | 'grid' | 'files' | 'ranks' | 'theme'
> & { theme: BoardTheme; pieceSet?: PieceSetId };

/** The Xiangqi board: the shared board UI on a points grid, with carved-disc pieces and drawn lines. */
export function Board({ theme, pieceSet = 'characters', ...props }: BoardProps) {
  const { t } = useTranslation();
  const pieceName = (piece: Piece) => t('board.pieceName', { piece: t(`pieces.${piece.type}`), color: t(`colors.${piece.color}`) });

  return (
    <BoardView
      {...props}
      files={9}
      ranks={10}
      grid="points"
      theme={theme}
      label={t('board.label')}
      renderPiece={(piece, className) => <PieceSvg piece={piece as Piece} set={pieceSet} className={className} />}
      describeSquare={(point, piece) =>
        piece ? t('board.pointWithPiece', { point, piece: pieceName(piece as Piece) }) : t('board.emptyPoint', { point })
      }
      underlay={<BoardLines theme={theme} />}
    />
  );
}
