/**
 * Shared rules foundation for the chaturanga family of games: the Variant interface every rules
 * engine implements, and the 8x8 board, move tables and attack detection shared by Makruk and
 * Sittuyin. Pure TypeScript: no DOM, network, or timers.
 */
export * from './attacks';
export * from './board8';
export * from './clock';
export * from './coords';
export * from './errors';
export * from './result';
export type * from './types';
export type * from './variant';
