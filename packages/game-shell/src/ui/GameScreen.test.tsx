// @vitest-environment happy-dom
import { makruk } from '@chaturanga/makruk';
import type { Piece } from '@chaturanga/rules-core';
import { sittuyin } from '@chaturanga/sittuyin';
import { cleanup, fireEvent, render, type RenderResult } from '@testing-library/react';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { createGameSession } from '../session';
import { GameScreen, undoAllowed } from './GameScreen';

// The shared screen reads its words through i18next; the keys are the contract (KEYS.md), not the text.
const KEYS = {
  'colors.w': 'White',
  'colors.b': 'Black',
  'play.turn': '{{color}} to move',
  'play.placing': '{{color}} places a piece',
  'play.check': 'Check',
  'play.promote': 'Promote',
  'play.captured': 'Captured',
  'play.clockOf': "{{color}}'s clock",
  'play.moves': 'Moves',
  'play.noMoves': 'No moves yet',
  'play.first': 'First',
  'play.back': 'Back',
  'play.forward': 'Forward',
  'play.last': 'Last',
  'play.flip': 'Flip',
  'play.undo': 'Undo',
  'play.resign': 'Resign',
  'play.backToLive': 'Back to live',
  'play.newGame': 'New game',
  'play.rematch': 'Rematch',
  'play.review': 'Review',
  'play.cancel': 'Cancel',
  'play.resignConfirm': 'Resign for {{color}}?',
  'play.result.whiteWins': 'White wins',
  'play.result.blackWins': 'Black wins',
  'play.result.draw': 'Draw',
  'play.reason.checkmate': 'Checkmate',
};

const theme = {
  board: 'rgb(1, 1, 1)',
  line: 'rgb(2, 2, 2)',
  coordinate: 'rgb(3, 3, 3)',
  selected: 'rgb(4, 4, 4)',
  lastMove: 'rgb(5, 5, 5)',
  check: 'rgb(6, 6, 6)',
  hint: 'rgb(7, 7, 7)',
};

const renderPiece = (piece: Piece, className: string) => <i className={className} data-art={`${piece.color}${piece.type}`} />;

const identity = {
  theme,
  showCoordinates: false,
  renderPiece,
  boardLabel: 'Board',
  describeSquare: (square: string, piece: Piece | null) => (piece ? `${square} ${piece.color}${piece.type}` : square),
  pieceValues: { k: 0, r: 5, n: 3, s: 2.5, m: 2, f: 2, p: 1 },
};

const play = {
  title: 'Game',
  orientation: 'w' as const,
  names: { w: 'You', b: 'Opponent' },
  inputEnabled: true,
  canUndo: false,
  onUndo: () => {},
  resignColor: 'w' as const,
  onRematch: () => {},
};

beforeAll(async () => {
  await i18n.use(initReactI18next).init({
    lng: 'en',
    resources: { en: { translation: Object.fromEntries(Object.entries(KEYS).map(([k, v]) => [k, v])) } },
    keySeparator: false,
    nsSeparator: false,
    interpolation: { escapeValue: false },
  });
});

afterEach(cleanup);

const square = (view: RenderResult, name: string) => view.container.querySelector(`[data-square="${name}"]`) as HTMLElement;

describe('GameScreen with Makruk', () => {
  it('shows both players, the turn banner and an empty move list, then plays a tapped move', () => {
    const useSession = createGameSession(makruk);
    useSession.getState().start(null);
    const view = render(<GameScreen {...play} {...identity} variant={makruk} useSession={useSession} />);

    expect(view.getByTestId('player-w').textContent).toContain('You');
    expect(view.getByTestId('player-b').textContent).toContain('Opponent');
    expect(view.getByTestId('turn-banner').textContent).toBe('White to move');
    expect(view.getByText('No moves yet')).toBeTruthy();
    // No clock was set, so no timer is shown.
    expect(view.queryByRole('timer')).toBeNull();

    fireEvent.click(square(view, 'e3'));
    fireEvent.click(square(view, 'e4'));
    expect(useSession.getState().game.moves().map((m) => m.uci)).toEqual(['e3e4']);
    expect(view.getByTestId('turn-banner').textContent).toBe('Black to move');
    expect(view.getByTestId('move-list').textContent).toContain('e4');
  });

  it('asks for a sound once per move and once when the game ends', () => {
    const onSound = vi.fn();
    const useSession = createGameSession(makruk);
    // White mates in one with Rh1-h8.
    useSession.getState().start(null, 'k7/2R5/8/8/8/8/8/4K2R w - - 0 1');
    const view = render(<GameScreen {...play} {...identity} variant={makruk} useSession={useSession} onSound={onSound} />);

    fireEvent.click(square(view, 'h1'));
    fireEvent.click(square(view, 'h8'));
    expect(onSound).toHaveBeenCalledTimes(1);
    expect(onSound).toHaveBeenCalledWith('gameEnd');
    expect(view.getByTestId('turn-banner').textContent).toBe('White wins');
    expect(view.getByTestId('result-reason').textContent).toBe('Checkmate');
  });

  it('reviews history and returns to the live game', () => {
    const useSession = createGameSession(makruk);
    useSession.getState().start(null);
    useSession.getState().move('e3e4');
    useSession.getState().move('d6d5');
    const view = render(<GameScreen {...play} {...identity} variant={makruk} useSession={useSession} />);

    fireEvent.click(view.getByLabelText('Back'));
    expect(useSession.getState().viewPly).toBe(1);
    fireEvent.click(view.getByText('Back to live'));
    expect(useSession.getState().viewPly).toBeNull();
  });

  it('resigns only after the confirmation is accepted', () => {
    const useSession = createGameSession(makruk);
    useSession.getState().start(null);
    const view = render(<GameScreen {...play} {...identity} variant={makruk} useSession={useSession} />);

    fireEvent.click(view.getByLabelText('Resign'));
    fireEvent.click(view.getByText('Cancel'));
    expect(useSession.getState().result).toBeNull();

    fireEvent.click(view.getByLabelText('Resign'));
    fireEvent.click(view.getByTestId('confirm-resign'));
    expect(useSession.getState().result).toEqual({ winner: 'b', reason: 'resign' });
  });

  it('shows no hand tray for a variant without hands', () => {
    const useSession = createGameSession(makruk);
    useSession.getState().start(null);
    const view = render(<GameScreen {...play} {...identity} variant={makruk} useSession={useSession} />);
    expect(view.container.querySelector('[data-hand]')).toBeNull();
  });
});

