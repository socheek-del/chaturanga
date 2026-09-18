import type { BoardTheme as SharedBoardTheme } from '@chaturanga/board-ui';

export interface BoardTheme extends SharedBoardTheme {
  id: 'kaya' | 'shinkaya' | 'yoru';
  /** Star points and the board's outer frame. */
  grain: string;
  /** Face of a piece tile, and the ink on it. */
  tile: string;
  tileEdge: string;
  ink: string;
  /** Ink of a promoted face, which is red on a real set. */
  promotedInk: string;
}

/**
 * Board looks. Kaya (榧) is the default: the warm yellow of a torreya board. Shinkaya (新榧) is the paler,
 * newer wood. Yoru (夜) is a dark board for dark mode.
 */
export const BOARD_THEMES: readonly BoardTheme[] = [
  {
    id: 'kaya',
    board: '#e8c176',
    line: '#4a3115',
    grain: '#a97c3c',
    coordinate: '#6b4a1f',
    tile: '#f6e2b4',
    tileEdge: '#b98d47',
    ink: '#241a0e',
    promotedInk: '#a8231f',
    selected: 'rgba(168, 35, 31, 0.32)',
    lastMove: 'rgba(36, 26, 14, 0.18)',
    check: 'rgba(165, 29, 60, 0.6)',
    hint: 'rgba(36, 26, 14, 0.5)',
  },
  {
    id: 'shinkaya',
    board: '#f0dcae',
    line: '#5b4423',
    grain: '#c2a06a',
    coordinate: '#6d5734',
    tile: '#fbf0d4',
    tileEdge: '#c9a063',
    ink: '#2b2118',
    promotedInk: '#b02a26',
    selected: 'rgba(176, 42, 38, 0.28)',
    lastMove: 'rgba(43, 33, 24, 0.16)',
    check: 'rgba(165, 29, 60, 0.55)',
    hint: 'rgba(43, 33, 24, 0.45)',
  },
  {
    id: 'yoru',
    board: '#2a2419',
    line: '#c8ad77',
    grain: '#8c7444',
    coordinate: '#b09a6e',
    tile: '#e4cf9f',
    tileEdge: '#8c7444',
    ink: '#241a0e',
    promotedInk: '#9e2420',
    selected: 'rgba(230, 140, 110, 0.38)',
    lastMove: 'rgba(240, 232, 210, 0.16)',
    check: 'rgba(240, 124, 150, 0.6)',
    hint: 'rgba(240, 232, 210, 0.55)',
  },
];

export function boardTheme(id: string): BoardTheme {
  return BOARD_THEMES.find((theme) => theme.id === id) ?? BOARD_THEMES[0]!;
}
