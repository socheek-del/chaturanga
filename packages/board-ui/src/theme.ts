/** Colours the board and hand trays paint with. Each product defines its own themes. */
export interface BoardTheme {
  board: string;
  line: string;
  coordinate: string;
  selected: string;
  lastMove: string;
  check: string;
  /** Legal-target dots and rings, and promotion markers. */
  hint: string;
  /** Attack-map tint of squares the viewing side attacks; a translucent green by default (plat-015). */
  attackOwn?: string;
  /** Attack-map tint of squares the other side attacks; a translucent red by default. */
  attackEnemy?: string;
}

export const DEFAULT_ATTACK_OWN = 'rgba(22, 163, 74, 0.38)';
export const DEFAULT_ATTACK_ENEMY = 'rgba(220, 38, 38, 0.38)';
