import type { BoardTheme as SharedBoardTheme } from '@chaturanga/board-ui';

export interface BoardTheme extends SharedBoardTheme {
  id: 'ginkgo' | 'hanji' | 'night';
  /** The crosses on the cannon and soldier points. */
  mark: string;
}

/**
 * Board looks. Ginkgo (은행나무) is the default: the warm yellow wood of a good Janggi board. Hanji (한지) is
 * ink on mulberry paper. Night (밤) is a dark board for dark mode.
 */
export const BOARD_THEMES: readonly BoardTheme[] = [
  {
    id: 'ginkgo',
    board: '#e9c77b',
    line: '#4f3a17',
    mark: '#7a5a22',
    coordinate: '#6b4f1f',
    selected: 'rgba(31, 78, 140, 0.36)',
    lastMove: 'rgba(31, 60, 100, 0.2)',
    check: 'rgba(190, 30, 45, 0.6)',
    hint: 'rgba(31, 60, 100, 0.55)',
  },
  {
    id: 'hanji',
    board: '#f4eee0',
    line: '#2d3340',
    mark: '#4a5263',
    coordinate: '#5b6272',
    selected: 'rgba(31, 78, 140, 0.28)',
    lastMove: 'rgba(31, 60, 100, 0.15)',
    check: 'rgba(190, 30, 45, 0.5)',
    hint: 'rgba(31, 60, 100, 0.45)',
  },
  {
    id: 'night',
    board: '#1f2733',
    line: '#93a5bd',
    mark: '#b6c3d6',
    coordinate: '#93a5bd',
    selected: 'rgba(110, 168, 240, 0.4)',
    lastMove: 'rgba(200, 220, 245, 0.16)',
    check: 'rgba(245, 110, 120, 0.6)',
    hint: 'rgba(200, 220, 245, 0.55)',
  },
];

export function boardTheme(id: string): BoardTheme {
  return BOARD_THEMES.find((theme) => theme.id === id) ?? BOARD_THEMES[0]!;
}
