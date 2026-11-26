import { Board, parseUci, type BoardTheme, type ParsedMove } from '@chaturanga/board-ui';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { isPlayableSquare, type Game } from '@chaturanga/fourchess';

const theme: BoardTheme = {
  board: '#e4dccb',
  boardAlternate: '#a8b4a6',
  line: '#67756c',
  coordinate: '#526159',
  selected: '#e0a84b',
  lastMove: 'rgba(229, 173, 80, 0.44)',
  check: 'rgba(194, 73, 61, 0.64)',
  hint: 'rgba(31, 50, 42, 0.45)',
};

const GLYPH: Record<string, string> = { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' };

export interface GameBoardProps {
  game: Game;
  selected: number | null;
  legalMoves: readonly ParsedMove[];
  canPlay: boolean;
  onSquareClick: (square: number) => void;
  onMove: (uci: string) => void;
}

export function GameBoard({ game, selected, legalMoves, canPlay, onSquareClick, onMove }: GameBoardProps) {
  const { t } = useTranslation();
  const targets = useMemo(() => legalMoves.filter((move): move is Extract<ParsedMove, { kind: 'move' }> => move.kind === 'move'), [legalMoves]);
  const destinations = selected === null ? [] : targets.filter((move) => move.from === selected);
  const last = game.lastMove();
  const parsedLast = last ? parseUci(last.uci, 14) : null;
  const lastMove = parsedLast?.kind === 'move' ? { from: parsedLast.from, to: parsedLast.to } : null;
  const checkSquare = game.checkedKingSquare();

  const moveBetween = (from: number, to: number): boolean => {
    const move = targets.find((candidate) => candidate.from === from && candidate.to === to);
    if (!canPlay || !move) return false;
    onMove(move.uci);
    return true;
  };

  return (
    <div className="board-mat">
      <Board
        files={14}
        ranks={14}
        pieces={game.pieces()}
        theme={theme}
        label={t('game.boardLabel')}
        describeSquare={(name, piece) => piece ? t('game.square', { square: name, piece: `${t(`players.${piece.color}`)} ${t(`game.piece.${piece.type}`)}` }) : name}
        renderPiece={(piece, className) => (
          <span className={`piece-token token-${piece.color} ${className}`} aria-hidden="true">
            {GLYPH[piece.type] ?? piece.type.toUpperCase()}
            {piece.promoted && <i className="promotion-star">✦</i>}
          </span>
        )}
        isPlayable={isPlayableSquare}
        selected={selected}
        targets={canPlay ? destinations.map((move) => move.to) : []}
        lastMove={lastMove}
        checkSquare={checkSquare}
        showCoordinates
        onSquareClick={onSquareClick}
        canDrag={(square) => canPlay && game.pieceAt(square)?.color === game.turn && game.isActive(game.turn)}
        onDrop={moveBetween}
        className="cross-board"
      />
    </div>
  );
}
