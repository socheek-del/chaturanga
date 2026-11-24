// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import '../i18n';
import { App } from './App';

describe('Three-player chess app', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeAll(() => {
    Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { configurable: true, value: true });
  });

  beforeEach(() => {
    localStorage.clear();
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    localStorage.clear();
  });

  it('explains the hex game and opens a 91-cell board', async () => {
    await act(async () => root.render(<App />));
    expect(container.textContent).toContain('A game for three');

    const play = [...container.querySelectorAll('button')].find((button) => button.textContent?.includes('Set the board'));
    expect(play).toBeDefined();
    await act(async () => play!.click());
    expect(container.querySelectorAll('[role="gridcell"]').length).toBe(91);
  });

  it('advances the turn after a legal move and saves the position', async () => {
    await act(async () => root.render(<App />));
    const play = [...container.querySelectorAll('button')].find((button) => button.textContent?.includes('Set the board'));
    await act(async () => play!.click());

    const d10 = container.querySelector<HTMLButtonElement>('[data-testid="cell-d10"]')!;
    const d9 = container.querySelector<HTMLButtonElement>('[data-testid="cell-d9"]')!;
    await act(async () => d10.click());
    await act(async () => d9.click());

    expect(container.querySelector('.turn-pill')?.textContent).toContain('Black to move');
    const saved = JSON.parse(localStorage.getItem('threechess:hex:v1')!);
    expect(saved.fen).toContain(' b - - -');
    expect(saved.moves).toEqual(['d10d9']);
  });
});
