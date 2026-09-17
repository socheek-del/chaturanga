import type { Color, Piece, Square } from '@chaturanga/rules-core';
import type React from 'react';
import {
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type Ref,
  useImperativeHandle,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { squareNameOf } from './coords';
import type { BoardTheme } from './theme';

export interface BoardHandle {
  /** Square under a viewport point, or null outside the board (used to drop pieces dragged from a hand tray). */
  squareAt(clientX: number, clientY: number): Square | null;
}

export interface BoardProps {
  pieces: ReadonlyArray<{ square: Square; piece: Piece }>;
  theme: BoardTheme;
  /** Draws a piece; the app owns the piece art. */
  renderPiece: (piece: Piece, className: string) => ReactNode;
  /** Accessible name of the board. */
  label: string;
  /** Accessible name of a square, e.g. "e4, white Khun". */
  describeSquare: (square: string, piece: Piece | null) => string;
  files?: number;
  ranks?: number;
  /**
   * `squares` (default): pieces stand inside squares separated by grid lines, as in Makruk and Sittuyin.
   * `points`: pieces stand on line intersections, as in Xiangqi. The board is one plain surface and the product
   * draws its lines in `underlay`; point (file, rank) sits at the centre of its cell, so in an SVG with
   * `viewBox="0 0 files ranks"` its display column `c` and row `r` are at (c + 0.5, r + 0.5).
   */
  grid?: 'squares' | 'points';
  orientation?: Color;
  showCoordinates?: boolean;
  selected?: Square | null;
  targets?: ReadonlyArray<Square>;
  /** Targets reached by promoting; marked with a badge. */
  promotionTargets?: ReadonlyArray<Square>;
  /** A drop has no `from`. */
  lastMove?: { from?: Square | null; to: Square } | null;
  checkSquare?: Square | null;
  /** Suggested move from the hint engine. */
  hint?: { from?: Square | null; to: Square } | null;
  /** Slide the piece that just moved; `key` changes once per move. Drops and in-place moves do not slide. */
  animate?: { from?: Square | null; to: Square; key: string } | null;
  onSquareClick?: (square: Square) => void;
  canDrag?: (square: Square) => boolean;
  onDrop?: (from: Square, to: Square) => boolean;
  handle?: Ref<BoardHandle>;
  /**
   * Markings drawn across the whole board, over the squares — for lines the rules make meaningful, such
   * as the diagonals a Sittuyin Ne promotes on. Keep them light: they sit above the pieces, so a heavy
   * marking would cut through the art. Never receives pointer events.
   */
  overlay?: ReactNode;
  /**
   * Drawn across the whole board under the pieces and every marking, such as a Xiangqi board's lines, river
   * and palaces. Fills the board's padding box. Never receives pointer events.
   */
  underlay?: ReactNode;
  className?: string;
}

interface DragState {
  from: Square;
  piece: Piece;
  pointerId: number;
  startX: number;
  startY: number;
  x: number;
  y: number;
  size: number;
  active: boolean;
}

/** Pointer travel (px) before a press becomes a drag; shorter presses are taps. */
const DRAG_THRESHOLD = 6;

export const pieceCode = (piece: Piece): string => `${piece.color}${piece.type}${piece.promoted ? '~' : ''}`;

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(REDUCED_MOTION);
      media.addEventListener('change', onChange);
      return () => media.removeEventListener('change', onChange);
    },
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );
}

const cx = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ');

