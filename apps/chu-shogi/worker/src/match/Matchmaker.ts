import { MatchmakerBase } from '@chaturanga/server-kit';
import type { Env } from '../env';

/** Quick-match queues create private rooms in Chu Shogi's GAME_ROOM namespace. */
export class Matchmaker extends MatchmakerBase<Env> {}
