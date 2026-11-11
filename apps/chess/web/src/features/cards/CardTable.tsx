import type { Square } from '@chaturanga/chess';
import { useMoveInput } from '@chaturanga/board-ui';
import { useFocusMode } from '@chaturanga/game-shell/ui';
import { Button, cn, Modal } from '@chaturanga/ui';
import { type Card, type CardColor, CARD_COLORS, isWild, topCard } from '@chaturanga/uno';
import { CircleHelp, Volume2, VolumeX } from 'lucide-react';
import { type CSSProperties, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../stores/settings';
import { Board } from '../board/Board';
import { boardTheme } from '../board/themes';
import { requestBotAction } from './botClient';
import { CARD_INK, CardBack, CardFace, useCardName } from './CardFace';
import { RulesSheet } from './RulesSheet';
import {
  canSayUno,
  type CardChessResult,
  cardOptions,
  gameOf,
  type LogEntry,
  movesByCard,
  playerOf,
  type Side,
  turnNeed,
  turnOf,
} from './rules';
import { playCardSound } from './sound';
import { type Fx, useCardChess } from './store';

const other = (side: Side): Side => (side === 'w' ? 'b' : 'w');

/** Display position (0..7 from the top-left) of a square for the given orientation. */
function cellOf(square: Square, orientation: Side) {
  const file = square % 8;
  const rank = Math.floor(square / 8);
  return orientation === 'w' ? { col: file, row: 7 - rank } : { col: 7 - file, row: rank };
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(360);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth);
    measure();
    if (typeof ResizeObserver !== 'function') return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

export function CardTable() {
  useFocusMode('game');
  const { t } = useTranslation();
  const store = useCardChess();
  const { config, revealed, fx, muted } = store;
  const state = store.game!;
  const theme = boardTheme(useSettings((s) => s.boardTheme));
  const pieceSet = useSettings((s) => s.pieceSet);
  const showCoordinates = useSettings((s) => s.showCoordinates);
  const [rulesOpen, setRulesOpen] = useState(false);

  const game = useMemo(() => gameOf(state), [state]);
  const turn = turnOf(state);
  const local = config.mode === 'local';
  const bottom: Side = local ? turn : config.side;
  const top = other(bottom);
  const orientation: Side = local ? 'w' : config.side;
  const myTurn = !state.result && turn === bottom && (!local || revealed);
  const need = turnNeed(state);
  const options = useMemo(() => cardOptions(state), [state]);
  const allMoves = useMemo(() => movesByCard(state), [state]);
  const version = state.log.length;

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [pendingWild, setPendingWild] = useState<{ cardId: number; uci: string } | null>(null);
  useEffect(() => {
    setSelectedId(null);
    setPendingWild(null);
  }, [version, turn]);

  const selected = options.find((o) => o.card.id === selectedId) ?? null;
  const freeMoves = need === 'free-move' && myTurn;
  const allowed = useMemo(() => (freeMoves ? game.legalUci() : (selected?.moves ?? [])), [freeMoves, game, selected]);
  const source = useMemo(() => ({ legalUci: () => allowed }), [allowed]);

  const input = useMoveInput({
    game: source,
    version: version * 1000 + (selectedId ?? 0),
    canMove: myTurn && allowed.length > 0 && !pendingWild,
    onMove: (uci) => {
      if (freeMoves) return store.freeMove(uci);
      if (!selected) return;
      if (isWild(selected.card)) setPendingWild({ cardId: selected.card.id, uci });
      else store.play(selected.card.id, uci);
    },
  });

  // The computer's turn: a short pause so each card can land before the next.
  useEffect(() => {
    if (local || state.result || turn === config.side) return;
    const delay = 650 + Math.min(fx.length, 2) * 250;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      const current = useCardChess.getState().game;
      if (!current || current.result || turnOf(current) === config.side) return;
      const action = await requestBotAction(current, config.level);
      // Ignore an answer to a table that changed while the bot was thinking.
      if (cancelled || !action || useCardChess.getState().game !== current) return;
      const actions = useCardChess.getState();
      if (action.kind === 'play') {
        if (action.callUno && canSayUno(current, turnOf(current))) actions.sayUno(turnOf(current));
        actions.play(action.cardId, action.uci, action.color);
      } else if (action.kind === 'draw') actions.draw();
      else if (action.kind === 'pass') actions.pass();
      else actions.freeMove(action.uci);
    }, delay);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    // `version` changes on every action, including a draw that leaves the same side to move.
  }, [local, state.result, turn, config.side, config.level, version, fx.length]);

  // Sounds follow the pile, the hands and the bursts.
  const top0 = topCard(state.uno).id;
  const handTotal = state.uno.hands[0]!.length + state.uno.hands[1]!.length;
  const lastSounds = useRef({ top: top0, hands: handTotal, fx: 0 });
  useEffect(() => {
    if (muted) return;
    const last = lastSounds.current;
    if (top0 !== last.top) playCardSound('flick');
    else if (handTotal > last.hands) playCardSound('draw');
    const newest = fx.at(-1);
    if (newest && newest.id !== last.fx) {
      const sound = { skip: 'skip', reverse: 'skip', 'no-skip': 'penalty', draw2: 'penalty', wild4: 'penalty', caught: 'penalty', uno: 'uno', color: 'color' } as const;
      const pick = sound[newest.kind as keyof typeof sound];
      if (pick) playCardSound(pick);
    }
    lastSounds.current = { top: top0, hands: handTotal, fx: newest?.id ?? last.fx };
  }, [top0, handTotal, fx, muted]);

  const humanWon = state.result && 'winner' in state.result && (local || state.result.winner === config.side);
  useEffect(() => {
    if (!state.result || muted) return;
    playCardSound(humanWon ? 'win' : 'lose');
  }, [state.result, humanWon, muted]);

  const name = (side: Side) => (local ? t(`colors.${side}`) : side === config.side ? t('cards.you') : t(`cards.bot.${config.level}`));

  // Pieces the selected card can move glow on the board.
  const glow = useMemo(() => {
    const from = new Set<Square>();
    for (const uci of allowed) {
      const sq = (uci.charCodeAt(0) - 97) + (Number(uci[1]) - 1) * 8;
      from.add(sq);
    }
    return [...from];
  }, [allowed]);

  const last = state.lastMove;
  const boardWidth: CSSProperties = { width: 'min(100%, max(15rem, calc(100dvh - 22.5rem)))' };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start lg:gap-8">
      <section className="flex flex-col items-center gap-2" aria-label={t('cards.table')}>
        <OpponentBar side={top} name={name(top)} cards={state.uno.hands[playerOf(top)]!.length} thinking={!local && turn === top && !state.result} uno={state.uno.unoCalled[playerOf(top)]!} active={turn === top} onHelp={() => setRulesOpen(true)} muted={muted} onMute={() => store.setMuted(!muted)} />

        <div className="relative" style={boardWidth} data-testid="cards-board">
          <Board
            theme={theme}
            pieceSet={pieceSet}
            pieces={game.pieces()}
            orientation={orientation}
            showCoordinates={showCoordinates}
            selected={input.selected}
            targets={input.targets}
            promotionTargets={input.promotionTargets}
            lastMove={last ? { from: last.from, to: last.to } : null}
            checkSquare={game.checkedKingSquare()}
            animate={last ? { from: last.from, to: last.to, key: `${version}-${last.uci}` } : null}
            onSquareClick={input.onSquareClick}
            canDrag={input.canDrag}
            onDrop={input.onDrop}
            overlay={
              myTurn && glow.length > 0 && !input.selected ? (
                <div className="absolute inset-0">
                  {glow.map((sq) => {
                    const { col, row } = cellOf(sq, orientation);
                    return (
                      <span
                        key={sq}
                        className="cc-glow absolute rounded-full"
                        style={{ left: `${col * 12.5 + 1.5}%`, top: `${row * 12.5 + 1.5}%`, width: '9.5%', height: '9.5%' }}
                      />
                    );
                  })}
                </div>
              ) : null
            }
          />
          <FxLayer fx={fx} name={name} onDone={store.dropFx} />
          {input.pendingPromotion && (
            <div className="absolute inset-x-4 top-1/2 z-20 -translate-y-1/2 rounded-2xl bg-surface p-3 shadow-2xl" role="dialog" aria-label={t('play.promote')}>
              <div className="flex justify-center gap-2">
                {input.pendingPromotion.choices.map((choice) => (
                  <Button key={choice.uci} variant="outline" onClick={() => input.choosePromotion(choice.uci)}>
                    {t(`pieces.${choice.promotion}`)}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        <PileRow
          state={state}
          canDraw={myTurn && need === 'draw'}
          canPass={myTurn && need === 'pass'}
          onDraw={store.draw}
          onPass={store.pass}
          status={statusLine(t, { myTurn, need, selected: selected?.card ?? null, inCheck: game.inCheck(), thinking: name(turn), result: state.result })}
        />

        <div className="relative w-full" style={{ maxWidth: '36rem' }}>
          <Hand
            cards={state.uno.hands[playerOf(bottom)]!}
            hidden={local && !revealed}
            playable={myTurn ? new Set(options.map((o) => o.card.id)) : new Set()}
            hasMoves={allMoves}
            selectedId={selectedId}
            onSelect={(id) => setSelectedId((current) => (current === id ? null : id))}
            dealing={state.uno.plays === 0}
          />
          {local && !revealed && !state.result && (
            <button
              type="button"
              onClick={store.reveal}
              className="cc-pop absolute inset-0 z-10 grid place-items-center rounded-3xl bg-scrim/70 text-lg font-bold text-white backdrop-blur-sm"
            >
              {t('cards.reveal', { side: t(`colors.${turn}`) })}
            </button>
          )}
          {canSayUno(state, bottom) && (!local || revealed) && (
            <button
              type="button"
              onClick={() => store.sayUno(bottom)}
              className="absolute -top-3 right-0 z-10 h-16 w-16 rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold"
            >
              <span className="cc-uno-button grid h-full w-full place-items-center rounded-full text-lg font-black text-white shadow-xl" style={{ background: CARD_INK.red.face }}>
                {t('cards.callUno')}
              </span>
            </button>
          )}
        </div>
      </section>

      <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
        <Legend />
        <Log entries={state.log} name={name} />
      </aside>

      <ColorPicker
        open={pendingWild !== null}
        onPick={(color) => {
          if (pendingWild) store.play(pendingWild.cardId, pendingWild.uci, color);
          setPendingWild(null);
        }}
        onCancel={() => setPendingWild(null)}
      />
      <ResultDialog result={state.result} name={name} won={!!humanWon} local={local} />
      <Modal open={rulesOpen} onClose={() => setRulesOpen(false)} title={t('cards.rules.title')}>
        <RulesSheet />
        <Button block className="mt-4" onClick={() => setRulesOpen(false)}>
          {t('cards.rules.ok')}
        </Button>
      </Modal>
    </div>
  );
}

type TFn = ReturnType<typeof useTranslation>['t'];

function statusLine(
  t: TFn,
  s: { myTurn: boolean; need: string; selected: Card | null; inCheck: boolean; thinking: string; result: CardChessResult | null },
): string {
  if (s.result) return t('cards.status.over');
  if (!s.myTurn) return t('cards.status.waiting', { name: s.thinking });
  if (s.need === 'draw') return s.inCheck ? t('cards.status.checkDraw') : t('cards.status.draw');
  if (s.need === 'pass') return t('cards.status.pass');
  if (s.need === 'free-move') return t('cards.status.free');
  if (!s.selected) return s.inCheck ? t('cards.status.checkPick') : t('cards.status.pick');
  return isWild(s.selected) ? t('cards.status.moveAny') : t('cards.status.move', { pieces: t(`cards.moves.${s.selected.color}`) });
}

function OpponentBar(props: {
  side: Side;
  name: string;
  cards: number;
  thinking: boolean;
  uno: boolean;
  active: boolean;
  onHelp: () => void;
  muted: boolean;
  onMute: () => void;
}) {
  const { t } = useTranslation();
  const shown = Math.min(props.cards, 12);
  return (
    <div className="flex w-full max-w-[36rem] items-center gap-3">
      <span
        className={cn(
          'grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 text-lg',
          props.side === 'w' ? 'border-line bg-[#fbf9f4] text-[#1c2126]' : 'border-[#11161a] bg-[#333b42] text-white',
          props.active && 'ring-4 ring-gold/50',
        )}
        aria-hidden
      >
        ♚
      </span>
      <div className="flex min-w-0 flex-col">
        <span className="truncate font-bold">{props.name}</span>
        <span className="text-xs text-muted" data-testid="opponent-count">
          {t('cards.cardCount', { count: props.cards })}
        </span>
      </div>
      <div className={cn('relative ml-1 flex h-12 flex-1 items-center', props.thinking && 'cc-thinking')} aria-hidden>
        {Array.from({ length: shown }, (_, i) => (
          <CardBack key={i} size={26} className="cc-deal-small -ml-3 first:ml-0 shadow" style={{ transform: `rotate(${(i - shown / 2) * 4}deg)` }} />
        ))}
        {props.cards === 1 && (
          <span className="cc-pop ml-2 rounded-full px-2 py-0.5 text-xs font-black text-white" style={{ background: CARD_INK.red.face }}>
            {t('cards.callUno')}
          </span>
        )}
      </div>
      <button type="button" onClick={props.onMute} aria-label={props.muted ? t('cards.soundOn') : t('cards.soundOff')} className="grid h-10 w-10 place-items-center rounded-full text-muted hover:bg-surface-2">
        {props.muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
      </button>
      <button type="button" onClick={props.onHelp} aria-label={t('cards.rules.title')} className="grid h-10 w-10 place-items-center rounded-full text-muted hover:bg-surface-2">
        <CircleHelp className="h-5 w-5" />
      </button>
    </div>
  );
}

function PileRow(props: {
  state: ReturnType<typeof useCardChess.getState>['game'] & object;
  canDraw: boolean;
  canPass: boolean;
  onDraw: () => void;
  onPass: () => void;
  status: string;
}) {
  const { t } = useTranslation();
  const cardName = useCardName();
  const { uno } = props.state;
  const top = topCard(uno);
  const under = uno.discard.at(-2);
  return (
    <div className="flex w-full max-w-[36rem] items-center gap-4">
      <button
        type="button"
        onClick={props.onDraw}
        disabled={!props.canDraw}
        aria-label={t('cards.drawPile', { count: uno.drawPile.length })}
        data-testid="draw-pile"
        className="relative h-[84px] w-[56px] shrink-0 rounded-[12%/8%] disabled:cursor-default"
      >
        <span className={cn('absolute inset-0', props.canDraw && 'cc-nudge')}>
        <span className="absolute left-1.5 top-1.5 opacity-60"><CardBack size={56} /></span>
        <span className="absolute left-0.5 top-0.5 opacity-85"><CardBack size={56} /></span>
        <span className="absolute inset-0"><CardBack size={56} className="shadow-md" /></span>
        </span>
        {props.canDraw && <span className="cc-ring absolute -inset-1.5 rounded-[14px] border-4 border-gold" />}
      </button>

      <div className="relative h-[84px] w-[56px] shrink-0" data-testid="discard" aria-live="polite" aria-label={t('cards.topCard', { card: cardName(top, uno.color) })}>
        {under && (
          <span className="absolute inset-0 rotate-[-9deg] opacity-80">
            <CardFace card={under} size={56} />
          </span>
        )}
        <span key={uno.color} aria-hidden className="cc-ripple absolute -inset-2 rounded-2xl border-4" style={{ borderColor: CARD_INK[uno.color].face }} />
        <span key={top.id} className="cc-slam absolute inset-0">
          <CardFace card={top} named={isWild(top) ? uno.color : null} size={56} className="shadow-lg" />
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
          <span className="h-3 w-3 rounded-full" style={{ background: CARD_INK[uno.color].face }} />
          {t(`cards.color.${uno.color}`)}
        </span>
        <p className="text-sm font-semibold leading-snug" data-testid="cards-status">
          {props.status}
        </p>
        {props.canPass && (
          <Button size="sm" variant="outline" onClick={props.onPass} className="self-start">
            {t('cards.pass')}
          </Button>
        )}
      </div>
    </div>
  );
}

function Hand(props: {
  cards: Card[];
  hidden: boolean;
  playable: Set<number>;
  hasMoves: Map<number, string[]>;
  selectedId: number | null;
  onSelect: (id: number) => void;
  dealing: boolean;
}) {
  const { t } = useTranslation();
  const cardName = useCardName();
  const [ref, width] = useWidth<HTMLDivElement>();
  const n = props.cards.length;
  const size = width >= 520 ? 84 : 66;
  const step = n > 1 ? Math.min(size * 0.82, (width - size - 8) / (n - 1)) : 0;
  const span = step * (n - 1) + size;
  const spread = Math.min(4.5, 40 / Math.max(n, 1));

  return (
    <div ref={ref} role="list" aria-label={t('cards.yourHand')} className="relative w-full" style={{ height: size * 1.5 + 30 }} data-testid="hand">
      {props.cards.map((card, i) => {
        const angle = (i - (n - 1) / 2) * spread;
        const lift = Math.abs(i - (n - 1) / 2) * spread * 0.9;
        const playable = props.playable.has(card.id);
        const selected = props.selectedId === card.id;
        const style: CSSProperties = {
          left: `calc(50% - ${span / 2}px + ${i * step}px)`,
          top: 22 + lift,
          transform: `rotate(${angle}deg) translateY(${selected ? -22 : 0}px) scale(${selected ? 1.08 : 1})`,
          zIndex: selected ? 40 : i,
          animationDelay: props.dealing ? `${i * 70}ms` : undefined,
        };
        if (props.hidden) {
          return (
            <div key={card.id} role="listitem" className="absolute" style={style}>
              <CardBack size={size} className="shadow-md" />
            </div>
          );
        }
        return (
          <div key={card.id} role="listitem" className="cc-deal absolute transition-transform duration-200" style={style}>
            <button
              type="button"
              disabled={!playable}
              aria-pressed={selected}
              aria-label={cardName(card)}
              data-testid="hand-card"
              data-playable={playable || undefined}
              onClick={() => props.onSelect(card.id)}
              className={cn(
                'block rounded-[12%/8%] transition-[filter,transform,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold',
                playable ? 'cursor-pointer hover:-translate-y-2' : 'translate-y-2 cursor-default brightness-[0.82] saturate-[0.35]',
              )}
            >
              <CardFace card={card} size={size} className={cn(playable && 'cc-playable shadow-lg', selected && 'cc-selected shadow-2xl')} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

function FxLayer({ fx, name, onDone }: { fx: Fx[]; name: (side: Side) => string; onDone: (id: number) => void }) {
  const { t } = useTranslation();
  return (
    <div className="pointer-events-none absolute inset-0 z-30 grid place-items-center overflow-hidden" aria-live="assertive">
      {fx.map((f) => {
        const color = f.kind === 'color' && f.color ? CARD_INK[f.color].face : f.kind === 'uno' || f.kind === 'caught' ? CARD_INK.red.face : f.kind === 'check' ? '#a32a3a' : '#1d2329';
        const text = t(`cards.fx.${f.kind}`, { name: name(f.side), count: f.count ?? 0, color: f.color ? t(`cards.color.${f.color}`) : '' });
        return (
          <div
            key={f.id}
            className="cc-burst col-start-1 row-start-1 flex flex-col items-center"
            style={{ animationDelay: `${f.delay ?? 0}ms` }}
            onAnimationEnd={(e) => {
              if (e.target === e.currentTarget) onDone(f.id);
            }}
          >
            <span className="cc-rays absolute h-48 w-48 rounded-full opacity-60" style={{ ['--ray' as string]: color, animationDelay: `${f.delay ?? 0}ms` }} />
            <span
              className="relative rounded-2xl px-5 py-2 text-3xl font-black uppercase tracking-tight text-white shadow-2xl sm:text-4xl"
              style={{ background: color, rotate: '-4deg' }}
            >
              {text}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function ColorPicker({ open, onPick, onCancel }: { open: boolean; onPick: (color: CardColor) => void; onCancel: () => void }) {
  const { t } = useTranslation();
  return (
    <Modal open={open} onClose={onCancel} title={t('cards.pickColor')}>
      <p className="mb-4 text-sm text-muted">{t('cards.pickColorHint')}</p>
      <div className="grid grid-cols-2 gap-3">
        {CARD_COLORS.map((color, i) => (
          <button
            key={color}
            type="button"
            onClick={() => onPick(color)}
            className="cc-pop flex h-20 flex-col items-center justify-center rounded-2xl text-white shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold"
            style={{ background: CARD_INK[color].face, animationDelay: `${i * 60}ms` }}
          >
            <span className="text-lg font-black">{t(`cards.color.${color}`)}</span>
            <span className="text-xs font-semibold opacity-90">{t(`cards.moves.${color}`)}</span>
          </button>
        ))}
      </div>
    </Modal>
  );
}

function ResultDialog({ result, name, won, local }: { result: CardChessResult | null; name: (side: Side) => string; won: boolean; local: boolean }) {
  const { t } = useTranslation();
  const { start, quit, config } = useCardChess();
  const [dismissed, setDismissed] = useState<CardChessResult | null>(null);
  const open = !!result && dismissed !== result;
  const title = !result
    ? ''
    : 'winner' in result
      ? t(`cards.result.${result.kind}`, { name: name(result.winner) })
      : t(`cards.result.draw`);
  return (
    <>
      {open && won && <Confetti />}
      <Modal open={open} onClose={() => setDismissed(result)} title={title}>
        <p className="mb-5 text-muted">
          {result && 'winner' in result ? (local || won ? t('cards.result.cheer') : t('cards.result.again')) : t(`cards.result.why.${result?.kind ?? 'stalemate'}`)}
        </p>
        <div className="flex flex-col gap-2">
          <Button block onClick={() => start(config)}>
            {t('cards.playAgain')}
          </Button>
          <Button block variant="outline" onClick={quit}>
            {t('cards.newSetup')}
          </Button>
        </div>
      </Modal>
    </>
  );
}

function Confetti() {
  const bits = useMemo(
    () =>
      Array.from({ length: 48 }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        duration: 1.6 + Math.random() * 1.4,
        color: CARD_INK[CARD_COLORS[i % 4]!].face,
        spin: (Math.random() - 0.5) * 1440,
        drift: (Math.random() - 0.5) * 160,
      })),
    [],
  );
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      {bits.map((b, i) => (
        <span
          key={i}
          className="cc-confetti absolute top-0 h-4 w-2.5 rounded-sm"
          style={{
            left: `${b.left}%`,
            background: b.color,
            animationDelay: `${b.delay}s`,
            animationDuration: `${b.duration}s`,
            ['--spin' as string]: `${b.spin}deg`,
            ['--drift' as string]: `${b.drift}px`,
          }}
        />
      ))}
    </div>
  );
}

function Legend() {
  const { t } = useTranslation();
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-card">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">{t('cards.legend')}</h2>
      <ul className="grid grid-cols-2 gap-2">
        {CARD_COLORS.map((color) => (
          <li key={color} className="flex items-center gap-2 text-sm">
            <span className="h-6 w-4 shrink-0 rounded" style={{ background: CARD_INK[color].face }} />
            <span>
              <strong>{t(`cards.color.${color}`)}</strong> · {t(`cards.short.${color}`)}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted">{t('cards.kingNote')}</p>
    </div>
  );
}

function Log({ entries, name }: { entries: LogEntry[]; name: (side: Side) => string }) {
  const { t } = useTranslation();
  const recent = entries.slice(-14).reverse();
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-card">
      <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted">{t('cards.log')}</h2>
      {recent.length === 0 ? (
        <p className="text-sm text-muted">{t('cards.logEmpty')}</p>
      ) : (
        <ol className="flex flex-col gap-1.5 text-sm" data-testid="cards-log">
          {recent.map((e, i) => (
            <li key={entries.length - i} className={cn('flex items-center gap-2', i === 0 && 'cc-pop')}>
              {e.kind === 'move' ? (
                <span className="h-5 w-3.5 shrink-0 rounded-sm" style={{ background: e.card.color ? CARD_INK[e.card.color].face : `conic-gradient(${CARD_INK.red.face} 0 25%, ${CARD_INK.yellow.face} 0 50%, ${CARD_INK.green.face} 0 75%, ${CARD_INK.blue.face} 0)` }} />
              ) : (
                <span className="h-5 w-3.5 shrink-0" />
              )}
              <span className="text-muted">{name(e.side)}</span>
              <span className="font-semibold">{logText(t, e)}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function logText(t: TFn, e: LogEntry): string {
  switch (e.kind) {
    case 'move':
      return `${e.card.kind === 'number' ? e.card.value : t(`cards.kind.${e.card.kind}`)} → ${e.san}`;
    case 'free-move':
      return e.san;
    case 'draw':
      return t(`cards.logDraw.${e.reason}`, { count: e.count });
    case 'pass':
      return t('cards.pass');
    case 'skip':
      return t('cards.logSkip');
    case 'skip-cancelled':
      return t('cards.logNoSkip');
    case 'uno':
      return t('cards.callUno');
  }
}
