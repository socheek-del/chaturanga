import { MatchmakerBase } from '@chaturanga/server-kit';
import type { Env } from '../env';

/** Quick-match queues create private Senterej rooms in the product's isolated namespace. */
export class Matchmaker extends MatchmakerBase<Env> {}
