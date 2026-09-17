// @vitest-environment happy-dom
import type { Piece } from '@chaturanga/rules-core';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Board, type BoardHandle } from './Board';
import { HandTray } from './HandTray';
import type { BoardTheme } from './theme';

const theme: BoardTheme = {
  board: 'rgb(1, 1, 1)',
  line: 'rgb(2, 2, 2)',
  coordinate: 'rgb(3, 3, 3)',
  selected: 'rgb(4, 4, 4)',
  lastMove: 'rgb(5, 5, 5)',
  check: 'rgb(6, 6, 6)',
  hint: 'rgb(7, 7, 7)',
};
const renderPiece = (piece: Piece, className: string) => <i className={className} data-art={piece.type} />;
const describeSquare = (square: string, piece: Piece | null) => (piece ? `${square} ${piece.color}${piece.type}` : square);
const base = { theme, renderPiece, describeSquare, label: 'Board' };

afterEach(cleanup);

describe('Board (plat-005a)', () => {
  it('lays out an 8x8 board from White and from Black, with pieces and accessible names', () => {
    const pieces = [{ square: 4, piece: { color: 'w', type: 'k', promoted: false } as Piece }];
    const white = render(<Board {...base} pieces={pieces} />);
    const cells = white.getAllByRole('gridcell');
    expect(cells).toHaveLength(64);
    expect(cells[0]!.dataset.square).toBe('a8');
    expect(cells[63]!.dataset.square).toBe('h1');
    expect(white.getByLabelText('e1 wk').querySelector('[data-piece="wk"] [data-art="k"]')).not.toBeNull();
    cleanup();
    const black = render(<Board {...base} pieces={pieces} orientation="b" />);
    expect(black.getAllByRole('gridcell')[0]!.dataset.square).toBe('h1');
  });

  it('draws boards of other sizes', () => {
    const view = render(<Board {...base} pieces={[]} files={9} ranks={9} />);
    const cells = view.getAllByRole('gridcell');
    expect(cells).toHaveLength(81);
    expect(cells[0]!.dataset.square).toBe('a9');
    expect(cells[80]!.dataset.square).toBe('i1');
    expect(view.getByRole('grid').style.aspectRatio).toBe('9 / 9');
  });

  it('draws a points grid: one cell per intersection, named like squares, from Red and from Black (plat-009)', () => {
    const pieces = [{ square: 4, piece: { color: 'w', type: 'k', promoted: false } as Piece }];
    const red = render(<Board {...base} pieces={pieces} files={9} ranks={10} grid="points" />);
    const board = red.getByRole('grid');
    const cells = red.getAllByRole('gridcell');
    expect(cells).toHaveLength(90);
    expect(cells[0]!.dataset.square).toBe('a10');
    expect(cells[89]!.dataset.square).toBe('i1');
    expect(board.dataset.grid).toBe('points');
    expect(board.style.aspectRatio).toBe('9 / 10');
    // One plain surface: no grid gap or line-coloured background between cells, no per-cell fill.
    expect(board.className).not.toContain('gap-px');
    expect(board.style.background).toBe(theme.board);
    expect(cells[0]!.style.background).toBe('');
    expect(red.getByLabelText('e1 wk').querySelector('[data-piece="wk"]')).not.toBeNull();
    cleanup();
    const black = render(<Board {...base} pieces={pieces} files={9} ranks={10} grid="points" orientation="b" />);
    const flipped = black.getAllByRole('gridcell');
    expect(flipped[0]!.dataset.square).toBe('i1');
    expect(flipped[89]!.dataset.square).toBe('a10');
  });

  it('draws the underlay under the cells, and marks points with discs (plat-009)', () => {
    const lines = <svg data-testid="lines" />;
    const view = render(
      <Board {...base} pieces={[]} files={9} ranks={10} grid="points" underlay={lines} selected={4} lastMove={{ from: 13, to: 22 }} />,
    );
    const underlay = view.container.querySelector('[data-underlay]') as HTMLElement;
    expect(underlay.querySelector('[data-testid="lines"]')).toBeTruthy();
    expect(underlay.className).toContain('pointer-events-none');
    // First child of the board, so every cell paints over it.
    expect(view.getByRole('grid').firstElementChild).toBe(underlay);
    const selected = view.container.querySelector('[data-square="e1"] span') as HTMLElement;
    expect(selected.className).toContain('rounded-full');
    expect(view.getAllByRole('gridcell')).toHaveLength(90);
  });

  it('keeps the squares board unchanged when no grid is given (plat-009)', () => {
    const view = render(<Board {...base} pieces={[]} selected={4} />);
    const board = view.getByRole('grid');
    expect(board.dataset.grid).toBe('squares');
    expect(board.className).toContain('gap-px');
    expect(board.style.background).toBe(theme.line);
    expect(view.container.querySelector('[data-underlay]')).toBeNull();
    expect((view.container.querySelector('[data-square="e1"] span') as HTMLElement).className).toBe('absolute inset-0');
  });

  it('draws an overlay over the board without collapsing the squares', () => {
    const marking = <svg data-testid="marking" />;
    const view = render(<Board {...base} pieces={[]} overlay={marking} />);
    const overlay = view.container.querySelector('[data-overlay]') as HTMLElement;
    expect(overlay).toBeTruthy();
    expect(overlay.querySelector('[data-testid="marking"]')).toBeTruthy();
    // It must not be a grid item: as one it takes part in row sizing and flattens every square.
    expect(overlay.style.gridArea).toBe('');
    expect(overlay.className).toContain('absolute');
    expect(overlay.className).toContain('pointer-events-none');
    expect(view.getAllByRole('gridcell')).toHaveLength(64);
  });

  it('has no overlay element when no markings are passed', () => {
    const view = render(<Board {...base} pieces={[]} />);
    expect(view.container.querySelector('[data-overlay]')).toBeNull();
  });

  it('marks a drop as the last move without a from square, plus targets, promotions, check and hint', () => {
    const view = render(
      <Board
        {...base}
        pieces={[]}
        lastMove={{ to: 0 }}
        targets={[8, 9]}
        promotionTargets={[9]}
        checkSquare={10}
        hint={{ from: null, to: 11 }}
      />,
    );
    const cell = (name: string) => view.container.querySelector(`[data-square="${name}"]`) as HTMLElement;
    expect(view.container.querySelectorAll('[data-last-move]')).toHaveLength(1);
    expect(cell('a1').dataset.lastMove).toBe('true');
    expect(cell('a2').dataset.target).toBe('true');
    expect(cell('a2').dataset.promotion).toBeUndefined();
    expect(cell('b2').dataset.promotion).toBe('true');
    expect(cell('c2').dataset.check).toBe('true');
    expect(view.container.querySelectorAll('[data-hint]')).toHaveLength(1);
  });

  it('reports square taps and maps viewport points to squares through its handle', () => {
    const onSquareClick = vi.fn();
    const handle = createRef<BoardHandle>();
    const view = render(<Board {...base} pieces={[]} onSquareClick={onSquareClick} handle={handle} />);
    fireEvent.click(view.container.querySelector('[data-square="e4"]')!);
    expect(onSquareClick).toHaveBeenCalledWith(28);
    view.getByRole('grid').getBoundingClientRect = () => ({ left: 0, top: 0, width: 800, height: 800 }) as DOMRect;
    expect(handle.current!.squareAt(450, 450)).toBe(28); // column e (400–500px), fifth row from the top = rank 4
    expect(handle.current!.squareAt(450, 350)).toBe(36); // one row up = e5
    expect(handle.current!.squareAt(-5, 10)).toBeNull();
  });
});

describe('HandTray (plat-005a)', () => {
  it('groups pieces by type with counts, and selects only selectable types', () => {
    const onSelect = vi.fn();
    const view = render(
      <HandTray
        color="w"
        pieces={['k', 's', 's', 'f', 'r', 'r', 'n', 'n']}
        theme={theme}
        renderPiece={renderPiece}
        label="White hand"
        describePiece={(type, count) => `${type} x${count}`}
        selected="r"
        canSelect={(type) => type !== 'k'}
        onSelect={onSelect}
      />,
    );
    const buttons = view.getAllByRole('button');
    expect(buttons.map((b) => [b.dataset.handPiece, b.dataset.count])).toEqual([
      ['k', '1'],
      ['s', '2'],
      ['f', '1'],
      ['r', '2'],
      ['n', '2'],
    ]);
    expect(view.getByLabelText('r x2').getAttribute('aria-pressed')).toBe('true');
    expect((view.getByLabelText('k x1') as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(view.getByLabelText('n x2'));
    expect(onSelect).toHaveBeenCalledWith('n');
  });
});
