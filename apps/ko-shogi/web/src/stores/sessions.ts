import { Game, koShogi } from '@chaturanga/ko-shogi';
import { storageKey } from '@chaturanga/game-shell';
import type { Color } from '@chaturanga/rules-core';
import { PRODUCT } from '../../product.config';

export type GameMode = 'bot' | 'local';

export interface SavedSession {
  version: 1;
  mode: GameMode;
  humanColor: Color;
  level: number;
  startFen: string;
  moves: string[];
  savedAt: number;
}

const ACTIVE_SESSION_KEY = storageKey(PRODUCT, 'session.active');

export function newSession(mode: GameMode, humanColor: Color, level: number): SavedSession {
  return { version: 1, mode, humanColor, level, startFen: koShogi.startFen, moves: [], savedAt: Date.now() };
}

export function sessionGame(session: SavedSession): Game {
  return Game.replay(session.startFen, session.moves);
}

export function readSavedSession(): SavedSession | null {
  try {
    const serialized = localStorage.getItem(ACTIVE_SESSION_KEY);
    if (!serialized) return null;
    const value: unknown = JSON.parse(serialized);
    if (!value || typeof value !== 'object') return null;
    const session = value as Partial<SavedSession>;
    if (session.version !== 1 || (session.mode !== 'bot' && session.mode !== 'local')
      || (session.humanColor !== 'w' && session.humanColor !== 'b')
      || !Number.isInteger(session.level) || !session.startFen || !Array.isArray(session.moves)
      || !session.moves.every((move) => typeof move === 'string')) return null;
    return session as SavedSession;
  } catch {
    return null;
  }
}

export function saveSession(session: SavedSession): void {
  try {
    localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify({ ...session, savedAt: Date.now() }));
  } catch {
    // Private browsing may deny storage. The current in-memory game remains playable.
  }
}

export function clearSavedSession(): void {
  try { localStorage.removeItem(ACTIVE_SESSION_KEY); } catch { /* Storage can be unavailable in a private tab. */ }
}

export function gameRoute(session: SavedSession): string {
  return `/game/${session.mode}/${session.humanColor}/${session.level}`;
}
