import { recordSession, seats } from '@chaturanga/game-shell';
import { useGameHistory } from './history';
import { useComputerMatch, useComputerSession, useLocalSession } from './localSession';

let started = false;

/**
 * Saves every pass-and-play game and every game against the computer as it is played (review-001). The
 * guided first game is a lesson and is not saved.
 */
export function startRecording(): void {
  if (started) return;
  started = true;
  recordSession(useGameHistory, useLocalSession, 'local', () => ({ players: { w: { kind: 'side' }, b: { kind: 'side' } }, you: null }));
  recordSession(useGameHistory, useComputerSession, 'computer', () => {
    const { level, humanColor } = useComputerMatch.getState();
    return { players: seats(humanColor, { kind: 'you' }, { kind: 'bot', level }), you: humanColor };
  });
}