describe('GameScreen board options (plat-009)', () => {
  it('draws squares with a square aspect by default', () => {
    const useSession = createGameSession(makruk);
    useSession.getState().start(null);
    const view = render(<GameScreen {...play} {...identity} variant={makruk} useSession={useSession} />);
    expect(view.getByRole('grid').dataset.grid).toBe('squares');
    expect(view.container.querySelector('[data-underlay]')).toBeNull();
    const column = view.getByRole('grid').closest('[style*="--board-aspect"]') as HTMLElement;
    expect(column.style.getPropertyValue('--board-aspect')).toBe('1');
  });

  it('passes a points grid and an underlay through to the board', () => {
    const useSession = createGameSession(makruk);
    useSession.getState().start(null);
    const view = render(
      <GameScreen
        {...play}
        {...identity}
        variant={makruk}
        useSession={useSession}
        boardGrid="points"
        boardUnderlay={<svg data-testid="lines" />}
      />,
    );
    expect(view.getByRole('grid').dataset.grid).toBe('points');
    expect(view.container.querySelector('[data-underlay] [data-testid="lines"]')).not.toBeNull();
  });
});

describe('GameScreen with Sittuyin', () => {
  const sittuyinProps = {
    ...play,
    ...identity,
    variant: sittuyin,
    handLabel: (color: string) => `${color} hand`,
    describeHandPiece: (type: string, count: number) => `${type} x${count}`,
  };

  it('places a piece from hand during the setup phase', () => {
    const useSession = createGameSession(sittuyin);
    useSession.getState().start(null);
    const view = render(<GameScreen {...sittuyinProps} useSession={useSession} />);

    expect(view.getByTestId('turn-banner').textContent).toBe('White places a piece');
    const hands = view.container.querySelectorAll('[data-hand]');
    expect(hands.length).toBe(2);

    const before = useSession.getState().game.hand('w').length;
    const king = view.container.querySelector('[data-hand="w"] [data-hand-piece="k"]') as HTMLElement;
    fireEvent.click(king);
    const target = useSession.getState().game.legalUci().find((uci) => uci.startsWith('K@'))!;
    fireEvent.click(square(view, target.slice(2)));

    expect(useSession.getState().game.hand('w').length).toBe(before - 1);
    expect(useSession.getState().game.moves().map((m) => m.uci)).toEqual([target]);
  });

  it('offers a promote action when a piece can promote in place', () => {
    const useSession = createGameSession(sittuyin);
    // The four Sit-mies box the Ne in, so its only promotion is the in-place one (movegen.test.ts).
    useSession.getState().start(null, '4k3/8/2N1N3/3P4/2N1N3/8/P7/4K3[] w - - 0 1');
    const view = render(<GameScreen {...sittuyinProps} useSession={useSession} />);

    expect(view.queryByTestId('promote-in-place')).toBeNull();
    fireEvent.click(square(view, 'd5'));
    fireEvent.click(view.getByTestId('promote-in-place'));
    expect(useSession.getState().game.moves().map((m) => m.uci)).toEqual(['d5d5f']);
  });
});

describe('undoAllowed', () => {
  const game = (plies: number) => ({ moves: () => Array.from({ length: plies }, () => ({})) });

  it('needs a move to take back', () => {
    expect(undoAllowed({ game: game(0), result: null })).toBe(false);
    expect(undoAllowed({ game: game(1), result: null })).toBe(true);
  });

  it('refuses endings that come from outside the position', () => {
    expect(undoAllowed({ game: game(4), result: { winner: 'w', reason: 'checkmate' } })).toBe(true);
    expect(undoAllowed({ game: game(4), result: { winner: null, reason: 'fifty-move' } })).toBe(true);
    expect(undoAllowed({ game: game(4), result: { winner: 'b', reason: 'timeout' } })).toBe(false);
    expect(undoAllowed({ game: game(4), result: { winner: 'b', reason: 'resign' } })).toBe(false);
  });
});