export function Board({
  pieces,
  theme,
  renderPiece,
  label,
  describeSquare,
  files = 8,
  ranks = 8,
  grid = 'squares',
  orientation = 'w',
  showCoordinates = true,
  selected = null,
  targets = [],
  promotionTargets = [],
  lastMove = null,
  checkSquare = null,
  hint = null,
  animate = null,
  onSquareClick,
  canDrag,
  onDrop,
  handle,
  overlay,
  underlay,
  className,
}: BoardProps) {
  const points = grid === 'points';
  // On a points board, cell-wide highlights become discs around the point.
  const mark = points ? 'absolute inset-[6%] rounded-full' : 'absolute inset-0';
  const boardRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const droppedOn = useRef<Square | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  const displayPos = (square: Square) => {
    const file = square % files;
    const rank = Math.floor(square / files);
    return orientation === 'w' ? { col: file, row: ranks - 1 - rank } : { col: files - 1 - file, row: rank };
  };
  const squareFor = (row: number, col: number): Square => {
    const rank = orientation === 'w' ? ranks - 1 - row : row;
    const file = orientation === 'w' ? col : files - 1 - col;
    return rank * files + file;
  };

  const squareAt = (clientX: number, clientY: number): Square | null => {
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return null;
    const col = Math.floor(((clientX - rect.left) / rect.width) * files);
    const row = Math.floor(((clientY - rect.top) / rect.height) * ranks);
    if (col < 0 || col >= files || row < 0 || row >= ranks) return null;
    return squareFor(row, col);
  };
  useImperativeHandle(handle, () => ({ squareAt }));

  // Drag-and-drop already put the piece in place, and reduced-motion users get no sliding.
  const from = animate?.from;
  const slide =
    animate && from !== null && from !== undefined && from !== animate.to && !reducedMotion && droppedOn.current !== animate.to
      ? {
          to: animate.to,
          key: animate.key,
          dx: displayPos(from).col - displayPos(animate.to).col,
          dy: displayPos(from).row - displayPos(animate.to).row,
        }
      : null;
  const bySquare = new Map(pieces.map((p) => [p.square, p.piece]));
  const targetSet = new Set(targets);
  const promotionSet = new Set(promotionTargets);

  const startDrag = (square: Square, e: ReactPointerEvent) => {
    const piece = bySquare.get(square);
    if (!piece || !canDrag?.(square) || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const rect = boardRef.current?.getBoundingClientRect();
    setDrag({
      from: square,
      piece,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      x: e.clientX,
      y: e.clientY,
      size: rect ? (rect.width / files) * 1.15 : 48,
      active: false,
    });
  };

  const moveDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const active = drag.active || Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) > DRAG_THRESHOLD;
    // Capture only once it is a real drag, so plain taps still produce a click on the square.
    if (active && !drag.active) e.currentTarget.setPointerCapture(e.pointerId);
    setDrag({ ...drag, x: e.clientX, y: e.clientY, active });
  };

  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag || e.pointerId !== drag.pointerId) return;
    if (drag.active) {
      const to = squareAt(e.clientX, e.clientY);
      if (to !== null && to !== drag.from && onDrop?.(drag.from, to)) droppedOn.current = to;
      if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setDrag(null);
  };

  const hovered = drag?.active ? squareAt(drag.x, drag.y) : null;
  const marks = (move: { from?: Square | null; to: Square } | null, square: Square) =>
    !!move && (square === move.to || (move.from !== null && move.from !== undefined && square === move.from));

  const cells: ReactNode[] = [];
  for (let row = 0; row < ranks; row++) {
    for (let col = 0; col < files; col++) {
      const square = squareFor(row, col);
      const name = squareNameOf(square, files);
      const piece = bySquare.get(square);
      const isTarget = targetSet.has(square);
      const isPromotion = promotionSet.has(square);
      const isLast = marks(lastMove, square);
      const isHint = marks(hint, square);
      const highlight = square === selected ? theme.selected : isLast ? theme.lastMove : undefined;
      const dragging = drag?.active && drag.from === square;

      cells.push(
        <button
          key={square}
          type="button"
          role="gridcell"
          data-square={name}
          data-target={isTarget || undefined}
          data-promotion={isPromotion || undefined}
          data-last-move={isLast || undefined}
          data-check={square === checkSquare || undefined}
          data-hint={isHint || undefined}
          aria-label={describeSquare(name, piece ?? null)}
          aria-selected={square === selected}
          onPointerDown={(e) => startDrag(square, e)}
          onClick={() => onSquareClick?.(square)}
          className="relative min-h-0 min-w-0 select-none focus-visible:z-10 focus-visible:outline-3 focus-visible:outline-secondary"
          style={points ? undefined : { background: theme.board }}
        >
          {highlight && <span className={mark} style={{ background: highlight }} />}
          {hovered === square && <span className={cx(mark, 'border-4')} style={{ borderColor: theme.selected }} />}
          {isHint && <span className={cx(mark, 'animate-pulse border-4 border-gold bg-gold/25')} />}
          {square === checkSquare && (
            <span
              className="absolute inset-0"
              style={{ background: `radial-gradient(circle, ${theme.check} 0%, ${theme.check} 35%, transparent 75%)` }}
            />
          )}
          {showCoordinates && col === 0 && (
            <span
              className="absolute left-0.5 top-0 text-[clamp(8px,2.2vw,12px)] font-bold leading-none"
              style={{ color: theme.coordinate }}
            >
              {name.slice(1)}
            </span>
          )}
          {showCoordinates && row === ranks - 1 && (
            <span
              className="absolute bottom-0 right-0.5 text-[clamp(8px,2.2vw,12px)] font-bold leading-none"
              style={{ color: theme.coordinate }}
            >
              {name[0]}
            </span>
          )}
          {piece && (
            <span
              key={slide?.to === square ? slide.key : 'still'}
              data-piece={pieceCode(piece)}
              data-animating={slide?.to === square || undefined}
              className={cx('absolute inset-[4%]', dragging && 'opacity-30', slide?.to === square && 'piece-slide z-10')}
              style={
                slide?.to === square
                  ? ({ '--dx': `${slide.dx * 108.7}%`, '--dy': `${slide.dy * 108.7}%` } as React.CSSProperties)
                  : undefined
              }
            >
              {renderPiece(piece, 'h-full w-full drop-shadow-sm')}
            </span>
          )}
          {isTarget &&
            (piece && !isPromotion ? (
              <span className="absolute inset-[6%] rounded-full border-[6px]" style={{ borderColor: theme.hint }} />
            ) : (
              <span
                className="absolute left-1/2 top-1/2 h-[28%] w-[28%] -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{ background: theme.hint }}
              />
            ))}
          {isPromotion && (
            <span
              aria-hidden
              className="absolute right-[5%] top-[5%] h-[30%] w-[30%] rounded-full border-[3px]"
              style={{ borderColor: theme.hint, background: theme.board }}
            />
          )}
        </button>,
      );
    }
  }

  return (
    <>
      <div
        ref={boardRef}
        role="grid"
        aria-label={label}
        data-orientation={orientation}
        data-files={files}
        data-ranks={ranks}
        data-grid={grid}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={() => setDrag(null)}
        className={cx(
          points
            ? 'relative grid w-full touch-none rounded-lg border-4 shadow-lg'
            : 'relative grid w-full touch-none gap-px rounded-lg border-4 p-px shadow-lg',
          className,
        )}
        style={{
          background: points ? theme.board : theme.line,
          borderColor: theme.line,
          aspectRatio: `${files} / ${ranks}`,
          gridTemplateColumns: `repeat(${files}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${ranks}, minmax(0, 1fr))`,
        }}
      >
        {/* Before the cells so they paint over it; positioned for the same reason as the overlay below. */}
        {underlay && (
          <div aria-hidden data-underlay className="pointer-events-none absolute inset-0">
            {underlay}
          </div>
        )}
        {cells}
        {/* Positioned, not a grid item: as a grid item it takes part in row sizing and collapses the squares. */}
        {overlay && (
          <div aria-hidden data-overlay className="pointer-events-none absolute inset-px">
            {overlay}
          </div>
        )}
      </div>
      {drag?.active && (
        <div
          aria-hidden
          className="pointer-events-none fixed z-50"
          style={{ left: drag.x - drag.size / 2, top: drag.y - drag.size / 2, width: drag.size, height: drag.size }}
        >
          {renderPiece(drag.piece, 'h-full w-full drop-shadow-xl')}
        </div>
      )}
    </>
  );
}
