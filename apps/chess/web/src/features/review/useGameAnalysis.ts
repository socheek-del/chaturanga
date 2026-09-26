import { chess } from '@chaturanga/chess';
import { useEffect, useMemo, useState } from 'react';
import { loadEvals, saveEval } from '../../stores/analysis';
import type { SavedGame } from '../../stores/history';
import { type GameReview, reviewGame, terminalEval } from './analysis';
import { type PositionEval, UciEngine, workerTransport } from './engine';
import { loadOpeningBook } from './openings';

export type AnalysisState =
  | { status: 'loading' }
  | { status: 'running'; done: number; total: number }
  | { status: 'done'; review: GameReview }
  | { status: 'error' };

/** Every position of the game, before each move and after the last. */
export function positionsOf(game: Pick<SavedGame, 'startFen' | 'moves'>): string[] {
  const board = chess.createGame(game.startFen);
  const fens = [board.fen()];
  for (const m of game.moves) fens.push(board.move(m).fenAfter);
  return fens;
}

/**
 * Analyses a saved game with Stockfish, position by position, saving each result so a review that is left
 * and reopened carries on where it stopped (ch-015). A finished analysis is labelled straight from storage.
 */
export function useGameAnalysis(game: SavedGame | undefined): AnalysisState {
  const [state, setState] = useState<AnalysisState>({ status: 'loading' });
  const key = game ? `${game.id}:${game.moves.join(' ')}` : '';
  const fens = useMemo(() => (game ? positionsOf(game) : []), [key]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!game) return;
    let cancelled = false;
    let engine: UciEngine | null = null;
    setState({ status: 'loading' });

    (async () => {
      const book = await loadOpeningBook();
      const evals = loadEvals(game.id, fens);
      // Ended positions are the rules' to judge, not the engine's.
      const board = chess.createGame(game.startFen);
      fens.forEach((_, i) => {
        if (i > 0) board.move(game.moves[i - 1]!);
        if (i === fens.length - 1) evals[i] ??= terminalEval(board);
      });
      const missing = evals.flatMap((e, i) => (e ? [] : [i]));
      if (missing.length > 0) {
        engine = new UciEngine(workerTransport());
        await engine.newGame();
        let done = fens.length - missing.length;
        if (!cancelled) setState({ status: 'running', done, total: fens.length });
        for (const i of missing) {
          if (cancelled) return;
          const evaluation = await engine.analyse(fens[i]!);
          if (cancelled) return;
          evals[i] = evaluation;
          saveEval(game.id, evaluation);
          setState({ status: 'running', done: ++done, total: fens.length });
        }
      }
      if (cancelled) return;
      setState({
        status: 'done',
        review: reviewGame({ startFen: game.startFen, moves: game.moves, evals: evals as PositionEval[], book }),
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
