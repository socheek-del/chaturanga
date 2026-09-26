import { parseUci } from '@chaturanga/board-ui';
import { chess, type Color } from '@chaturanga/chess';
import { useFocusMode } from '@chaturanga/game-shell/ui';
import { Button, buttonClasses, Card, cn, ProgressBar } from '@chaturanga/ui';
import { ChevronLeft, ChevronRight, ClipboardCopy, FlipVertical2, ListChecks, LoaderCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';
import { Board } from '../features/board/Board';
import { boardTheme } from '../features/board/themes';
import { playerName } from '../features/history/savedGame';
import { type GameReview, type Label, LABELS, type MoveReview } from '../features/review/analysis';
import { BoardMarks, EvalBar, EvalGraph, LabelBadge } from '../features/review/components';
import { useGameAnalysis } from '../features/review/useGameAnalysis';
import { type SavedGame, useGameHistory } from '../stores/history';
import { useSettings } from '../stores/settings';
import { ExportDialog } from './GamesPage';

/** The move number of a ply, counted from the game's own start (an imported position may start later). */
export function moveNumber(startFen: string, ply: number): number {
  const [, turn, , , , full] = startFen.split(' ');
  return (Number(full) || 1) + Math.floor((ply - 1 + (turn === 'b' ? 1 : 0)) / 2);
}

/** The labels a summary lists, in chess.com's order; Book and the rare ones only when they happened. */
const SUMMARY_LABELS: readonly Label[] = LABELS;

/** Review of one saved game (ch-016): a short summary first, then a walk through the moves. */
export function ReviewPage() {
  const { t } = useTranslation();
  const { gameId = '' } = useParams();
  const game = useGameHistory((s) => s.games.find((g) => g.id === gameId));
  const analysis = useGameAnalysis(game);

  if (!game) {
    return (
      <Card className="mx-auto flex max-w-xl flex-col items-center gap-3 py-10 text-center" data-testid="review-missing">
        <p className="font-semibold">{t('review.notFound')}</p>
        <Link to="/games" className={buttonClasses({ variant: 'outline' })}>
          {t('review.backToGames')}
        </Link>
      </Card>
    );
  }

  return <Review game={game} review={analysis.status === 'done' ? analysis.review : null} progress={analysis} />;
}

function Review({ game, review, progress }: { game: SavedGame; review: GameReview | null; progress: ReturnType<typeof useGameAnalysis> }) {
  const { t } = useTranslation();
  useFocusMode('game');
  const theme = boardTheme(useSettings((s) => s.boardTheme));
  const pieceSet = useSettings((s) => s.pieceSet);
  const showCoordinates = useSettings((s) => s.showCoordinates);
  const [ply, setPly] = useState(0);
  const [walking, setWalking] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [exporting, setExporting] = useState(false);
  const base: Color = game.you ?? 'w';
  const orientation: Color = flipped ? (base === 'w' ? 'b' : 'w') : base;
  const plies = game.moves.length;

  const records = useMemo(() => {
    const board = chess.createGame(game.startFen);
    return game.moves.map((m) => board.move(m));
  }, [game.startFen, game.moves]);
  const shown = useMemo(() => chess.createGame(ply === 0 ? game.startFen : records[ply - 1]!.fenAfter), [ply, records, game.startFen]);

  // Arrow keys step through the game, as on the game screen's history buttons.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (e.key === 'ArrowLeft') setPly((p) => Math.max(0, p - 1));
      if (e.key === 'ArrowRight') setPly((p) => Math.min(plies, p + 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [plies]);

  const move: MoveReview | null = review && ply > 0 ? review.moves[ply - 1]! : null;
  const last = ply > 0 ? records[ply - 1]! : null;
  // The engine's choice in the position before the shown move (or, at the start, for the first move).
  const bestUci = review ? (ply > 0 ? move!.best : review.moves[0]?.best ?? null) : null;
  const bestParsed = walking && bestUci && (!move || bestUci !== move.uci) ? parseUci(bestUci, 8) : null;
  const arrow = bestParsed?.kind === 'move' ? { from: bestParsed.from, to: bestParsed.to } : null;
  const whiteWin = review?.whiteWins[ply] ?? 50;
  const score = review?.scores[ply] ?? { cp: 0 };
  const names = { w: playerName(t, game.players.w, 'w'), b: playerName(t, game.players.b, 'b') };

  const go = (next: number) => {
    setPly(Math.max(0, Math.min(plies, next)));
    setWalking(true);
  };

  return (
    <div className="mx-auto w-full max-w-6xl lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-x-4">
      <h1 className="sr-only">{t('review.title')}</h1>
      <div className="flex flex-col gap-1.5 lg:mx-auto lg:w-full lg:max-w-[min(100%,calc(100dvh-10rem),44rem)]">
        <PlayerLine name={names[orientation === 'w' ? 'b' : 'w']} accuracy={review?.accuracy[orientation === 'w' ? 'b' : 'w'] ?? null} />
        <div className="flex items-stretch gap-1.5">
          {review ? <EvalBar whiteWin={whiteWin} score={score} orientation={orientation} /> : <div className="w-6 shrink-0" />}
          <div className="min-w-0 flex-1">
            <Board
              pieces={shown.pieces()}
              theme={theme}
              pieceSet={pieceSet}
              orientation={orientation}
              showCoordinates={showCoordinates}
              lastMove={last ? { from: last.from, to: last.to } : null}
              checkSquare={shown.checkedKingSquare()}
              overlay={
                review ? <BoardMarks orientation={orientation} arrow={arrow} badge={move && last ? { square: last.to, label: move.label } : null} /> : null
              }
            />
          </div>
        </div>
        <PlayerLine name={names[orientation]} accuracy={review?.accuracy[orientation] ?? null} />
      </div>

      <div className="mt-3 flex flex-col gap-3 lg:mt-0">
        {!review ? (
          <AnalysisProgress progress={progress} />
        ) : walking ? (
          <CoachCard move={move} review={review} number={moveNumber(game.startFen, ply)} onSummary={() => setWalking(false)} />
        ) : (
          <SummaryCard game={game} review={review} names={names} onStart={() => go(Math.max(1, ply))} />
        )}

        {review && <EvalGraph whiteWins={review.whiteWins} labels={review.moves.map((m) => m.label)} current={ply} onSelect={go} />}

        <div className="grid grid-cols-4 gap-2">
          <Button variant="outline" onClick={() => go(ply - 1)} disabled={ply === 0} aria-label={t('review.previous')} data-testid="review-prev">
            <ChevronLeft aria-hidden className="h-5 w-5" />
          </Button>
          <Button onClick={() => go(ply + 1)} disabled={ply === plies} aria-label={t('review.next')} data-testid="review-next" className="col-span-2">
            {t('review.next')}
            <ChevronRight aria-hidden className="h-5 w-5" />
          </Button>
          <Button variant="outline" onClick={() => setFlipped((f) => !f)} aria-label={t('play.flip')}>
            <FlipVertical2 aria-hidden className="h-5 w-5" />
          </Button>
        </div>

        <ReviewMoveList records={records} review={review} current={ply} onSelect={go} firstNumber={moveNumber(game.startFen, 1)} />

        <div className="flex flex-wrap gap-2">
          <Link to="/games" className={buttonClasses({ variant: 'ghost', size: 'sm' })}>
            <ListChecks aria-hidden className="h-4 w-4" />
            {t('review.backToGames')}
          </Link>
          <Button variant="ghost" size="sm" onClick={() => setExporting(true)}>
            <ClipboardCopy aria-hidden className="h-4 w-4" />
            {t('games.pgn')}
          </Button>
        </div>
        <p className="text-xs text-muted">{t('review.engineCredit')}</p>
      </div>
      <ExportDialog game={exporting ? game : null} onClose={() => setExporting(false)} />
    </div>
  );
}

function PlayerLine({ name, accuracy }: { name: string; accuracy: number | null }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between px-1 text-sm font-semibold">
      <span className="truncate">{name}</span>
      {accuracy !== null && (
        <span className="text-muted" title={t('review.accuracy')}>
          {accuracy.toFixed(1)}
        </span>
      )}
    </div>
  );
}

function AnalysisProgress({ progress }: { progress: ReturnType<typeof useGameAnalysis> }) {
  const { t } = useTranslation();
  if (progress.status === 'error') {
    return (
      <Card tone="danger" role="alert" data-testid="analysis-error">
        {t('review.error')}
      </Card>
    );
  }
  const running = progress.status === 'running' ? progress : null;
  return (
    <Card className="flex flex-col gap-3" data-testid="analysis-progress" aria-busy>
      <p className="flex items-center gap-2 font-bold">
        <LoaderCircle aria-hidden className="h-5 w-5 animate-spin text-primary" />
        {t('review.analysing')}
      </p>
      <ProgressBar value={running ? running.done / running.total : 0} label={t('review.analysing')} />
      {running && <p className="text-sm text-muted">{t('review.progress', { done: running.done, total: running.total })}</p>}
    </Card>
  );
}

function SummaryCard({
  game,
  review,
  names,
  onStart,
}: {
  game: SavedGame;
  review: GameReview;
  names: Record<Color, string>;
  onStart: () => void;
}) {
  const { t } = useTranslation();
  const shown = SUMMARY_LABELS.filter((l) => !['brilliant', 'great', 'book', 'miss'].includes(l) || review.counts.w[l] + review.counts.b[l] > 0);
  return (
    <Card className="flex flex-col gap-4" data-testid="review-summary">
      <div>
        <h2 className="text-xl font-bold">{t('review.title')}</h2>
        {review.opening && (
          <p className="text-sm text-muted" data-testid="review-opening">
            {review.opening.eco} · {review.opening.name}
          </p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 text-center">
        {(['w', 'b'] as const).map((c) => (
          <div key={c} className={cn('rounded-2xl p-3', game.you === c ? 'bg-primary-soft' : 'bg-surface-2')}>
            <p className="truncate text-sm font-semibold">{names[c]}</p>
            <p className="text-3xl font-extrabold" data-testid={`accuracy-${c}`}>
              {review.accuracy[c] === null ? '–' : review.accuracy[c]!.toFixed(1)}
            </p>
            <p className="text-xs text-muted">{t('review.accuracy')}</p>
          </div>
        ))}
      </div>
      <table className="w-full text-sm" data-testid="label-counts">
        <tbody>
          {shown.map((label) => (
            <tr key={label} data-label={label}>
              <td className="w-10 py-0.5 text-center font-bold tabular-nums">{review.counts.w[label]}</td>
              <td className="py-0.5">
                <span className="flex items-center justify-center gap-2">
                  <LabelBadge label={label} decorative className="h-5 w-5" />
                  {t(`review.labelName.${label}`)}
                </span>
              </td>
              <td className="w-10 py-0.5 text-center font-bold tabular-nums">{review.counts.b[label]}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Button size="lg" block onClick={onStart} data-testid="start-review">
        {t('review.start')}
      </Button>
    </Card>
  );
}

function CoachCard({ move, review, number, onSummary }: { move: MoveReview | null; review: GameReview; number: number; onSummary: () => void }) {
  const { t } = useTranslation();
  const first = review.moves[0];
  return (
    <Card className="flex flex-col gap-2" data-testid="coach-card" aria-live="polite">
      {move ? (
        <>
          <p className="flex items-center gap-2 text-lg font-bold" data-testid="coach-verdict" data-label={move.label}>
            <LabelBadge label={move.label} className="h-7 w-7" />
            {t(`review.verdict.${move.label}`, { move: `${number}${move.color === 'w' ? '.' : '...'} ${move.san}` })}
          </p>
          <p className="text-sm text-muted">{t(`review.explain.${move.label}`)}</p>
          {move.bestSan && move.best !== move.uci && move.label !== 'book' && (
            <p className="text-sm" data-testid="coach-best">
              <span className="block font-semibold">{t('review.bestWas', { move: move.bestSan })}</span>
              {move.bestLine.length > 1 && <span className="block text-muted">{t('review.line', { line: move.bestLine.slice(0, 6).join(' ') })}</span>}
            </p>
          )}
        </>
      ) : (
        <p className="text-sm text-muted">
          {t('review.startPosition')}
          {first?.bestSan ? ` · ${t('review.bestWas', { move: first.bestSan })}` : ''}
        </p>
      )}
      <Button variant="ghost" size="sm" onClick={onSummary} className="self-start">
        {t('review.summary')}
      </Button>
    </Card>
  );
}

function ReviewMoveList({
  records,
  review,
  current,
  onSelect,
  firstNumber,
}: {
  firstNumber: number;
  records: ReadonlyArray<{ san: string; color: Color }>;
  review: GameReview | null;
  current: number;
  onSelect: (ply: number) => void;
}) {
  const { t } = useTranslation();
  const offset = records[0]?.color === 'b' ? 1 : 0;
  const rows: Array<Array<number | null>> = [];
  const plies = [...Array<null>(offset).fill(null), ...records.map((_, i) => i + 1)];
  for (let i = 0; i < plies.length; i += 2) rows.push(plies.slice(i, i + 2));
  return (
    <section aria-labelledby="review-moves" className="rounded-[1.25rem] border border-line bg-surface shadow-card">
      <h2 id="review-moves" className="border-b border-line px-4 py-2 font-semibold">
        {t('play.moves')}
      </h2>
      <ol data-testid="review-move-list" className="max-h-56 overflow-y-auto p-2 text-sm lg:max-h-[calc(100dvh-30rem)]">
        {rows.map((row, r) => (
          <li key={r} className="grid grid-cols-[2.25rem_1fr_1fr] items-center gap-1">
            <span className="pl-1 text-muted">{firstNumber + r}.</span>
            {row.map((p, c) => {
              if (p === null) return <span key={c} />;
              const label = review?.moves[p - 1]?.label;
              return (
                <button
                  key={c}
                  type="button"
                  data-ply={p}
                  aria-current={p === current || undefined}
                  onClick={() => onSelect(p)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-2 py-1 text-left font-semibold',
                    p === current ? 'bg-primary-soft text-primary' : 'hover:bg-surface-2',
                  )}
                >
                  {label && <LabelBadge label={label} className="h-4 w-4 text-[0.6rem]" />}
                  {records[p - 1]!.san}
                </button>
              );
            })}
          </li>
        ))}
      </ol>
    </section>
  );
}
