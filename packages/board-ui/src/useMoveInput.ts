import type { Square } from '@chaturanga/rules-core';
import { useMemo, useState } from 'react';
import { type ParsedMove, parseUci } from './coords';

/** Anything that lists its legal moves in coordinate notation (every rules-core VariantGame does). */
export interface MoveSource {
  readonly turn?: string;
  activePlayers?(): readonly string[];
  legalUci(): string[];
  legalUciFor?(color: string): string[];
  pieceAt?(square: Square): { color: string } | null;
}

export interface MoveInputOptions {
  game: MoveSource;
  /** Store version; selection resets whenever the position changes. */
  version: number;
  /** False while it is not this user's turn or the game is over. */
  canMove: boolean;
  /** Called with the chosen legal move in coordinate notation. */
  onMove: (uci: string, color?: string) => void;
  /** Active seats available to this input surface. Defaults to every seat active in the game. */
  players?: readonly string[];
  /** Board width in files (default 8). */
  files?: number;
}

/** One way a pending move can be played: as it is, or promoting to a named piece. */
export interface PromotionChoice {
  uci: string;
  /** The move's promotion suffix (`+`, `q`, `m`, …), or null for the move played without promoting. */
  promotion: string | null;
}

export interface RouteChoice {
  uci: string;
  path: Square[];
}

export interface MoveInput {
  /** Selected board square. */
  selected: Square | null;
  /**
   * A move the player started that has more than one way to be played, waiting for the choice: promote or
   * not (Shogi), or which piece to promote to (chess). Games where promotion is automatic (Makruk) or a
   * move of its own (Sittuyin) never set it.
   */
  pendingPromotion: { from: Square; to: Square; choices: PromotionChoice[] } | null;
  /** Plays one of the pending choices by its move string; does nothing when nothing is pending. */
  choosePromotion: (uci: string) => void;
  /** Drops the pending move without playing it. */
  cancelPromotion: () => void;
  /** Same endpoints with different legal paths (e.g. a Shatra multi-capture). */
  pendingRoute: { from: Square; to: Square; choices: RouteChoice[] } | null;
  chooseRoute: (uci: string) => void;
  cancelRoute: () => void;
  /** Selected piece type in the acting seat's hand. */
  selectedHand: string | null;
  selectedHandColor: string | null;
  /** Squares the selection can move or be placed to. */
  targets: Square[];
  /** Targets reachable only by promoting, plus the selected square when it can promote in place. */
  promotionTargets: Square[];
  canPromoteInPlace: boolean;
  canDrag: (square: Square) => boolean;
  canSelectHand: (type: string, color?: string) => boolean;
  onSquareClick: (square: Square) => void;
  onHandSelect: (type: string, color?: string) => void;
  /** Returns true if from→to was a legal move and was played. */
  onDrop: (from: Square, to: Square) => boolean;
  /** Returns true if placing `type` on `to` was legal and was played. */
  onDropFromHand: (type: string, to: Square, color?: string) => boolean;
  /** Plays the selected piece's in-place promotion; returns false when there is none. */
  promoteInPlace: () => boolean;
}

type Selection = { version: number } & ({ kind: 'square'; square: Square } | { kind: 'hand'; type: string; color: string });
type Pending = { version: number; from: Square; to: Square; color?: string; choices: PromotionChoice[] };
type PendingRoute = { version: number; from: Square; to: Square; color?: string; choices: RouteChoice[] };
type TaggedMove = ParsedMove & { color?: string };
type BoardMove = Extract<TaggedMove, { kind: 'move' }>;
type DropMove = Extract<TaggedMove, { kind: 'drop' }>;

const unique = (squares: Square[]) => [...new Set(squares)];

