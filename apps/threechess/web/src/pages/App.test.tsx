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

  it('explains the ring game and opens a 96-square board', async () => {
    await act(async () => root.render(<App />));
    expect(container.textContent).toContain('A game for three');

    const play = [...container.querySelectorAll('button')].find((button) => button.textContent?.includes('Set the board'));
    expect(play).toBeDefined();
    await act(async () => play!.click());
    expect(container.querySelectorAll('[role="gridcell"]').length).toBe(96);
  });

  it('advances the turn after a legal move and saves the position', async () => {
    await act(async () => root.render(<App />));
    const play = [...container.querySelectorAll('button')].find((button) => button.textContent?.includes('Set the board'));
    await act(async () => play!.click());

    const e2 = container.querySelector<HTMLButtonElement>('[data-testid="cell-e2"]')!;
    const e4 = container.querySelector<HTMLButtonElement>('[data-testid="cell-e4"]')!;
    await act(async () => e2.click());
    await act(async () => e4.click());

    expect(container.querySelector('.turn-pill')?.textContent).toContain('Black to move');
    const saved = JSON.parse(localStorage.getItem('threechess:ring:v2')!);
    expect(saved.fen).toContain(' b e3 - -');
    expect(saved.moves).toEqual(['e2e4']);
  });
});
