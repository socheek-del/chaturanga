import { describe, expect, it } from 'vitest';
import { capturedBy } from './result';

describe('capturedBy', () => {
  it('returns every piece in a multi-capture route without duplicating the first', () => {
    const first = { type: 'p' };
    const second = { type: 'z' };
    const third = { type: 'e' };
    expect(
      capturedBy(
        [
          { color: 'w', captured: first, captures: [first, second] },
          { color: 'b', captured: third },
        ],
        'w',
      ),
    ).toEqual([first, second]);
  });

  it('keeps supporting the single-capture records used by older variants', () => {
    const captured = { type: 'p' };
    expect(capturedBy([{ color: 'w', captured }, { color: 'b', captured }], 'w')).toEqual([captured]);
  });
});
