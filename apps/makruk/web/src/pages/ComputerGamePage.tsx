import { botById, BOTS, positionKey } from '@chaturanga/makruk-ai';
import { type Color, type Game, type PieceType, parseSquare } from '@chaturanga/makruk';
import { Lightbulb, LoaderCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card, cn, SegmentedControl } from '@chaturanga/ui';
import { AiCancelled, cancelAi, requestComputerMove, requestHint } from '../features/ai/aiClient';
import { PieceSvg } from '../features/board/PieceSvg';
import { GameScreen, undoAllowed } from '../features/game/GameScreen';
import { CoachTip } from '../features/learn/CoachTip';
import { useGameHistory } from '../stores/history';
import { type GameSessionStore, useComputerMatch, useComputerSession } from '../stores/localSession';
import { useSettings } from '../stores/settings';

/** Minimum visible "thinking" time so instant bot replies still feel like a turn. */
const MIN_THINK_MS = 450;

const BOT_PIECE: Record<string, PieceType> = { bia: 'p', met: 'm', khon: 's', ma: 'n', ruea: 'r', khun: 'k' };

const opposite = (c: Color): Color => (c === 'w' ? 'b' : 'w');

/** Earlier positions (placement + side to move) so bots avoid pointless repetition. */
function historyOf(game: Game, startFen: string): string[] {
  return [positionKey(startFen), ...game.moves().map((r) => positionKey(r.fenAfter))];
}

export function ComputerGamePage() {
  const phase = useComputerSession((s) => s.phase);
  const { level, humanColor } = useComputerMatch();
  useEffect(() => () => cancelAi(), []);
  return phase === 'setup' ? (
    <ComputerSetup />
  ) : (
    <ComputerGame useSession={useComputerSession} level={level} humanColor={humanColor} />
  );
}

function ComputerSetup() {
  const { t } = useTranslation();
  const level = useSettings((s) => s.computerLevel);
  const side = useSettings((s) => s.computerSide);
  const update = useSettings((s) => s.update);

  const onStart = () => {
    const humanColor: Color = side === 'random' ? (Math.random() < 0.5 ? 'w' : 'b') : side;
    useComputerMatch.setState({ level, humanColor });
    useComputerSession.getState().start(null);
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <h1 className="text-3xl font-extrabold">{t('modes.single')}</h1>
      <Card className="flex flex-col gap-3">
        <h2 className="text-lg font-extrabold">{t('computer.chooseBot')}</h2>
        <div role="radiogroup" aria-label={t('computer.chooseBot')} className="grid gap-3 sm:grid-cols-2">
          {BOTS.map((bot) => {
            const checked = bot.id === level;
            return (
              <button
                key={bot.id}
                type="button"
                role="radio"
                aria-checked={checked}
                data-bot-level={bot.id}
                onClick={() => update({ computerLevel: bot.id })}
                className={cn(
                  'flex items-center gap-3 rounded-2xl border p-3 text-left shadow-card transition-colors',
                  checked ? 'border-primary bg-primary-soft ring-1 ring-primary' : 'border-line bg-surface hover:bg-surface-2',
                )}
              >
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-surface-2">
                  <PieceSvg piece={{ color: 'b', type: BOT_PIECE[bot.key]!, promoted: false }} className="h-11 w-11" />
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className={cn('font-semibold', checked && 'text-primary')}>{t(`bots.${bot.key}.name`)}</span>
                  <span className="text-xs font-bold text-gold">{t('computer.level', { level: bot.id })}</span>
                  <span className="text-sm text-muted">{t(`bots.${bot.key}.desc`)}</span>
                </span>
              </button>
            );
          })}
        </div>
      </Card>
      <Card className="flex flex-col gap-3">
        <h2 className="text-lg font-extrabold">{t('computer.side')}</h2>
        <SegmentedControl<'w' | 'b' | 'random'>
          label={t('computer.side')}
          value={side}
          onChange={(computerSide) => update({ computerSide })}
          options={[
            { value: 'w', label: t('computer.sideWhite') },
            { value: 'b', label: t('computer.sideBlack') },
            { value: 'random', label: t('computer.sideRandom') },
          ]}
        />
      </Card>
      <Button size="lg" block onClick={onStart}>
        {t('play.start')}
      </Button>
    </div>
  );
}

