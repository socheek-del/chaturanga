// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { LessonPlayer } from '@chaturanga/game-shell/ui';
import { suffragetto } from '@chaturanga/suffragetto';
import '../i18n';
import { ALL_LESSONS } from './lessons';

afterEach(() => cleanup());

it('teaches an exchange with selectable legal actions in the lesson footer', () => {
  const lesson = ALL_LESSONS.find(({ id }) => id === 'exchange')!;
  const exchange = lesson.steps.find((step) => step.kind === 'move')!;
  const { getByTestId } = render(<LessonPlayer
    variant={suffragetto}
    lesson={{ ...lesson, steps: [exchange] }}
    onExit={() => {}}
    onFinish={() => {}}
    translate={(text) => text.en ?? ''}
    theme={{ board: 'transparent', line: '#b9ad9b', coordinate: '#777d75', selected: '#c19758', lastMove: '#ddd', check: '#a33f35', hint: '#547c69' }}
    renderPiece={() => <span />}
    boardLabel="Suffragetto board"
    describeSquare={(square) => square}
    describeAction={(uci) => uci}
  />);

  expect(getByTestId('lesson-actions-legal').querySelectorAll('[data-testid="lesson-action"]').length).toBeGreaterThan(0);
  fireEvent.click(screen.getByRole('button', { name: 'X11@b1' }));
  expect(screen.getByText('The matched pieces return automatically. The exchange uses one turn.')).toBeTruthy();
});
