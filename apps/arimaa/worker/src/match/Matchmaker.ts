import { MatchmakerBase } from '@chaturanga/server-kit';
import type { Env } from '../env';

/** Quick-match queues create private rooms inside Arimaa's isolated GAME_ROOM namespace. */
export class Matchmaker extends MatchmakerBase<Env> {}