export interface ComputerGameProps {
  useSession: GameSessionStore;
  level: number;
  humanColor: Color;
  /** Show beginner coach tips (guided first game). */
  coach?: boolean;
  title?: string;
}

export function ComputerGame({ useSession, level, humanColor, coach = false, title }: ComputerGameProps) {
  const { t } = useTranslation();
  const game = useSession((s) => s.game);
  const version = useSession((s) => s.version);
  const result = useSession((s) => s.result);
  const viewPly = useSession((s) => s.viewPly);
  const flipped = useSession((s) => s.flipped);
  const bot = botById(level);
  const computerColor = opposite(humanColor);
  const [thinking, setThinking] = useState(false);
  const [hint, setHint] = useState<{ from: number; to: number; version: number } | null>(null);
  const [hintLoading, setHintLoading] = useState(false);
  const botName = t(`bots.${bot.key}.name`);
  // Only the game against the computer is saved (review-001); the guided lesson reuses this screen.
  const savedId = useGameHistory((s) => s.current.computer);
  const reviewId = useSession === useComputerSession ? savedId : null;

  useEffect(() => {
    if (result || game.turn !== computerColor || viewPly !== null) return;
    const fen = game.fen();
    let cancelled = false;
    setThinking(true);
    const started = performance.now();
    requestComputerMove(fen, level, historyOf(game, useSession.getState().startFen))
      .then(async (response) => {
        const wait = MIN_THINK_MS - (performance.now() - started);
        if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
        const session = useSession.getState();
        if (cancelled || session.game.fen() !== fen || !response.uci) return;
        session.move(response.uci);
      })
      .catch((err: unknown) => {
        if (!(err instanceof AiCancelled)) console.error(err);
      })
      .finally(() => {
        if (!cancelled) setThinking(false);
      });
    return () => {
      cancelled = true;
      setThinking(false);
    };
  }, [version, result, viewPly, computerColor, level]); // eslint-disable-line react-hooks/exhaustive-deps

  const askHint = async () => {
    const fen = game.fen();
    setHintLoading(true);
    try {
      const response = await requestHint(fen, historyOf(game, useSession.getState().startFen));
      if (response.uci && useSession.getState().game.fen() === fen) {
        setHint({ from: parseSquare(response.uci.slice(0, 2)), to: parseSquare(response.uci.slice(2, 4)), version });
      }
    } catch (err) {
      if (!(err instanceof AiCancelled)) console.error(err);
    } finally {
      setHintLoading(false);
    }
  };

  const takeback = () => {
    cancelAi();
    const session = useSession.getState();
    if (session.game.turn === humanColor) session.undo();
    session.undo();
    setHint(null);
  };

  const humanHasMoved = game.moves().some((r) => r.color === humanColor);
  const canHint = !result && game.turn === humanColor && viewPly === null && !hintLoading;

  return (
    <GameScreen
      useSession={useSession}
      title={title ?? t('modes.single')}
      orientation={flipped ? computerColor : humanColor}
      names={{ [humanColor]: t('computer.you'), [computerColor]: botName } as Record<Color, string>}
      inputEnabled={game.turn === humanColor}
      canUndo={humanHasMoved && undoAllowed({ game, result })}
      onUndo={takeback}
      resignColor={humanColor}
      reviewId={reviewId}
      hint={hint && hint.version === version ? hint : null}
      status={
        <>
          {coach && <CoachTip game={game} humanColor={humanColor} over={!!result} />}
          {thinking && !result && (
            <p data-testid="thinking" className="flex items-center justify-center gap-2 text-sm font-bold text-muted">
              <LoaderCircle aria-hidden className="h-4 w-4 animate-spin" />
              {t('computer.thinking', { name: botName })}
            </p>
          )}
        </>
      }
      actions={
        <Button variant="warning" onClick={askHint} disabled={!canHint}>
          {hintLoading ? <LoaderCircle aria-hidden className="h-5 w-5 animate-spin" /> : <Lightbulb aria-hidden className="h-5 w-5" />}
          {t('computer.hint')}
        </Button>
      }
      onRematch={() => {
        cancelAi();
        setHint(null);
        useSession.getState().start(null);
      }}
    />
  );
}
