import { Game } from '@chaturanga/makruk';
import { describe, expect, it } from 'vitest';
import { formatAdvantage, formatClock, soundForMove } from './format';

describe('formatAdvantage', () => {
  it('rounds fractional material values and suppresses floating-point noise', () => {
    expect(formatAdvantage(1.5)).toBe('+1.5');
    expect(formatAdvantage(1.25)).toBe('+1.3');
    expect(formatAdvantage(8.881784197001252e-16)).toBeNull();
    expect(formatAdvantage(0)).toBeNull();
  });
});

describe('formatClock', () => {
  it('formats minutes and tenths', () => {
    expect(formatClock(600_000)).toBe('10:00');
    expect(formatClock(61_500)).toBe('1:02');
    expect(formatClock(10_000)).toBe('0:10');
    expect(formatClock(9_450)).toBe('9.4');
    expect(formatClock(-5)).toBe('0.0');
  });
});

describe('soundForMove', () => {
  it('chooses move, capture, check and game-end sounds from the move', () => {
    const game = new Game('4k3/8/8/3p4/8/8/8/R2MK3 w - - 0 1');
    expect(soundForMove(game.move('a1a2'), game.status())).toBe('move');

    const check = new Game('4k3/8/8/8/8/8/8/R3K3 w - - 0 1');
    expect(soundForMove(check.move('a1a8'), check.status())).toBe('check');

    // The extra White Ruea keeps mating material after the capture (K+Ma vs K alone would end the game).
    const capture = new Game('4k3/8/8/3r4/8/2N5/8/4K2R w - - 0 1');
    expect(soundForMove(capture.move('c3d5'), capture.status())).toBe('capture');

    const mate = new Game('k7/2R5/8/8/8/8/8/4K2R w - - 0 1');
    expect(soundForMove(mate.move('h1h8'), mate.status())).toBe('gameEnd');
  });
});
