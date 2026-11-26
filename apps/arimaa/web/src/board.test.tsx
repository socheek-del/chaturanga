// @vitest-environment happy-dom
import { Game } from '@chaturanga/arimaa';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it } from 'vitest';
import i18n from './i18n';
import { ArimaaBoard } from './board';

describe('Arimaa board', () => {
  it('reflects a placement when a session mutates the same game object', () => {
    const game = new Game();
    const container = document.createElement('div');
    const root = createRoot(container);
    const renderBoard = () => act(() => root.render(createElement(I18nextProvider, { i18n }, createElement(ArimaaBoard, { game, orientation: 'w' }))));

    renderBoard();
    expect(container.querySelector('.board-square[aria-label^="a1,"] .piece-mark')).toBeNull();
    act(() => { game.move('E@a1'); });
    renderBoard();
    expect(container.querySelector('.board-square[aria-label^="a1,"] .piece-mark')).not.toBeNull();
    expect(container.querySelector('.board-square[aria-label^="a1,"]')?.getAttribute('aria-label')).toContain('Gold Elephant');

    act(() => root.unmount());
  });
});
