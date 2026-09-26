import { inSetupPhase } from '@chaturanga/game-shell';
import { parseUci } from '@chaturanga/board-ui';
import { type Color, type Game, type PieceType, sittuyin } from '@chaturanga/sittuyin';
import { botById, BOTS, positionKey } from '@chaturanga/sittuyin-ai';
import { Button, Card, cn, SegmentedControl } from '@chaturanga/ui';
import { Lightbulb, LoaderCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { storageKey } from '@chaturanga/game-shell';
import { PRODUCT } from '../../product.config';
import { AiCancelled, cancelAi, requestComputerMove, requestHint } from '../features/ai/aiClient';
import { PieceSvg } from '../features/board/PieceSvg';
import { autoArrange } from '../features/game/autoArrange';
import { GameScreen, undoAllowed } from '../features/game/GameScreen';
import { useComputerSession } from '../stores/localSession';
import { useSettings } from '../stores/settings';

/** Minimum visible "thinking" time so instant bot replies still feel like a turn. */
const MIN_THINK_MS = 450;

/** Each bot is named after a piece, and shows it. */
const BOT_PIECE: Record<string, PieceType> = { ne: 'p', sitke: 'f', sin: 's', myin: 'n', yahhta: 'r', mingyi: 'k' };

/** Bot and colour of the current game; saved with the game so a reload continues against the same bot. */
const useComputerMatch = create<{ level: number; humanColor: Color }>()(
  persist(() => ({ level: 2, humanColor: 'w' as Color }), {
    name: storageKey(PRODUCT, 'session.computerMatch'),
    storage: createJSONStorage(() => localStorage),
  }),
);

const opposite = (c: Color): Color => (c === 'w' ? 'b' : 'w');

/** Earlier positions (placement, hands and side to move) so bots avoid pointless repetition. */
function historyOf(game: Game, startFen: string): string[] {
  return [positionKey(startFen), ...game.moves().map((r) => positionKey(r.fenAfter))];
}

export function ComputerGamePage() {
  const phase = useComputerSession((s) => s.phase);
  const { level, humanColor } = useComputerMatch();
  useEffect(() => () => cancelAi(), []);
  return phase === 'setup' ? <ComputerSetup /> : <ComputerGame level={level} humanColor={humanColor} />;
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

function ComputerGame({ level, humanColor }: { level: number; humanColor: Color }) {
  const { t } = useTranslation();
  const useSession = useComputerSession;
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
  const [arranging, setArranging] = useState(false);
  const botName = t(`bots.${bot.key}.name`);
  const placing = inSetupPhase(game);

  // Setup alternates, so Auto-arrange cannot finish in one go: it places the human's next piece each
  // time the turn comes back, until the human has nothing left in hand.
  useEffect(() => {
    if (!arranging) return;
    if (!inSetupPhase(game) || game.hand(humanColor).length === 0) return setArranging(false);
    if (game.turn !== humanColor || result || viewPly !== null) return;
    autoArrange(game, (uci) => useSession.getState().move(uci), (color) => color === humanColor);
  }, [arranging, version, result, viewPly, humanColor]); // eslint-disable-line react-hooks/exhaustive-deps

  // The bot answers on its turn, in the setup phase as well: a placement is a move like any other.
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
      const parsed = response.uci ? parseUci(response.uci, sittuyin.files) : null;
      if (parsed?.kind === 'move' && useSession.getState().game.fen() === fen) {
        setHint({ from: parsed.from, to: parsed.to, version });
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
  const canHint = !result && !placing && game.turn === humanColor && viewPly === null && !hintLoading;

  return (
    <GameScreen
      useSession={useSession}
      title={t('modes.single')}
      orientation={flipped ? computerColor : humanColor}
      names={{ [humanColor]: t('computer.you'), [computerColor]: botName } as Record<Color, string>}
      inputEnabled={game.turn === humanColor}
      canUndo={humanHasMoved && undoAllowed({ game, result })}
      onUndo={takeback}
      resignColor={humanColor}
      hint={hint && hint.version === version ? hint : null}
      status={
        // Always rendered, only hidden while idle: on a phone the board is sized to the space left, so a line that
        // came and went each turn would shrink and grow the board with it.
        <p
          data-testid="thinking"
          aria-hidden={!(thinking && !result) || undefined}
          className={cn('flex items-center justify-center gap-2 text-sm font-bold text-muted', !(thinking && !result) && 'invisible')}
        >
          <LoaderCircle aria-hidden className="h-4 w-4 animate-spin" />
          {t(placing ? 'setup.placingBot' : 'computer.thinking', { name: botName })}
        </p>
      }
      actions={
        placing ? (
          <Button
            variant="secondary"
            data-testid="auto-arrange"
            disabled={arranging}
            onClick={() => setArranging(true)}
          >
            {t('setup.autoArrange')}
          </Button>
        ) : (
          <Button variant="warning" onClick={askHint} disabled={!canHint}>
            {hintLoading ? <LoaderCircle aria-hidden className="h-5 w-5 animate-spin" /> : <Lightbulb aria-hidden className="h-5 w-5" />}
            {t('computer.hint')}
          </Button>
        )
      }
      onRematch={() => {
        cancelAi();
        setHint(null);
        useSession.getState().start(null);
      }}
    />
  );
}
