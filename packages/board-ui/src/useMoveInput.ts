import type { Square } from '@chaturanga/rules-core';
import { useMemo, useState } from 'react';
import { type ParsedMove, parseUci } from './coords';

/** Anything that lists its legal moves in coordinate notation (every rules-core VariantGame does). */
export interface MoveSource {
  legalUci(): string[];
}

export interface MoveInputOptions {
  game: MoveSource;
  /** Store version; selection resets whenever the position changes. */
  version: number;
  /** False while it is not this user's turn or the game is over. */
  canMove: boolean;
  /** Called with the chosen legal move in coordinate notation. */
  onMove: (uci: string) => void;
  /** Board width in files (default 8). */
  files?: number;
}

export interface MoveInput {
  /** Selected board square. */
  selected: Square | null;
  /**
   * A move the player started that can be played promoted or unpromoted, waiting for the choice. Games
   * where promotion is automatic (Makruk) or a move of its own (Sittuyin) never set it.
   */
  pendingPromotion: { from: Square; to: Square } | null;
  /** Plays the pending move, promoted or not; does nothing when nothing is pending. */
  choosePromotion: (promote: boolean) => void;
  /** Drops the pending move without playing it. */
  cancelPromotion: () => void;
  /** Selected piece type in the side-to-move's hand. */
  selectedHand: string | null;
  /** Squares the selection can move or be placed to. */
  targets: Square[];
  /** Targets reachable only by promoting, plus the selected square when it can promote in place. */
  promotionTargets: Square[];
  canPromoteInPlace: boolean;
  canDrag: (square: Square) => boolean;
  canSelectHand: (type: string) => boolean;
  onSquareClick: (square: Square) => void;
  onHandSelect: (type: string) => void;
  /** Returns true if from→to was a legal move and was played. */
  onDrop: (from: Square, to: Square) => boolean;
  /** Returns true if placing `type` on `to` was legal and was played. */
  onDropFromHand: (type: string, to: Square) => boolean;
  /** Plays the selected piece's in-place promotion; returns false when there is none. */
  promoteInPlace: () => boolean;
}

type Selection = { version: number } & ({ kind: 'square'; square: Square } | { kind: 'hand'; type: string });
type Pending = { version: number; from: Square; to: Square };
type BoardMove = Extract<ParsedMove, { kind: 'move' }>;
type DropMove = Extract<ParsedMove, { kind: 'drop' }>;

const unique = (squares: Square[]) => [...new Set(squares)];

/** Tap-tap and drag-and-drop move entry, including drops from hand and promotions, backed by the engine's legal moves. */
export function useMoveInput({ game, version, canMove, onMove, files = 8 }: MoveInputOptions): MoveInput {
  const [selection, setSelection] = useState<Selection | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const legal = useMemo(
    () => (canMove ? game.legalUci().flatMap((uci) => parseUci(uci, files) ?? []) : []),
    [game, version, canMove, files], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const boardMoves = legal.filter((m): m is BoardMove => m.kind === 'move');
  const drops = legal.filter((m): m is DropMove => m.kind === 'drop');

  const current = selection && selection.version === version ? selection : null;
  const pendingPromotion = pending && pending.version === version ? { from: pending.from, to: pending.to } : null;
  const selected = current?.kind === 'square' ? current.square : null;
  const selectedHand = current?.kind === 'hand' ? current.type : null;

  const fromSelected = selected === null ? [] : boardMoves.filter((m) => m.from === selected);
  const inPlace = fromSelected.find((m) => m.promotion && m.from === m.to);
  const targets =
    selectedHand !== null
      ? drops.filter((m) => m.type === selectedHand).map((m) => m.to)
      : unique(fromSelected.filter((m) => m.to !== m.from).map((m) => m.to));
  const promotionTargets = unique([
    ...fromSelected
      .filter((m) => m.promotion && m.to !== m.from && !fromSelected.some((o) => !o.promotion && o.to === m.to))
      .map((m) => m.to),
    ...(inPlace ? [inPlace.from] : []),
  ]);

  const canDrag = (square: Square) => boardMoves.some((m) => m.from === square);
  const canSelectHand = (type: string) => drops.some((m) => m.type === type);

  const play = (from: Square, to: Square): boolean => {
    const candidates = boardMoves.filter((m) => m.from === from && m.to === to);
    if (candidates.length === 0) return false;
    const plain = candidates.find((m) => !m.promotion);
    const promoting = candidates.find((m) => m.promotion);
    setSelection(null);
    // Both on the same squares (Shogi): the player chooses, so the move waits until they do.
    if (plain && promoting) {
      setPending({ version, from, to });
      return true;
    }
    onMove((plain ?? promoting)!.uci);
    return true;
  };

  const choosePromotion = (promote: boolean) => {
    if (!pendingPromotion) return;
    const move = boardMoves.find(
      (m) => m.from === pendingPromotion.from && m.to === pendingPromotion.to && !!m.promotion === promote,
    );
    setPending(null);
    if (move) onMove(move.uci);
  };

  const cancelPromotion = () => setPending(null);

  const place = (type: string, to: Square): boolean => {
    const move = drops.find((m) => m.type === type && m.to === to);
    if (!move) return false;
    setSelection(null);
    onMove(move.uci);
    return true;
  };

  const onSquareClick = (square: Square) => {
    if (!canMove || pendingPromotion) return;
    if (selectedHand !== null) {
      if (place(selectedHand, square)) return;
    } else if (selected !== null) {
      if (square === selected) return setSelection(null);
      if (play(selected, square)) return;
    }
    setSelection(canDrag(square) ? { version, kind: 'square', square } : null);
  };

  const onHandSelect = (type: string) => {
    if (!canMove || pendingPromotion) return;
    setSelection(selectedHand === type || !canSelectHand(type) ? null : { version, kind: 'hand', type });
  };

  const promoteInPlace = () => {
    if (!inPlace) return false;
    setSelection(null);
    onMove(inPlace.uci);
    return true;
  };

  return {
    selected,
    selectedHand,
    pendingPromotion,
    choosePromotion,
    cancelPromotion,
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
