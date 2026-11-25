import { describeLessons } from '@chaturanga/game-shell/testing';
import { Game, rithmomachia } from '@chaturanga/rithmomachia';
import { describe, expect, it } from 'vitest';
import { PRODUCT } from '../../product.config';
import { ALL_LESSONS, RULE_LESSONS } from './lessons';

describeLessons(PRODUCT, rithmomachia, ALL_LESSONS);

const lessonMove = (id: string, uci: string) => {
  const lesson = ALL_LESSONS.find((candidate) => candidate.id === id)!;
  const step = lesson.steps.find((candidate) => candidate.kind === 'move' && candidate.solutions.includes(uci));
  if (!step || step.kind !== 'move') throw new Error(`Missing ${uci} exercise in ${id}`);
  const game = new Game(step.fen);
  game.move(uci);
  return game;
};

describe('Rithmomachia tutorial rule coverage', () => {
  it('assigns each selected rule to an interactive lesson', () => {
    for (const [topic, lessonId] of Object.entries(RULE_LESSONS)) {
      expect(ALL_LESSONS.some((lesson) => lesson.id === lessonId), topic).toBe(true);
    }
  });

  it('teaches that captured pieces go to the attacker’s reserve without moving the attacker', () => {
    const game = lessonMove('meeting-capture', 'c4d5');
    expect(game.pieceAt(26)).toMatchObject({ color: 'w', type: 'c16' });
    expect(game.pieceAt(35)).toBeNull();
    expect(game.hand('w')).toContain('c16');
    expect(game.moves().at(-1)?.san).toContain('○16');
    expect(game.moves().at(-1)?.san).not.toMatch(/\[[a-z]\]/);
  });

  it('applies all four arithmetic capture lessons through the real rules engine', () => {
    for (const [lesson, move, capturedType, attackerSquare] of [
      ['meeting-capture', 'c4d5', 'c16', 26],
      ['assault-capture', 'a4d4', 't30', 24],
      ['ambuscade-capture', 'd5e4', 't6', 35],
      ['siege-capture', 'd7d8', 'c9', 51],
    ] as const) {
      const game = lessonMove(lesson, move);
      expect(game.pieceAt(attackerSquare), lesson).toMatchObject({ color: 'w' });
      expect(game.hand('w'), lesson).toContain(capturedType);
    }
  });

  it('removes one named pyramid component or all components on siege', () => {
    const partial = lessonMove('pyramid-components', 'c8e8g');
    expect(partial.pieceAt(60)?.type.startsWith('p')).toBe(true);
    expect(partial.hand('w')).toContain('s64');

    const siege = lessonMove('pyramid-siege', 'd7d8z');
    expect(siege.pieceAt(59)).toBeNull();
    expect(siege.hand('w')).toHaveLength(5);
  });

  it('teaches home-rank reserve placement and selected terminal results', () => {
    const drop = lessonMove('reserves-and-drops', 'C2@a1');
    expect(drop.hand('w')).toEqual([]);
    expect(drop.pieceAt(0)).toMatchObject({ color: 'w', type: 'c2' });

    const progression = ALL_LESSONS.find(({ id }) => id === 'great-victory')!.steps[0]!;
    if (!('fen' in progression) || !progression.fen) throw new Error('Great victory lesson needs its board position');
    expect(new Game(progression.fen).status()).toEqual({ kind: 'progression', winner: 'w' });
  });
});
