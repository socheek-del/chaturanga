import type { Piece } from '@chaturanga/makruk';
import { useSettings } from '../../stores/settings';
import { ClassicPiece } from './pieces/classic';
import { FlatPiece } from './pieces/flat';
import { TraditionalPiece } from './pieces/traditional';

export const PIECE_SETS = {
  classic: ClassicPiece,
  traditional: TraditionalPiece,
  flat: FlatPiece,
} as const;

export type PieceSetId = keyof typeof PIECE_SETS;
export const PIECE_SET_IDS = Object.keys(PIECE_SETS) as PieceSetId[];

export interface PieceSvgProps {
  piece: Piece;
  className?: string;
  /** Force a set (e.g. settings previews); defaults to the user's chosen set. */
  set?: PieceSetId;
}

export function PieceSvg({ piece, className, set }: PieceSvgProps) {
  const chosen = useSettings((s) => s.pieceSet);
  const Component = PIECE_SETS[(set ?? chosen) as PieceSetId] ?? ClassicPiece;
  return <Component piece={piece} className={className} />;
}
