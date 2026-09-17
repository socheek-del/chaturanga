import { type CSSProperties, useLayoutEffect, useRef, useState } from 'react';

/** Below Tailwind's `lg` the game screen is a single column, and the board must share the screen height. */
const SINGLE_COLUMN = '(max-width: 63.99rem)';
/** A board smaller than this is no longer playable; the page scrolls instead. */
const MIN_BOARD_PX = 160;
/** Breathing room under the last element of the column, in px. */
const BOTTOM_GAP_PX = 8;

/**
 * Board width for a single-column layout: as wide as the column allows, but no taller than the height left for
 * it. `aspect` is the board's width / height (files / ranks); 1 for a square board (plat-009).
 */
export function fittedBoardWidth(columnWidth: number, availableHeight: number, aspect = 1): number {
  return Math.floor(Math.max(MIN_BOARD_PX, Math.min(columnWidth, availableHeight * aspect)));
}

/**
 * polish-003: sizes the board so the whole column — player bars, trays, board, turn banner and actions — fits in
 * the visible screen, measured rather than guessed, so it adapts to a phone's toolbars, a long status line or a
 * tray that empties. Everything below the column (history, controls, move list) follows in normal page flow.
 *
 * `columnRef` goes on the column and `boardRef` on the board's wrapper; `style` sets the board's width (and should
 * be given to anything that should line up with it). On wide layouts `style` is empty and CSS decides.
 */
export function useFittedBoard(aspect = 1) {
  const columnRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number | null>(null);

  useLayoutEffect(() => {
    const column = columnRef.current;
    const board = boardRef.current;
    if (!column || !board || typeof window.matchMedia !== 'function') return;
    const media = window.matchMedia(SINGLE_COLUMN);

    const measure = () => {
      if (!media.matches) return setWidth(null);
      // Page coordinates, so scrolling does not change the answer.
      const top = column.getBoundingClientRect().top + window.scrollY;
      const aroundBoard = column.offsetHeight - board.offsetHeight;
      const available = window.innerHeight - top - aroundBoard - BOTTOM_GAP_PX;
      const next = fittedBoardWidth(column.clientWidth, available, aspect);
      // Resizing the board resizes the column, which re-runs this with the same result: no loop.
      setWidth((current) => (current === next ? current : next));
    };

    measure();
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null;
    observer?.observe(column);
    window.addEventListener('resize', measure);
    media.addEventListener?.('change', measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
      media.removeEventListener?.('change', measure);
    };
  }, [aspect]);

  const style: CSSProperties | undefined = width === null ? undefined : { width, maxWidth: '100%' };
  return { columnRef, boardRef, style };
}
