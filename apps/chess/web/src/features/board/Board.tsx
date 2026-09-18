import { Board as BoardView, type BoardProps as BoardViewProps } from '@chaturanga/board-ui';
import type { Piece } from '@chaturanga/chess';
import { useTranslation } from 'react-i18next';
import { Chequer } from './Chequer';
import { PieceSvg } from './PieceSvg';
import type { BoardTheme } from './themes';

export type BoardProps = Omit<
  BoardViewProps,
  'renderPiece' | 'label' | 'describeSquare' | 'underlay' | 'files' | 'ranks' | 'theme'
> & { theme: BoardTheme };

/** The chess board: the shared 8x8 board with the chequer drawn underneath and the Marble piece set. */
export function Board({ theme, ...props }: BoardProps) {
  const { t } = useTranslation();
  const pieceName = (piece: Piece) => t('board.pieceName', { piece: t(`pieces.${piece.type}`), color: t(`colors.${piece.color}`) });

  return (
    <BoardView
      {...props}
      files={8}
      ranks={8}
      theme={theme}
      label={t('board.label')}
      renderPiece={(piece, className) => <PieceSvg piece={piece as Piece} theme={theme} className={className} />}
      describeSquare={(square, piece) =>
        piece ? t('board.squareWithPiece', { square, piece: pieceName(piece as Piece) }) : t('board.emptySquare', { square })
      }
      underlay={<Chequer theme={theme} />}
    />
  );
}
