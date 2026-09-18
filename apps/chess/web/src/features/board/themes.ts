import type { BoardTheme as SharedBoardTheme } from '@chaturanga/board-ui';

export interface BoardTheme extends SharedBoardTheme {
  id: 'marble' | 'olive' | 'night';
  /** The lighter squares of the chequer. */
  light: string;
  /** The darker squares of the chequer. */
  dark: string;
  /** Body of a light piece and the line drawn around it. */
  whitePiece: string;
  whiteEdge: string;
  /** Body of a dark piece and the line drawn around it. */
  blackPiece: string;
  blackEdge: string;
}

/**
 * Board looks for the "Marble" identity (ch-004). Marble is the default: cool stone squares with a brass
 * accent. Olive is a warmer, quieter board. Night is the dark-mode board. None of them is the bright green
 * of the big chess sites, and none is a sibling game's wood.
 */
export const BOARD_THEMES: readonly BoardTheme[] = [
  {
    id: 'marble',
    board: 'transparent',
    light: '#eeeae2',
    dark: '#8c9aa6',
    line: '#4a5660',
    coordinate: '#5c6873',
    whitePiece: '#fbf9f4',
    whiteEdge: '#3c454d',
    blackPiece: '#333b42',
    blackEdge: '#11161a',
    selected: 'rgba(191, 137, 47, 0.42)',
    lastMove: 'rgba(191, 137, 47, 0.26)',
    check: 'rgba(178, 46, 58, 0.58)',
    hint: 'rgba(60, 69, 77, 0.5)',
  },
  {
    id: 'olive',
    board: 'transparent',
    light: '#f3ecd9',
    dark: '#9aa273',
    line: '#4e5238',
    coordinate: '#5f6442',
    whitePiece: '#fdf8e9',
    whiteEdge: '#41452f',
    blackPiece: '#3a3d2c',
    blackEdge: '#16180f',
    selected: 'rgba(176, 124, 40, 0.42)',
    lastMove: 'rgba(176, 124, 40, 0.26)',
    check: 'rgba(168, 45, 45, 0.55)',
    hint: 'rgba(65, 69, 47, 0.5)',
  },
  {
    id: 'night',
    board: 'transparent',
    light: '#4a555f',
    dark: '#28313a',
    line: '#7f8d99',
    coordinate: '#9aa7b2',
    whitePiece: '#e7e2d6',
    whiteEdge: '#171c21',
    blackPiece: '#2b333a',
    blackEdge: '#0a0d10',
    selected: 'rgba(214, 164, 74, 0.45)',
    lastMove: 'rgba(214, 164, 74, 0.28)',
    check: 'rgba(224, 96, 110, 0.6)',
    hint: 'rgba(226, 232, 238, 0.5)',
  },
];

export function boardTheme(id: string): BoardTheme {
  return BOARD_THEMES.find((theme) => theme.id === id) ?? BOARD_THEMES[0]!;
}
