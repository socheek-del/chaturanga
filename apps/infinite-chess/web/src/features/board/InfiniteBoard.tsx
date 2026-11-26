import { ArrowDown, ArrowUp, LocateFixed, Minus, Plus, Scan } from 'lucide-react';
import { type FormEvent, type PointerEvent as ReactPointerEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { canonicalSquare, pointOf } from '@chaturanga/infinite-chess/core';
import type { Game } from '@chaturanga/infinite-chess';

interface Camera { x: bigint; y: bigint; dx: number; dy: number }
interface Tile { square: string; x: bigint; y: bigint; left: number; top: number; piece: ReturnType<Game['pieceAt']> }

interface InfiniteBoardProps {
  game: Game;
  version: number;
  inputEnabled: boolean;
  onMove: (uci: string) => boolean;
  className?: string;
  coordinateEntry?: boolean;
}

const GLYPHS = {
  w: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' },
  b: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' },
} as const;
const BASE_PITCH = 56;
const MIN_ZOOM = 0.62;
const MAX_ZOOM = 1.6;

function displayCoordinate(value: bigint): string {
  const raw = value.toString();
  return raw.length > 8 ? `${raw.slice(0, 3)}…${raw.slice(-3)}` : raw;
}

function translate(camera: Camera, deltaX: number, deltaY: number, pitch: number): Camera {
  let dx = camera.dx + deltaX;
  let dy = camera.dy + deltaY;
  const shiftX = Math.trunc(dx / pitch);
  const shiftY = Math.trunc(dy / pitch);
  dx -= shiftX * pitch;
  dy -= shiftY * pitch;
  return { x: camera.x - BigInt(shiftX), y: camera.y + BigInt(shiftY), dx, dy };
}

function getMoveParts(uci: string): { from: string; to: string; promotion: string } | null {
  const match = /^(-?\d+,-?\d+)>(-?\d+,-?\d+)([qrbn]?)$/.exec(uci);
  return match ? { from: match[1]!, to: match[2]!, promotion: match[3]! } : null;
}

export function InfiniteBoard({ game, version, inputEnabled, onMove, className = '', coordinateEntry = true }: InfiniteBoardProps) {
  const { t } = useTranslation();
  const viewport = useRef<HTMLDivElement>(null);
  const drag = useRef<{ pointerId: number; x: number; y: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const [size, setSize] = useState({ width: 640, height: 640 });
  const [camera, setCamera] = useState<Camera>({ x: 4n, y: 4n, dx: 0, dy: 0 });
  const [zoom, setZoom] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  const [promotion, setPromotion] = useState<string[]>([]);
  const [targetX, setTargetX] = useState('');
  const [targetY, setTargetY] = useState('');
  const revisionedPosition = useMemo(() => ({ game, version }), [game, version]);
  const pitch = BASE_PITCH * zoom;
  const previous = game.lastMove();

  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const update = () => setSize({ width: element.clientWidth || 640, height: element.clientHeight || 640 });
    update();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
    observer?.observe(element);
    window.addEventListener('resize', update);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  const tiles = useMemo<Tile[]>(() => {
    const columns = Math.min(36, Math.ceil(size.width / pitch / 2) + 2);
    const rows = Math.min(36, Math.ceil(size.height / pitch / 2) + 2);
    const result: Tile[] = [];
    for (let row = rows; row >= -rows; row--) {
      const y = camera.y + BigInt(row);
      for (let column = -columns; column <= columns; column++) {
        const x = camera.x + BigInt(column);
        const square = `${x},${y}`;
        result.push({
          square, x, y,
          left: size.width / 2 + column * pitch + camera.dx - pitch / 2,
          top: size.height / 2 - row * pitch + camera.dy - pitch / 2,
          piece: revisionedPosition.game.pieceAt(square),
        });
      }
    }
    return result;
  }, [camera, pitch, revisionedPosition, size]);

  const visibleSquares = useMemo(() => tiles.map(({ square }) => square), [tiles]);
  const legalByTarget = useMemo(() => {
    const result = new Map<string, string[]>();
    if (!inputEnabled || !selected) return result;
    for (const uci of revisionedPosition.game.legalUciIn(visibleSquares)) {
      const parts = getMoveParts(uci);
      if (!parts || parts.from !== selected) continue;
      const choices = result.get(parts.to) ?? [];
      choices.push(uci);
      result.set(parts.to, choices);
    }
    return result;
  }, [inputEnabled, revisionedPosition, selected, visibleSquares]);

  const centerOn = (square: string) => {
    const point = pointOf(square);
    setCamera({ x: point.x, y: point.y, dx: 0, dy: 0 });
  };

  const submitMove = (uci: string) => {
    if (!onMove(uci)) return false;
    const parts = getMoveParts(uci);
    if (parts) centerOn(parts.to);
    setSelected(null);
    setPromotion([]);
    setTargetX('');
    setTargetY('');
    return true;
  };

  const chooseSquare = (square: string) => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    if (!inputEnabled) return;
    const moves = selected ? legalByTarget.get(square) ?? [] : [];
    if (moves.length > 1) {
      setPromotion(moves);
      return;
    }
    if (moves.length === 1) {
      submitMove(moves[0]!);
      return;
    }
    const piece = game.pieceAt(square);
    if (piece?.color === game.turn) {
      setSelected(square);
      setTargetX('');
      setTargetY('');
      setPromotion([]);
    } else {
      setSelected(null);
      setPromotion([]);
    }
  };

  const goToCoordinate = (event: FormEvent) => {
    event.preventDefault();
    if (!selected) return;
    const square = canonicalSquare(`${targetX.trim()},${targetY.trim()}`);
    if (!square) return;
    const moves = game.legalUciIn([square]).filter((uci) => getMoveParts(uci)?.from === selected);
    if (moves.length > 1) setPromotion(moves);
    else if (moves[0]) submitMove(moves[0]);
  };

  const pointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    suppressClick.current = false;
    drag.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
    const captureTarget = event.target instanceof HTMLElement ? event.target : event.currentTarget;
    captureTarget.setPointerCapture(event.pointerId);
  };

  const pointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const active = drag.current;
    if (!active || active.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - active.x;
    const deltaY = event.clientY - active.y;
    if (!active.moved && Math.hypot(deltaX, deltaY) > 5) active.moved = true;
    if (!active.moved) return;
    suppressClick.current = true;
    active.x = event.clientX;
    active.y = event.clientY;
    setCamera((current) => translate(current, deltaX, deltaY, pitch));
  };

  const pointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (drag.current?.pointerId === event.pointerId) {
      const moved = drag.current.moved;
      drag.current = null;
      if (moved) window.setTimeout(() => { suppressClick.current = false; }, 250);
    }
  };

  const adjustZoom = (amount: number) => setZoom((current) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.round((current + amount) * 100) / 100)));
  const recenter = () => {
    const target = typeof previous?.to === 'string' ? previous.to : '4,4';
    centerOn(target);
  };

  return (
    <section className={`plane-frame ${className}`} aria-label={t('board.region')} data-position-version={revisionedPosition.version}>
      <div className="plane-toolbar">
        <div className="plane-readout">
          <span className="plane-live-dot" />
          <span>{t('board.center')}</span>
          <code>{camera.x.toString()}, {camera.y.toString()}</code>
        </div>
        <div className="plane-tools" aria-label={t('board.viewControls')}>
          <button type="button" className="icon-button" aria-label={t('board.zoomOut')} onClick={() => adjustZoom(-0.12)}><Minus size={16} aria-hidden /></button>
          <span className="zoom-readout">{Math.round(zoom * 100)}%</span>
          <button type="button" className="icon-button" aria-label={t('board.zoomIn')} onClick={() => adjustZoom(0.12)}><Plus size={16} aria-hidden /></button>
          <button type="button" className="icon-button" aria-label={t('board.recenter')} onClick={recenter}><LocateFixed size={16} aria-hidden /></button>
        </div>
      </div>
      <div
        ref={viewport}
        className="plane-viewport"
        data-testid="infinite-board"
        role="grid"
        aria-label={t('board.grid')}
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={pointerUp}
        onPointerCancel={pointerUp}
      >
        <div className="plane-crosshair" aria-hidden="true" />
        {tiles.map((tile) => {
          const { square, x, y, left, top, piece } = tile;
          const moves = legalByTarget.get(square) ?? [];
          const selectedSquare = selected === square;
          const lastMove = previous ? getMoveParts(previous.uci) : null;
          const lastMoveSquare = lastMove?.from === square || previous?.to === square;
          const dark = ((x + y) & 1n) === 0n;
          const coordinateLabel = x === camera.x - BigInt(Math.min(36, Math.ceil(size.width / pitch / 2) + 2))
            ? `${displayCoordinate(x)},${displayCoordinate(y)}`
            : y === camera.y - BigInt(Math.min(36, Math.ceil(size.height / pitch / 2) + 2)) ? displayCoordinate(x) : '';
          const label = piece
            ? t('board.pieceAt', { piece: t(`pieces.${piece.type}`), color: t(`colors.${piece.color}`), square: `${x},${y}` })
            : t('board.square', { square: `${x},${y}` });
          return (
            <button
              type="button"
              key={square}
              role="gridcell"
              data-square={square}
              aria-label={label}
              aria-selected={selectedSquare}
              className={`plane-square${dark ? ' plane-square-dark' : ''}${selectedSquare ? ' is-selected' : ''}${moves.length ? ' is-legal' : ''}${lastMoveSquare ? ' is-last' : ''}`}
              style={{ left, top, width: pitch, height: pitch }}
              onClick={() => chooseSquare(square)}
            >
              {coordinateLabel && <span className="square-coordinate" aria-hidden="true">{coordinateLabel}</span>}
              {moves.length > 0 && <span className={`destination-mark${game.pieceAt(square) !== null ? ' is-capture' : ''}`} aria-hidden="true" />}
              {piece && <span className={`chess-piece piece-${piece.color}`} aria-hidden="true">{GLYPHS[piece.color][piece.type]}</span>}
            </button>
          );
        })}
        <div className="plane-axis plane-axis-x" aria-hidden="true"><ArrowDown size={13} /><span>{t('board.axisX')}</span></div>
        <div className="plane-axis plane-axis-y" aria-hidden="true"><ArrowUp size={13} /><span>{t('board.axisY')}</span></div>
        {promotion.length > 0 && (
          <div className="promotion-picker" role="dialog" aria-label={t('board.choosePromotion')}>
            <p>{t('board.choosePromotion')}</p>
            <div>
              {promotion.map((uci) => {
                const piece = uci.slice(-1);
                const color = game.turn;
                return <button type="button" key={uci} aria-label={t('board.promoteTo', { piece: t(`pieces.${piece}`) })} onClick={() => submitMove(uci)}>{GLYPHS[color][piece as 'q' | 'r' | 'b' | 'n']}</button>;
              })}
            </div>
            <button className="promotion-cancel" type="button" onClick={() => setPromotion([])}>{t('actions.cancel')}</button>
          </div>
        )}
        {!inputEnabled && <div className="plane-disabled" aria-hidden="true" />}
      </div>
      <div className="plane-footer">
        <span className="pan-hint"><Scan size={13} aria-hidden />{t('board.panHint')}</span>
        {coordinateEntry && (
          <form className="coordinate-form" onSubmit={goToCoordinate}>
            <label htmlFor="target-x">{t('board.target')}</label>
            <input id="target-x" aria-label={t('board.xCoordinate')} inputMode="numeric" value={targetX} onChange={(event) => setTargetX(event.target.value)} placeholder={t('board.xPlaceholder')} disabled={!selected || !inputEnabled} />
            <span aria-hidden="true">,</span>
            <input aria-label={t('board.yCoordinate')} inputMode="numeric" value={targetY} onChange={(event) => setTargetY(event.target.value)} placeholder={t('board.yPlaceholder')} disabled={!selected || !inputEnabled} />
            <button type="submit" aria-label={t('board.goToTarget')} disabled={!selected || !inputEnabled || !targetX || !targetY}><LocateFixed size={15} aria-hidden /></button>
          </form>
        )}
      </div>
    </section>
  );
}
