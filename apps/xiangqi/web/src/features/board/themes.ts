import type { BoardTheme as SharedBoardTheme } from '@chaturanga/board-ui';

export interface BoardTheme extends SharedBoardTheme {
  id: 'maple' | 'xuan' | 'night';
  /** The river text and point marks. */
  river: string;
}

/**
 * Board looks. Maple (枫木) is the default: pale wood with dark lines, like a club set. Xuan (宣纸) is ink
 * on paper. Night (墨夜) is a dark board for dark mode.
 */
export const BOARD_THEMES: readonly BoardTheme[] = [
  {
    id: 'maple',
    board: '#e7c58a',
    line: '#5a3a1c',
    river: '#6b4a2b',
    coordinate: '#6b4a2b',
    selected: 'rgba(179, 65, 42, 0.38)',
    lastMove: 'rgba(42, 38, 34, 0.2)',
    check: 'rgba(165, 29, 60, 0.6)',
    hint: 'rgba(42, 38, 34, 0.5)',
  },
  {
    id: 'xuan',
    board: '#f2e9d5',
    line: '#2a2622',
    river: '#3d3630',
    coordinate: '#5e554a',
    selected: 'rgba(179, 65, 42, 0.32)',
    lastMove: 'rgba(42, 38, 34, 0.16)',
    check: 'rgba(165, 29, 60, 0.55)',
    hint: 'rgba(42, 38, 34, 0.45)',
  },
  {
    id: 'night',
    board: '#2b2520',
    line: '#c9b48d',
    river: '#b39f7c',
    coordinate: '#a8977a',
    selected: 'rgba(229, 119, 95, 0.4)',
    lastMove: 'rgba(239, 230, 212, 0.16)',
    check: 'rgba(240, 124, 150, 0.6)',
    hint: 'rgba(239, 230, 212, 0.55)',
  },
];

export function boardTheme(id: string): BoardTheme {
  return BOARD_THEMES.find((theme) => theme.id === id) ?? BOARD_THEMES[0]!;
}
