import { PgnError, START_FEN } from '@chaturanga/chess';
import type { TFunction } from 'i18next';
import { describe, expect, it } from 'vitest';
import type { SavedGame } from '../../stores/history';
import { importPgn, outcomeOf, playerName, savedGameToPgn } from './savedGame';

const t = ((key: string) => key) as unknown as TFunction;

const base: SavedGame = {
  id: 'computer-1',
  mode: 'computer',
  createdAt: new Date(2026, 8, 26, 12).getTime(),
  updatedAt: 0,
  startFen: START_FEN,
  moves: ['f2f3', 'e7e5', 'g2g4', 'd8h4'],
  result: { winner: 'b', reason: 'checkmate' },
  players: { w: { kind: 'you' }, b: { kind: 'bot', level: 3 } },
  you: 'w',
  timeControl: { initialMs: 300_000, incrementMs: 2_000 },
};

describe('saved games (ch-014)', () => {
  it('names players by role in the site language', () => {
    expect(playerName(t, { kind: 'you' }, 'w')).toBe('computer.you');
    expect(playerName(t, { kind: 'bot', level: 3 }, 'b')).toBe('bots.bishop.name');
    expect(playerName(t, { kind: 'side' }, 'b')).toBe('colors.b');
    expect(playerName(t, { kind: 'name', name: 'Tal' }, 'w')).toBe('Tal');
  });

  it('reads the outcome from the viewer side when there is one', () => {
    expect(outcomeOf(base)).toBe('lost');
    expect(outcomeOf({ ...base, you: 'b' })).toBe('won');
    expect(outcomeOf({ ...base, you: null })).toBe('blackWins');
    expect(outcomeOf({ ...base, result: { winner: null, reason: 'stalemate' } })).toBe('draw');
    expect(outcomeOf({ ...base, result: null })).toBe('unfinished');
  });

  it('exports tags, clock and termination, and never a site address', () => {
    const pgn = savedGameToPgn(base, t);
    expect(pgn).toContain('[Event "games.event.computer"]');
    expect(pgn).toContain('[Site "?"]');
    expect(pgn).toContain('[Date "2026.09.26"]');
    expect(pgn).toContain('[White "computer.you"]');
    expect(pgn).toContain('[Result "0-1"]');
    expect(pgn).toContain('[TimeControl "300+2"]');
    expect(pgn).toContain('[Termination "play.reason.checkmate"]');
    expect(pgn).toContain('1. f3 e5 2. g4 Qh4# 0-1');
  });

  it('imports a PGN, taking the result from the board first and the Result tag second', () => {
    const mate = importPgn('1. f3 e5 2. g4 Qh4#', 5);
    expect(mate.result).toEqual({ winner: 'b', reason: 'checkmate' });
    expect(mate.players).toEqual({ w: { kind: 'side' }, b: { kind: 'side' } });
    expect(mate.id).toBe('imported-5');

    const resigned = importPgn('[White "A"]\n[Black "B"]\n[Result "1-0"]\n\n1. e4 e5 1-0', 6);
    expect(resigned.result).toEqual({ winner: 'w', reason: 'resign' });
    expect(resigned.players.w).toEqual({ kind: 'name', name: 'A' });
    expect(importPgn('1. e4 e5 1/2-1/2', 7).result).toEqual({ winner: null, reason: 'agreement' });
    expect(importPgn('1. e4 e5 *', 8).result).toBeNull();
    // Its own tags go back out on export.
    expect(savedGameToPgn(resigned, t)).toContain('[White "A"]');
  });

  it('refuses text that is not a game', () => {
    expect(() => importPgn('not a game', 1)).toThrow(PgnError);
  });
});
