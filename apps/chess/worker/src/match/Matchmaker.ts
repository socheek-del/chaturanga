import { MatchmakerBase } from '@chaturanga/server-kit';
import type { Env } from '../env';

/** Quick match: the shared matchmaker, opening rooms in this product's GAME_ROOM namespace. */
export class Matchmaker extends MatchmakerBase<Env> {}
