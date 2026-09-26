import type { Color } from '@chaturanga/chess';
import { createRecorder, type HistoryStore, type OnlineSessionState, type PlayerTag } from '@chaturanga/game-shell';
import { useEffect } from 'react';
import type { StoreApi } from 'zustand';
import { useGameHistory } from './history';
import { useComputerMatch, useComputerSession, useLocalSession } from './localSession';

/** Both seats, from the side of the player who sat on `mine`. */
const seats = (mine: Color, you: PlayerTag, them: PlayerTag): Record<Color, PlayerTag> =>
  mine === 'w' ? { w: you, b: them } : { w: them, b: you };

let started = false;

/** Saves every pass-and-play game and every game against the computer as it is played (ch-014). */
export function startRecording(store: HistoryStore = useGameHistory): void {
  if (started) return;
  started = true;

  const local = createRecorder({
    mode: 'local',
    store,
    describe: () => ({ players: { w: { kind: 'side' }, b: { kind: 'side' } }, you: null }),
  });
  const computer = createRecorder({
    mode: 'computer',
    store,
    describe: () => {
      const { level, humanColor } = useComputerMatch.getState();
      return { players: seats(humanColor, { kind: 'you' }, { kind: 'bot', level }), you: humanColor };
    },
  });

  local(useLocalSession.getState());
  computer(useComputerSession.getState());
  useLocalSession.subscribe((s) => local(s));
  useComputerSession.subscribe((s) => computer(s));
}

/** Saves an online game from this player's side while its room is open; spectators save nothing. */
export function useRecordOnlineGame(session: StoreApi<OnlineSessionState>, code: string, store: HistoryStore = useGameHistory): void {
  useEffect(() => {
    const record = createRecorder({
      mode: 'online',
      store,
      idFor: () => `online-${code}`,
      describe: () => {
        const you = session.getState().you ?? 'w';
        return { players: seats(you, { kind: 'you' }, { kind: 'opponent' }), you };
      },
    });
    const observe = (s: OnlineSessionState) => {
      if (s.you && s.snapshot && s.snapshot.status !== 'waiting') record(s);
    };
    observe(session.getState());
    return session.subscribe(observe);
  }, [session, code, store]);
}
