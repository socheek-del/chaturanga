import { type Color, type Piece } from '@chaturanga/rules-core';
import { parseUci } from '@chaturanga/board-ui';
import { createIdentity, storageKey, type Lesson, type TimeControlChoice } from '@chaturanga/game-shell';
import {
  GameScreen,
  LessonPlayer,
  MoreGames,
  OnlineLobby,
  OnlineRoom,
  undoAllowed,
  useFocusModeProvider,
} from '@chaturanga/game-shell/ui';
import { Button, Card, cn, SegmentedControl } from '@chaturanga/ui';
import { BOTS, botById } from '@chaturanga/suffragetto-ai';
import { ALBERT_HALL, Game, HOSPITAL, HOSPITAL_GROUNDS, HOUSE_OF_COMMONS, PINK_ARENA, POLICE_START_FEN, PRISON, PRISON_YARD, START_FEN, suffragetto } from '@chaturanga/suffragetto';
import { ArrowLeft, ArrowRight, BookOpen, Bot, Compass, Link2, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { PieceArt } from '../components/PieceArt';
import { cancelComputerMove, requestComputerMove } from '../features/ai/aiClient';
import { ALL_LESSONS, findLesson, UNITS } from '../lessons/lessons';
import { useBotBlackSession, useBotWhiteSession, useLocalSession, useProgress } from '../stores/sessions';
import { PRODUCT } from '../../product.config';

type Mode = 'local' | 'bot';
type Screen = 'home' | 'play' | 'learn' | 'lesson' | 'online' | 'onlineRoom';
type SessionStore = typeof useLocalSession;

const identity = createIdentity(storageKey(PRODUCT, 'identity'));
const ROOM_PATH = /^\/online\/([A-HJ-NP-Z2-9]{6})\/?$/i;
const HERO_GAME = new Game(START_FEN);
const HERO_PIECES = new Map(HERO_GAME.pieces().map(({ square, piece }) => [square, piece]));
const HERO_BOARD = Array.from({ length: 17 * 17 }, (_, index) => index);

function initialRoute(): { screen: Screen; code: string } {
  if (location.pathname === '/online') return { screen: 'online', code: '' };
  const match = ROOM_PATH.exec(location.pathname);
  return match ? { screen: 'onlineRoom', code: match[1]!.toUpperCase() } : { screen: 'home', code: '' };
}

const THEME = {
  board: 'transparent', line: '#b8aa98', coordinate: '#6e746f',
  selected: '#d29a52', lastMove: 'rgba(206, 151, 74, 0.42)', check: '#a33f35', hint: '#547c69',
};
const PIECE_VALUE = { s: 100, p: 100, l: 280, i: 280 };
const sessionFor = (mode: Mode, color: Color): SessionStore =>
  mode === 'local' ? useLocalSession : color === 'w' ? useBotWhiteSession : useBotBlackSession;

function squareDescription(t: TFunction, square: string, piece: Piece | null): string {
  if (!piece) return t('board.emptySquare', { square });
  return t('board.squareWithPiece', {
    square,
    piece: t(`pieces.${piece.type}`),
    color: piece.color === 'w' ? t('colors.w') : t('colors.b'),
  });
}

function botName(t: TFunction, key: (typeof BOTS)[number]['key']): string {
  switch (key) {
    case 'guide': return t('bots.guide.name');
    case 'scout': return t('bots.scout.name');
    case 'organizer': return t('bots.organizer.name');
    case 'strategist': return t('bots.strategist.name');
    case 'commander': return t('bots.commander.name');
    case 'champion': return t('bots.champion.name');
  }
}

function botDescription(t: TFunction, key: (typeof BOTS)[number]['key']): string {
  switch (key) {
    case 'guide': return t('bots.guide.description');
    case 'scout': return t('bots.scout.description');
    case 'organizer': return t('bots.organizer.description');
    case 'strategist': return t('bots.strategist.description');
    case 'commander': return t('bots.commander.description');
    case 'champion': return t('bots.champion.description');
  }
}

function openingFen(firstPlayer: Color): string | undefined {
  return firstPlayer === 'b' ? POLICE_START_FEN : undefined;
}

function describeAction(t: TFunction, uci: string): string {
  const action = parseUci(uci, 17);
  return action?.kind === 'action'
    ? t('play.exchangeChoice', { small: action.smallPairs, large: action.largePairs, total: action.smallPairs + action.largePairs })
    : uci;
}

export function App() {
  const { t, i18n } = useTranslation();
  const { focus, FocusProvider } = useFocusModeProvider();
  const describeSquare = (square: string, piece: Piece | null) => squareDescription(t, square, piece);
  const [route] = useState(initialRoute);
  const [screen, setScreen] = useState<Screen>(route.screen);
  const [roomCode, setRoomCode] = useState(route.code);
  const [mode, setMode] = useState<Mode>('bot');
  const [humanColor, setHumanColor] = useState<Color>('w');
  const [firstPlayer, setFirstPlayer] = useState<Color>('w');
  const [level, setLevel] = useState(2);
  const [timeControl, setTimeControl] = useState<TimeControlChoice>({ kind: 'none' });
  const [onlineColor, setOnlineColor] = useState<'w' | 'b' | 'random'>('random');
  const [lessonId, setLessonId] = useState(ALL_LESSONS[0]!.id);
  const completed = useProgress((state) => state.lessons);
  const store = sessionFor(mode, humanColor);
  const phase = store((state) => state.phase);
  const lesson = findLesson(lessonId);

  const showScreen = (next: Screen) => {
    if (next !== 'online' && next !== 'onlineRoom' && location.pathname.startsWith('/online')) {
      window.history.pushState({}, '', '/');
      setRoomCode('');
    }
    setScreen(next);
  };
  const openOnline = () => {
    window.history.pushState({}, '', '/online');
    setRoomCode('');
    setScreen('online');
  };
  const enterOnlineRoom = (code: string) => {
    const normalized = code.toUpperCase();
    window.history.pushState({}, '', '/online/' + normalized);
    setRoomCode(normalized);
    setScreen('onlineRoom');
  };
  const leaveOnlineRoom = () => {
    window.history.pushState({}, '', '/online');
    setRoomCode('');
    setScreen('online');
  };
  const openPlay = (nextMode: Mode) => {
    setMode(nextMode);
    showScreen('play');
  };
  const openLesson = (next: Lesson) => {
    setLessonId(next.id);
    showScreen('lesson');
  };
  const startGame = () => store.getState().start(null, openingFen(firstPlayer));

  useEffect(() => {
    const onPopState = () => {
      const next = initialRoute();
      setRoomCode(next.code);
      setScreen(next.screen);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  return (
    <FocusProvider>
      <div className="app-shell min-h-dvh bg-canvas text-ink">
        <header className="site-header">
          <button className="brand-lockup" type="button" onClick={() => {
            cancelComputerMove();
            showScreen('home');
          }} aria-label={t('app.home')}>
            <span className="brand-mark" aria-hidden>
              <svg viewBox="0 0 48 48" fill="none">
                <path d="M11 37c2-6 4-10 8-14l-1-9 8 4 7-3 6 6-4 6 5 6-7 1-3 6H16z" />
                <path d="m23 24 8 1m-5 10h9m-20 6h18" />
                <circle cx="31" cy="21" r="1" />
              </svg>
            </span>
            <span><strong>{t('app.name')}</strong><small>{t('app.subtitle')}</small></span>
          </button>
          {focus ? (
            <Button variant="ghost" size="sm" onClick={() => {
              cancelComputerMove();
              if (screen === 'onlineRoom') leaveOnlineRoom();
              else showScreen(screen === 'lesson' ? 'learn' : 'home');
            }}>
              <ArrowLeft aria-hidden className="h-4 w-4" />{t('nav.back')}
            </Button>
          ) : (
            <nav className="main-nav" aria-label={t('nav.label')}>
              <button type="button" onClick={() => showScreen('home')}>{t('nav.play')}</button>
              <button type="button" onClick={() => showScreen('learn')}>{t('nav.learn')}</button>
              <button type="button" onClick={openOnline}>{t('modes.online')}</button>
              <a href="#rules">{t('nav.rules')}</a>
            </nav>
          )}
        </header>
        <main className={cn('page-frame', focus && 'focus-frame')}>
          {screen === 'home' && <Home
            onPlay={() => openPlay('bot')}
            onLocal={() => openPlay('local')}
            onOnline={openOnline}
            onLearn={() => showScreen('learn')}
          />}
          {screen === 'play' && (phase === 'playing'
            ? <GameView mode={mode} humanColor={humanColor} level={level} firstPlayer={firstPlayer} />
            : <Setup
              mode={mode}
              setMode={setMode}
              humanColor={humanColor}
              setHumanColor={setHumanColor}
              firstPlayer={firstPlayer}
              setFirstPlayer={setFirstPlayer}
              level={level}
              setLevel={setLevel}
              onStart={startGame}
            />)}
          {screen === 'online' && <OnlineLobby
            identity={identity}
            timeControl={timeControl}
            onTimeControlChange={setTimeControl}
            color={onlineColor}
            onColorChange={setOnlineColor}
            onEnterRoom={enterOnlineRoom}
            startFen={openingFen(firstPlayer)}
            roomOptions={<Card className="first-player-card">
              <p className="eyebrow">{t('setup.firstPlayer')}</p>
              <SegmentedControl<Color>
                label={t('setup.firstPlayer')}
                value={firstPlayer}
                onChange={setFirstPlayer}
                options={[
                  { value: 'w', label: t('colors.w') },
                  { value: 'b', label: t('colors.b') },
                ]}
              />
            </Card>}
          />}
          {screen === 'onlineRoom' && roomCode && <OnlineRoom
            key={roomCode}
            code={roomCode}
            variant={suffragetto}
            identity={identity}
            roomUrl={(code) => location.origin + '/online/' + code}
            onEnterRoom={enterOnlineRoom}
            onLeave={leaveOnlineRoom}
            renderGame={(props) => <GameScreen
              {...props}
              variant={suffragetto}
              theme={THEME}
              showCoordinates
              boardUnderlay={<BoardUnderlay />}
              renderPiece={(piece: Piece, className: string) => <PieceArt piece={piece} className={className} />}
              boardLabel={t('board.label')}
              describeSquare={describeSquare}
              pieceValues={PIECE_VALUE}
              actions={<>{props.actions}<ExchangeActions game={props.useSession.getState().game} enabled={props.inputEnabled} onMove={(uci) => props.useSession.getState().move(uci)} /></>}
            />}
          />}
          {screen === 'learn' && <LearnList completed={completed} onSelect={openLesson} />}
          {screen === 'lesson' && lesson && <LessonPlayer
            key={lesson.id}
            variant={suffragetto}
            lesson={lesson}
            onExit={() => showScreen('learn')}
            onFinish={(stars) => {
              useProgress.getState().completeLesson(lesson.id, stars, lesson.xp);
              setScreen('learn');
            }}
            translate={(text) => text.en ?? ''}
            theme={THEME}
            boardUnderlay={<BoardUnderlay />}
            renderPiece={(piece, className) => <PieceArt piece={piece} className={className} />}
            boardLabel={t('board.label')}
            describeSquare={describeSquare}
            describeAction={(uci) => describeAction(t, uci)}
          />}
        </main>
        {!focus && screen !== 'lesson' && <RulesNote />}
        {!focus && <MoreGames sites={__FAMILY__} locale={i18n.language} variant="footer" />}
        {!focus && <footer className="site-footer">{t('footer.note')}</footer>}
      </div>
    </FocusProvider>
  );
}

function Home({ onPlay, onLocal, onOnline, onLearn }: {
  onPlay: () => void;
  onLocal: () => void;
  onOnline: () => void;
  onLearn: () => void;
}) {
  const { t } = useTranslation();
  return <div className="home-layout">
    <section className="hero-panel">
      <div className="hero-copy">
        <p className="eyebrow"><Compass aria-hidden className="inline-icon" />{t('home.kicker')}</p>
        <h1>{t('home.title')}{' '}<em>{t('home.titleAccent')}</em></h1>
        <p className="hero-lede">{t('home.description')}</p>
        <div className="hero-actions">
          <Button size="lg" onClick={onPlay}>{t('home.playBot')}<ArrowRight aria-hidden className="h-5 w-5" /></Button>
          <Button size="lg" variant="outline" onClick={onLearn}><BookOpen aria-hidden className="h-5 w-5" />{t('home.learnTitle')}</Button>
        </div>
        <p className="hero-footnote">{t('home.footnote')}</p>
      </div>
      <div className="hero-art" aria-hidden>
        <div className="board-annotation annotation-north">{t('home.northLabel')}</div>
        <div className="mini-board">
          {HERO_BOARD.map((index) => {
            const row = Math.floor(index / 17);
            const col = index % 17;
            const piece = HERO_PIECES.get((16 - row) * 17 + col);
            return <span
              key={index}
              className={cn('mini-cell', PINK_ARENA.includes((16 - row) * 17 + col) && 'mini-arena',
                HOUSE_OF_COMMONS.includes((16 - row) * 17 + col) && 'mini-house',
                ALBERT_HALL.includes((16 - row) * 17 + col) && 'mini-hall',
                piece?.color === 'w' && 'mini-suffragette', piece?.color === 'b' && 'mini-police')}
            >
              {piece && <PieceArt piece={piece} className="mini-horse" />}
            </span>;
          })}
        </div>
        <div className="board-annotation annotation-south">{t('home.southLabel')}</div>
        <p className="hero-caption">{t('home.artCaption')}</p>
      </div>
    </section>
    <section className="mode-grid" aria-label={t('home.modes')}>
      <button className="mode-card mode-featured" type="button" onClick={onPlay}>
        <span className="mode-icon"><Bot aria-hidden /></span>
        <span><strong>{t('home.botTitle')}</strong><small>{t('home.botDescription')}</small></span>
        <ArrowRight aria-hidden className="mode-arrow" />
      </button>
      <button className="mode-card" type="button" onClick={onLocal}>
        <span className="mode-icon"><Users aria-hidden /></span>
        <span><strong>{t('home.localTitle')}</strong><small>{t('home.localDescription')}</small></span>
        <ArrowRight aria-hidden className="mode-arrow" />
      </button>
      <button className="mode-card" type="button" onClick={onOnline}>
        <span className="mode-icon"><Link2 aria-hidden /></span>
        <span><strong>{t('modes.online')}</strong><small>{t('home.onlineDescription')}</small></span>
        <ArrowRight aria-hidden className="mode-arrow" />
      </button>
      <button className="mode-card" type="button" onClick={onLearn}>
        <span className="mode-icon"><BookOpen aria-hidden /></span>
        <span><strong>{t('home.learnTitle')}</strong><small>{t('home.learnDescription')}</small></span>
        <ArrowRight aria-hidden className="mode-arrow" />
      </button>
    </section>
    <section className="thesis-strip">
      <span className="thesis-mark">S/P</span>
      <p>{t('home.ruleTeaser')}</p>
      <a href="#rules">{t('home.readRules')}<ArrowRight aria-hidden className="h-4 w-4" /></a>
    </section>
  </div>;
}

function Setup({ mode, setMode, humanColor, setHumanColor, firstPlayer, setFirstPlayer, level, setLevel, onStart }: {
  mode: Mode;
  setMode: (mode: Mode) => void;
  humanColor: Color;
  setHumanColor: (color: Color) => void;
  firstPlayer: Color;
  setFirstPlayer: (color: Color) => void;
  level: number;
  setLevel: (level: number) => void;
  onStart: () => void;
}) {
  const { t } = useTranslation();
  return <div className="setup-layout">
    <div className="section-heading">
      <p className="eyebrow">{t('setup.kicker')}</p>
      <h1>{mode === 'bot' ? t('setup.botTitle') : t('setup.localTitle')}</h1>
      <p>{mode === 'bot' ? t('setup.botDescription') : t('setup.localDescription')}</p>
    </div>
    <div className="setup-tabs" role="tablist" aria-label={t('setup.mode')}>
      <button role="tab" aria-selected={mode === 'bot'} onClick={() => setMode('bot')} type="button"><Bot aria-hidden />{t('home.botTitle')}</button>
      <button role="tab" aria-selected={mode === 'local'} onClick={() => setMode('local')} type="button"><Users aria-hidden />{t('home.localTitle')}</button>
    </div>
    {mode === 'bot' && <Card className="setup-card">
      <div className="card-heading">
        <div><p className="eyebrow">{t('setup.opponent')}</p><h2>{t('setup.chooseLevel')}</h2></div>
        <span className="level-stamp">{t('setup.levelCount', { count: BOTS.length })}</span>
      </div>
      <div className="bot-grid" role="radiogroup" aria-label={t('setup.chooseLevel')}>
        {BOTS.map((bot) => <button
          key={bot.id}
          type="button"
          role="radio"
          aria-checked={level === bot.id}
          className={cn('bot-option', level === bot.id && 'is-selected')}
          onClick={() => setLevel(bot.id)}
        >
          <span className="bot-seal"><PieceArt piece={{ color: 'w', type: 'n', promoted: false }} className="h-9 w-9" /></span>
          <span><b>{botName(t, bot.key)}</b><small>{botDescription(t, bot.key)}</small></span>
          <span className="bot-number">0{bot.id}</span>
        </button>)}
      </div>
    </Card>}
    <Card className="setup-card side-card">
      <div><p className="eyebrow">{t('setup.seat')}</p><h2>{t('setup.playAs')}</h2><p>{t('setup.sideNote')}</p></div>
      {mode === 'bot'
        ? <SegmentedControl<Color>
            label={t('setup.playAs')}
            value={humanColor}
            onChange={setHumanColor}
            options={[{ value: 'w', label: t('colors.w') }, { value: 'b', label: t('colors.b') }]}
          />
        : <p className="local-pass-note">{t('setup.localNote')}</p>}
    </Card>
    <Card className="setup-card first-player-card">
      <div><p className="eyebrow">{t('setup.firstPlayer')}</p><h2>{t('setup.chooseFirst')}</h2><p>{t('setup.firstNote')}</p></div>
      <SegmentedControl<Color>
        label={t('setup.firstPlayer')}
        value={firstPlayer}
        onChange={setFirstPlayer}
        options={[{ value: 'w', label: t('colors.w') }, { value: 'b', label: t('colors.b') }]}
      />
    </Card>
    <div className="setup-actions">
      <Button variant="ghost" onClick={() => setMode(mode === 'bot' ? 'local' : 'bot')}>{t('setup.switchMode')}</Button>
      <Button size="lg" onClick={onStart}>{t('play.start')}<ArrowRight aria-hidden className="h-5 w-5" /></Button>
    </div>
  </div>;
}

function GameView({ mode, humanColor, level, firstPlayer }: {
  mode: Mode;
  humanColor: Color;
  level: number;
  firstPlayer: Color;
}) {
  const { t } = useTranslation();
  const store = sessionFor(mode, humanColor);
  const game = store((state) => state.game);
  const version = store((state) => state.version);
  const result = store((state) => state.result);
  const viewPly = store((state) => state.viewPly);
  const flipped = store((state) => state.flipped);
  const bot = botById(level);
  const describeSquare = (square: string, piece: Piece | null) => squareDescription(t, square, piece);
  const computerColor: Color = humanColor === 'w' ? 'b' : 'w';
  const [thinking, setThinking] = useState(false);
  const opponentName = botName(t, bot.key);

  useEffect(() => {
    if (mode !== 'bot' || result || game.turn === humanColor || viewPly !== null) return;
    const fen = game.fen();
    const session = store.getState();
    const moves = game.moves().map((record) => record.uci);
    let active = true;
    setThinking(true);
    const started = performance.now();
    requestComputerMove(session.startFen, moves, level)
      .then(async (response) => {
        const remaining = 300 - (performance.now() - started);
        if (remaining > 0) await new Promise((resolve) => window.setTimeout(resolve, remaining));
        const current = store.getState();
        if (!active || current.game.fen() !== fen || current.result) return;
        const move = response.uci && current.game.legalUci().includes(response.uci)
          ? response.uci
          : current.game.legalUci()[0];
        if (move) current.move(move);
      })
      .catch((error: unknown) => {
        if (!active) return;
        const current = store.getState();
        if (current.game.fen() === fen && !current.result) {
          const fallback = current.game.legalUci()[0];
          if (fallback) current.move(fallback);
        }
        if (!(error instanceof Error && error.name === 'AiCancelled'))
          console.error('Suffragetto bot failed; played the first legal move.', error);
      })
      .finally(() => {
        if (active) setThinking(false);
      });
    return () => {
      active = false;
      cancelComputerMove();
      setThinking(false);
    };
  }, [mode, humanColor, level, version, result, viewPly]); // eslint-disable-line react-hooks/exhaustive-deps

  const humanHasMoved = game.moves().some((record) => record.color === humanColor);
  const takeback = () => {
    cancelComputerMove();
    const current = store.getState();
    if (!undoAllowed(current)) return;
    if (mode === 'bot' && current.game.turn === humanColor) current.undo();
    current.undo();
  };
  const restartFen = openingFen(firstPlayer);

  return <div className="game-page">
    <div className="game-heading">
      <div><p className="eyebrow">{mode === 'bot' ? t('game.botEyebrow', { name: opponentName }) : t('game.localEyebrow')}</p>
        <h1>{mode === 'bot' ? t('home.botTitle') : t('home.localTitle')}</h1></div>
      <span className="live-note"><i />{t('game.savedOnDevice')}</span>
    </div>
    <GameScreen
      variant={suffragetto}
      useSession={store}
      title={mode === 'bot' ? t('home.botTitle') : t('home.localTitle')}
      orientation={flipped ? computerColor : mode === 'bot' ? humanColor : 'w'}
      names={mode === 'bot'
        ? ({ [humanColor]: t('computer.you'), [computerColor]: opponentName } as Record<Color, string>)
        : { w: t('colors.w'), b: t('colors.b') }}
      inputEnabled={mode === 'local' || game.turn === humanColor}
      canUndo={mode === 'local' ? undoAllowed({ game, result }) : humanHasMoved && undoAllowed({ game, result })}
      onUndo={takeback}
      resignColor={mode === 'local' ? game.turn : humanColor}
      status={<p className={cn('thinking-note', !thinking && 'invisible')} aria-hidden={!thinking}>
        <span className="thinking-dot" />{t('computer.thinking', { name: opponentName })}
      </p>}
      onRematch={() => {
        cancelComputerMove();
        store.getState().start(null, restartFen);
      }}
      theme={THEME}
      showCoordinates
      boardUnderlay={<BoardUnderlay />}
      renderPiece={(piece: Piece, className: string) => <PieceArt piece={piece} className={className} />}
      boardLabel={t('board.label')}
      describeSquare={describeSquare}
      pieceValues={PIECE_VALUE}
      actions={<ExchangeActions game={game} enabled={mode === 'local' || game.turn === humanColor} onMove={(uci) => store.getState().move(uci)} />}
    />
  </div>;
}

function ExchangeActions({ game, enabled, onMove }: { game: Game; enabled: boolean; onMove: (uci: string) => void }) {
  const { t } = useTranslation();
  const actions = game.legalUci().flatMap((uci) => {
    const parsed = parseUci(uci, 17);
    return parsed?.kind === 'action' ? [parsed] : [];
  });
  if (!actions.length) return null;
  return <Card className="exchange-actions" data-testid="exchange-actions">
    <div><p className="eyebrow">{t('play.exchangeTitle')}</p><p>{t('play.exchangePrompt')}</p></div>
    <div className="exchange-options">
      {actions.map((action) => <Button key={action.uci} variant="outline" size="sm" disabled={!enabled} onClick={() => onMove(action.uci)}>
        {describeAction(t, action.uci)}
      </Button>)}
    </div>
  </Card>;
}

function LearnList({ completed, onSelect }: {
  completed: Record<string, { stars: number }>;
  onSelect: (lesson: Lesson) => void;
}) {
  const { t } = useTranslation();
  return <div className="learn-layout">
    <div className="section-heading">
      <p className="eyebrow">{t('learn.kicker')}</p><h1>{t('learn.title')}</h1><p>{t('learn.description')}</p>
    </div>
    <Card className="learn-intro">
      <BookOpen aria-hidden /><p>{t('learn.intro')}</p>
      <span>{t('learn.progressCount', { done: Object.keys(completed).length, total: ALL_LESSONS.length })}</span>
    </Card>
    {UNITS.map((unit, i) => <section className="lesson-unit" key={unit.id}>
      <div className="unit-heading"><span>0{i + 1}</span><h2>{unit.title.en}</h2><i /></div>
      <div className="lesson-cards">
        {unit.lessons.map((item, n) => <button key={item.id} type="button" className="lesson-card" onClick={() => onSelect(item)}>
          <span className="lesson-index">{String(n + 1).padStart(2, '0')}</span>
          <span className="lesson-copy"><strong>{item.title.en}</strong><small>{item.summary.en}</small></span>
          <span className="lesson-status">{completed[item.id] ? completed[item.id]!.stars + ' ★' : <ArrowRight aria-hidden />}</span>
        </button>)}
      </div>
    </section>)}
  </div>;
}

function RulesNote() {
  const { t } = useTranslation();
  const items = [
    { title: t('rules.items.goal.title'), body: t('rules.items.goal.body') },
    { title: t('rules.items.horse.title'), body: t('rules.items.horse.body') },
    { title: t('rules.items.center.title'), body: t('rules.items.center.body') },
    { title: t('rules.items.reply.title'), body: t('rules.items.reply.body') },
    { title: t('rules.items.endings.title'), body: t('rules.items.endings.body') },
  ];
  return <section id="rules" className="rules-note">
    <div className="rules-seal">17²</div>
    <div>
      <p className="eyebrow">{t('rules.kicker')}</p><h2>{t('rules.title')}</h2><p>{t('rules.description')}</p>
      <ul>{items.map(({ title, body }) => <li key={title}>
        <b>{title}</b><span>{body}</span>
      </li>)}</ul>
    </div>
  </section>;
}

function BoardUnderlay() {
  const fill = (square: number): string => {
    if (HOUSE_OF_COMMONS.includes(square)) return '#f1dfc5';
    if (ALBERT_HALL.includes(square)) return '#dce4df';
    if (PRISON.includes(square)) return '#ced7d0';
    if (HOSPITAL.includes(square)) return '#d2d9df';
    if (PRISON_YARD.includes(square)) return '#dce5d9';
    if (HOSPITAL_GROUNDS.includes(square)) return '#dfe6ea';
    if (PINK_ARENA.includes(square)) return '#eac2c0';
    return '#e6ddcd';
  };
  const squares = Array.from({ length: 17 * 17 }, (_, index) => {
    const file = index % 17;
    const rank = 16 - Math.floor(index / 17);
    return <rect key={index} x={file} y={index / 17} width="1" height="1" fill={fill(rank * 17 + file)} />;
  });
  return <svg viewBox="0 0 17 17" className="h-full w-full" preserveAspectRatio="none" aria-hidden="true">
    {squares}
    <rect x="4" y="0" width="9" height="17" fill="none" stroke="#c78683" strokeWidth=".12" />
    <text x=".5" y="8.5" className="board-zone-label" transform="rotate(-90 .5 8.5)">PRISON</text>
    <text x="16.4" y="8.5" className="board-zone-label" transform="rotate(90 16.4 8.5)">HOSPITAL</text>
    <text x="8.5" y="4.25" className="board-zone-label">ALBERT HALL</text>
    <text x="8.5" y="13.25" className="board-zone-label">HOUSE OF COMMONS</text>
  </svg>;
}
