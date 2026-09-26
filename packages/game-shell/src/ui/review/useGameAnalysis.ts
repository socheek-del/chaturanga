import type { Variant, VariantGame } from '@chaturanga/rules-core';
import { useEffect, useMemo, useState } from 'react';
import { type GameReview, reviewGame, terminalEval } from '../../review/analysis';
import type { PositionEval, UciEngine } from '../../review/engine';
import type { SavedGame } from '../../review/history';
import type { ReviewKit } from '../../review/kit';

export type AnalysisState =
  | { status: 'loading' }
  | { status: 'running'; done: number; total: number }
  | { status: 'done'; review: GameReview }
  | { status: 'error' };

/** Every position of the game, before each move and after the last. */
export function positionsOf(variant: Variant, game: Pick<SavedGame, 'startFen' | 'moves'>): string[] {
  const board = variant.createGame(game.startFen);
  const fens = [board.fen()];
  for (const m of game.moves) fens.push(board.move(m).fenAfter);
  return fens;
}

/**
 * Analyses a saved game with the product's engine, position by position, saving each result so a review
 * that is left and reopened carries on where it stopped (ch-015, plat-017). A finished analysis is labelled
 * straight from storage, without starting the engine.
 */
export function useGameAnalysis<G extends VariantGame>(kit: ReviewKit<G>, game: SavedGame | undefined): AnalysisState {
  const [state, setState] = useState<AnalysisState>({ status: 'loading' });
  const { variant } = kit.rules;
  const key = game ? `${game.id}:${game.moves.join(' ')}` : '';
  const fens = useMemo(() => (game ? positionsOf(variant, game) : []), [key]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!game) return;
    let cancelled = false;
    let engine: UciEngine | null = null;
    setState({ status: 'loading' });

    (async () => {
      const book = kit.loadBook ? await kit.loadBook() : null;
      const evals = kit.analysis.load(game.id, fens);
      // An ended position is the rules' to judge, not the engine's.
      const board = variant.createGame(game.startFen);
      for (const m of game.moves) board.move(m);
      evals[fens.length - 1] ??= terminalEval(board);
      const missing = evals.flatMap((e, i) => (e ? [] : [i]));
      if (missing.length > 0) {
        engine = kit.createEngine();
        await engine.newGame();
        let done = fens.length - missing.length;
        if (!cancelled) setState({ status: 'running', done, total: fens.length });
        for (const i of missing) {
          if (cancelled) return;
          const evaluation = await engine.analyse(fens[i]!);
          if (cancelled) return;
          evals[i] = evaluation;
          kit.analysis.save(game.id, evaluation);
          setState({ status: 'running', done: ++done, total: fens.length });
        }
      }
      if (cancelled) return;
      setState({
        status: 'done',
        review: reviewGame({ rules: kit.rules, startFen: game.startFen, moves: game.moves, evals: evals as PositionEval[], book }),
      });
    })().catch((err: unknown) => {
      console.error(err);
      if (!cancelled) setState({ status: 'error' });
    });

    return () => {
      cancelled = true;
      engine?.terminate();
    };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  return state;
}
