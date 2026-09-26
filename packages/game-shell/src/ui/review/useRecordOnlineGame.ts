import { useEffect } from 'react';
import type { StoreApi } from 'zustand';
import { createRecorder, type HistoryStore } from '../../review/history';
import { seats } from '../../review/recording';
import type { OnlineSessionState } from '../../online/session';

/**
 * Saves an online game from this player's side while its room is open, under `online-<room code>`;
 * spectators save nothing (ch-014, plat-017).
 */
export function useRecordOnlineGame(history: HistoryStore, session: StoreApi<OnlineSessionState>, code: string): void {
  useEffect(() => {
    const record = createRecorder({
      mode: 'online',
      store: history,
      idFor: () => onlineGameId(code),
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
  }, [history, session, code]);
}

/** The saved-game id of an online room. */
export const onlineGameId = (code: string) => `online-${code}`;