/** Tap-tap and drag-and-drop move entry, including drops from hand and promotions, backed by the engine's legal moves. */
export function useMoveInput({ game, version, canMove, onMove, players, files = 8 }: MoveInputOptions): MoveInput {
  const [selection, setSelection] = useState<Selection | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [routePending, setRoutePending] = useState<PendingRoute | null>(null);
  const legal = useMemo<TaggedMove[]>(() => {
    if (!canMove) return [];
    const actorAware = !!players || !!game.activePlayers || !!game.legalUciFor;
    const actors = players ?? game.activePlayers?.() ?? [game.turn ?? ''];
    return actors.flatMap((color) => {
      const moves = game.legalUciFor?.(color) ?? (game.turn === undefined || game.turn === color ? game.legalUci() : []);
      return moves.flatMap((uci) => {
        const parsed = parseUci(uci, files);
        return parsed ? [{ ...parsed, color: actorAware ? color : game.turn }] : [];
      });
    });
  }, [game, version, canMove, files, players]); // eslint-disable-line react-hooks/exhaustive-deps
  const submit = (uci: string, color?: string) => {
    if (color && (players || game.activePlayers || game.legalUciFor)) onMove(uci, color);
    else onMove(uci);
  };
  // A pass is written as a move onto the same square (Janggi's `e2e2`). It is never played by touching the
  // board, where dropping a piece back on its square means changing one's mind: the product offers a button.
  const boardMoves = legal.filter((m): m is BoardMove => m.kind === 'move' && (m.from !== m.to || m.promotion !== null));
  const drops = legal.filter((m): m is DropMove => m.kind === 'drop');

  const current = selection && selection.version === version ? selection : null;
  const pendingPromotion =
    pending && pending.version === version ? { from: pending.from, to: pending.to, choices: pending.choices } : null;
  const pendingRoute = routePending && routePending.version === version
    ? { from: routePending.from, to: routePending.to, choices: routePending.choices }
    : null;
  const selected = current?.kind === 'square' ? current.square : null;
  const selectedHand = current?.kind === 'hand' ? current.type : null;
  const selectedHandColor = current?.kind === 'hand' ? current.color : null;

  const selectedPieceColor = selected === null ? null : game.pieceAt?.(selected)?.color ?? null;
  const fromSelected = selected === null ? [] : boardMoves.filter((m) => m.from === selected && (!selectedPieceColor || m.color === selectedPieceColor));
  const inPlace = fromSelected.find((m) => m.promotion && m.from === m.to);
  const targets =
    selectedHand !== null
      ? drops.filter((m) => m.type === selectedHand && m.color === selectedHandColor).map((m) => m.to)
      : unique(fromSelected.filter((m) => m.to !== m.from).map((m) => m.to));
  const promotionTargets = unique([
    ...fromSelected
      .filter((m) => m.promotion && m.to !== m.from && !fromSelected.some((o) => !o.promotion && o.to === m.to))
      .map((m) => m.to),
    ...(inPlace ? [inPlace.from] : []),
  ]);

  const canDrag = (square: Square) => boardMoves.some((m) => m.from === square);
  const canSelectHand = (type: string, color?: string) => drops.some((m) => m.type === type && (color === undefined || m.color === color));

  const play = (from: Square, to: Square): boolean => {
    const pieceColor = game.pieceAt?.(from)?.color;
    const candidates = boardMoves.filter((m) => m.from === from && m.to === to && (!pieceColor || m.color === pieceColor));
    if (candidates.length === 0) return false;
    setSelection(null);
    // Distinct full routes must be chosen before promotion: a Chu Shogi route can also offer a promotion.
    if (candidates.length > 1) {
      const paths = new Set(candidates.map((candidate) => candidate.path.join(',')));
      if (paths.size > 1) {
        setPending(null);
        setRoutePending({ version, from, to, color: candidates[0]!.color, choices: candidates.map(({ uci, path }) => ({ uci, path })) });
        return true;
      }
      const promotions = new Set(candidates.map((candidate) => candidate.promotion));
      if (promotions.size > 1) {
        setRoutePending(null);
        setPending({ version, from, to, color: candidates[0]!.color, choices: candidates.map(({ uci, promotion }) => ({ uci, promotion })) });
      } else {
        setPending(null);
        setRoutePending({ version, from, to, color: candidates[0]!.color, choices: candidates.map(({ uci, path }) => ({ uci, path })) });
      }
      return true;
    }
    setPending(null);
    setRoutePending(null);
    submit(candidates[0]!.uci, candidates[0]!.color);
    return true;
  };

  const choosePromotion = (uci: string) => {
    if (!pendingPromotion || !pending) return;
    const choice = pendingPromotion.choices.find((c) => c.uci === uci);
    setPending(null);
    if (choice) submit(choice.uci, pending.color);
  };

  const cancelPromotion = () => setPending(null);
  const chooseRoute = (uci: string) => {
    if (!pendingRoute || !routePending) return;
    const choice = pendingRoute.choices.find((candidate) => candidate.uci === uci);
    setRoutePending(null);
    if (choice) submit(choice.uci, routePending.color);
  };
  const cancelRoute = () => setRoutePending(null);

  const place = (type: string, to: Square, color?: string): boolean => {
    const move = drops.find((m) => m.type === type && m.to === to && (color === undefined || m.color === color));
    if (!move) return false;
    setSelection(null);
    submit(move.uci, move.color);
    return true;
  };

  const onSquareClick = (square: Square) => {
    if (!canMove || pendingPromotion || pendingRoute) return;
    if (selectedHand !== null) {
      if (place(selectedHand, square, selectedHandColor ?? undefined)) return;
    } else if (selected !== null) {
      if (square === selected) return setSelection(null);
      if (play(selected, square)) return;
    }
    setSelection(canDrag(square) ? { version, kind: 'square', square } : null);
  };

  const onHandSelect = (type: string, color?: string) => {
    if (!canMove || pendingPromotion || pendingRoute) return;
    const actor = color ?? players?.[0] ?? game.activePlayers?.()[0] ?? game.turn ?? '';
    setSelection(selectedHand === type && selectedHandColor === actor || !canSelectHand(type, actor) ? null : { version, kind: 'hand', type, color: actor });
  };

  const promoteInPlace = () => {
    if (!inPlace) return false;
    setSelection(null);
    submit(inPlace.uci, inPlace.color);
    return true;
  };

  return {
    selected,
    selectedHand,
    selectedHandColor,
    pendingPromotion,
    choosePromotion,
    cancelPromotion,
    pendingRoute,
    chooseRoute,
    cancelRoute,
    targets,
    promotionTargets,
    canPromoteInPlace: !!inPlace,
    canDrag,
    canSelectHand,
    onSquareClick,
    onHandSelect,
    onDrop: play,
    onDropFromHand: place,
    promoteInPlace,
  };
}
