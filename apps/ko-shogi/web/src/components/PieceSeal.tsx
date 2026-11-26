import type { Piece } from '@chaturanga/ko-shogi';
import { useTranslation } from 'react-i18next';
import { PIECE_SEALS } from '../lessons/pieceAtlas';

export function PieceSeal({ piece, className = '' }: { piece: Piece; className?: string }) {
  const { t } = useTranslation();
  return <span aria-hidden="true" className={`piece-seal piece-seal--${piece.color} ${piece.promoted ? 'is-promoted' : ''} ${className}`}>
    <span>{PIECE_SEALS[piece.type]}</span>
    {piece.promoted && <i />}
    <small>{t(`pieces.${piece.type}.name`)}</small>
  </span>;
}
