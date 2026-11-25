import { createIdentity, storageKey, type TimeControlChoice } from '@chaturanga/game-shell';
import { FeedbackLink, GameScreen, MoreGames, OnlineLobby, OnlineRoom, undoAllowed, type SiblingSite, useFocusModeProvider } from '@chaturanga/game-shell/ui';
import { Button, Card } from '@chaturanga/ui';
import { Game, dameo, START_FEN } from '@chaturanga/dameo';
import { BOTS, botById } from '@chaturanga/dameo-ai';
import type { Color } from '@chaturanga/rules-core';
import { ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, Bot, Compass, Route, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Link, Navigate, Route as RouteView, Routes, useNavigate, useParams } from 'react-router';
import { PRODUCT } from '../product.config';
import { DISPLAY_SQUARES, useBoardIdentity } from './board';
import { PieceArt } from './components/PieceArt';
import { cancelComputerMove, requestComputerMove } from './features/ai/aiClient';
import { ALL_LESSONS, UNITS } from './lessons/lessons';
import { useBotBlackSession, useBotWhiteSession, useLocalSession } from './stores/sessions';
import { DameoTutorial, lessonStarsKey, tutorialStarsKey } from './tutorial';

declare const __FAMILY__: readonly SiblingSite[];

const hero = new Game(START_FEN);
const identity = createIdentity(storageKey(PRODUCT, 'identity'));
type Mode = 'bot' | 'local';
type SessionStore = typeof useLocalSession;
const PIECE_VALUES = { m: 1, k: 3 };

const sessionFor = (mode: Mode, humanColor: Color): SessionStore =>
  mode === 'local' ? useLocalSession : humanColor === 'w' ? useBotWhiteSession : useBotBlackSession;

function botName(t: TFunction, key: (typeof BOTS)[number]['key']): string {
  return t(`bots.${key}.name`);
}

function botDescription(t: TFunction, key: (typeof BOTS)[number]['key']): string {
  return t(`bots.${key}.description`);
}

function Home() {
  const { t } = useTranslation();
  const completed = localStorage.getItem(tutorialStarsKey);
  return (
    <section className="atlas-home">
      <div className="atlas-copy">
        <p className="atlas-kicker"><span className="kicker-rule" />{t('home.edition')}</p>
        <h1>{t('home.title')}</h1>
        <p className="atlas-intro">{t('home.intro')}</p>
        <div className="atlas-actions">
          <Link className="atlas-primary" to="/play"><Bot size={17} aria-hidden />{t('home.play')}<ArrowUpRight size={16} aria-hidden /></Link>
          <Link className="atlas-secondary" to="/play?mode=local">{t('home.playLocal')} <span aria-hidden>→</span></Link>
          <Link className="atlas-secondary" to="/online"><Users size={16} aria-hidden />{t('home.playOnline')} <span aria-hidden>→</span></Link>
          <Link className="atlas-primary" to="/tutorial"><BookOpen size={17} aria-hidden />{t('home.startLearning')}<ArrowUpRight size={16} aria-hidden /></Link>
          <Link className="atlas-secondary" to="/learn">{t('home.allLessons')} <span aria-hidden>→</span></Link>
          {completed && <p className="completion-note">{t('home.lastResult', { stars: completed })}</p>}
        </div>
        <div className="signature-line"><Route size={17} aria-hidden /><span>{t('home.signature')}</span></div>
      </div>
      <div className="atlas-figure" aria-hidden="true">
        <div className="figure-heading"><span>{t('home.diagram')}</span><span>{t('home.coordinates')}</span></div>
        <div className="hero-board">
          {DISPLAY_SQUARES.map((sq) => {
            const piece = hero.pieceAt(sq);
            return <div className="hero-cell" data-tone={((sq % 8) + Math.floor(sq / 8)) % 2} key={sq}>{piece && <PieceArt piece={piece} />}</div>;
          })}
          <svg className="route-trace" viewBox="0 0 8 8" preserveAspectRatio="none">
            <path d="M2.5 5.5 3.5 4.5 4.5 3.5 5.5 2.5" />
            <circle cx="2.5" cy="5.5" r=".13" /><circle cx="5.5" cy="2.5" r=".13" />
          </svg>
        </div>
        <div className="figure-caption"><span>{t('home.boardNote')}</span><span>64 / 64</span></div>
      </div>
      <div className="atlas-index"><span>{t('home.indexLabel')}</span><span>01</span><span>II</span><span>XVIII</span></div>
    </section>
  );
}

function PlaySetup() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const [mode, setMode] = useState<Mode>(params.get('mode') === 'local' ? 'local' : 'bot');
  const [humanColor, setHumanColor] = useState<Color>('w');
  const [level, setLevel] = useState(2);
  const selectedBot = botById(level);

  const start = () => {
    const store = sessionFor(mode, humanColor);
    store.getState().start(null);
    navigate(`/game/${mode}/${mode === 'local' ? 'w' : humanColor}/${level}`);
  };

  return <section className="play-setup">
    <div className="page-heading">
      <Link className="back-link" to="/" aria-label={t('nav.home')}><ArrowLeft size={16} aria-hidden />{t('nav.home')}</Link>
      <p className="atlas-kicker"><span className="kicker-rule" />{t('setup.kicker')}</p>
      <h1>{t('setup.title')}</h1>
      <p>{t('setup.intro')}</p>
    </div>
    <div className="setup-section">
      <p className="setup-label">{t('setup.mode')}</p>
      <div className="play-mode-grid">
        <button type="button" aria-pressed={mode === 'bot'} className={`play-mode${mode === 'bot' ? ' is-selected' : ''}`} onClick={() => setMode('bot')}>
          <Bot aria-hidden /><span><strong>{t('setup.botMode')}</strong><small>{t('setup.botHint')}</small></span>
        </button>
        <button type="button" aria-pressed={mode === 'local'} className={`play-mode${mode === 'local' ? ' is-selected' : ''}`} onClick={() => setMode('local')}>
          <Users aria-hidden /><span><strong>{t('setup.localMode')}</strong><small>{t('setup.localHint')}</small></span>
        </button>
      </div>
    </div>
    {mode === 'bot' && <div className="setup-section">
      <div className="setup-section-heading"><div><p className="setup-label">{t('setup.strength')}</p><h2>{botName(t, selectedBot.key)}</h2><p>{botDescription(t, selectedBot.key)}</p></div><span className="level-stamp">{t('setup.levelCount', { count: BOTS.length })}</span></div>
      <div className="bot-levels" role="group" aria-label={t('setup.strength')}>
        {BOTS.map((bot) => <button key={bot.id} type="button" aria-pressed={level === bot.id} className={`bot-level${level === bot.id ? ' is-selected' : ''}`} onClick={() => setLevel(bot.id)}>
          <span className="bot-level-number">0{bot.id}</span><span>{botName(t, bot.key)}</span>
        </button>)}
      </div>
      <div className="setup-section-heading side-choice-heading"><div><p className="setup-label">{t('setup.seat')}</p><h2>{t('setup.playAs')}</h2></div></div>
      <div className="side-choice" role="group" aria-label={t('setup.playAs')}>
        {(['w', 'b'] as const).map((color) => <button key={color} type="button" aria-pressed={humanColor === color} className={`side-option${humanColor === color ? ' is-selected' : ''}`} onClick={() => setHumanColor(color)}>
          <PieceArt piece={{ color, type: 'm', promoted: false }} />{t(`colors.${color}`)}
        </button>)}
      </div>
      {humanColor === 'b' && <p className="setup-note">{t('setup.blackNote')}</p>}
    </div>}
    {mode === 'local' && <Card className="local-mode-note"><Users size={20} aria-hidden /><p>{t('setup.localPassNote')}</p></Card>}
    <div className="setup-actions"><Button size="lg" onClick={start}>{t('setup.start')}<ArrowRight aria-hidden className="h-5 w-5" /></Button></div>
  </section>;
}

function GameRoute() {
  const { mode: rawMode, side, level: rawLevel } = useParams();
  if ((rawMode !== 'bot' && rawMode !== 'local') || (side !== 'w' && side !== 'b')) return <Navigate to="/play" replace />;
  const mode: Mode = rawMode;
  const level = Number(rawLevel);
  if (!Number.isInteger(level) || level < 1 || level > BOTS.length) return <Navigate to="/play" replace />;
  const humanColor: Color = side;
  const store = sessionFor(mode, humanColor);
  const phase = store((state) => state.phase);
  return phase === 'playing'
    ? <GameView mode={mode} humanColor={humanColor} level={level} store={store} />
    : <Navigate to="/play" replace />;
}

function GameView({ mode, humanColor, level, store }: { mode: Mode; humanColor: Color; level: number; store: SessionStore }) {
  const { t } = useTranslation();
  const board = useBoardIdentity();
  const game = store((state) => state.game);
  const version = store((state) => state.version);
  const result = store((state) => state.result);
  const viewPly = store((state) => state.viewPly);
  const flipped = store((state) => state.flipped);
  const bot = botById(level);
  const [thinking, setThinking] = useState(false);
  const [drawOffer, setDrawOffer] = useState<{ by: Color; ply: number } | null>(null);
  const opponentColor: Color = humanColor === 'w' ? 'b' : 'w';
  const opponentName = botName(t, bot.key);

  useEffect(() => {
    if (mode !== 'bot' || result || game.turn === humanColor || viewPly !== null) {
      setThinking(false);
      return;
    }
    const fen = game.fen();
    const current = store.getState();
    const moves = game.moves().map((record) => record.uci);
    let active = true;
    setThinking(true);
    const started = performance.now();
    requestComputerMove(current.startFen, moves, level)
      .then(async (response) => {
        const wait = 250 - (performance.now() - started);
        if (wait > 0) await new Promise((resolve) => window.setTimeout(resolve, wait));
        const latest = store.getState();
        if (!active || latest.game.fen() !== fen || latest.result) return;
        const move = response.uci && latest.game.legalUci().includes(response.uci)
          ? response.uci
          : latest.game.legalUci()[0];
        if (move) latest.move(move);
      })
      .catch((error: unknown) => {
        if (!active) return;
        const latest = store.getState();
        if (latest.game.fen() === fen && !latest.result) {
          const fallback = latest.game.legalUci()[0];
          if (fallback) latest.move(fallback);
        }
        if (!(error instanceof Error && error.name === 'AiCancelled')) console.error('Dameo bot failed; used a legal fallback move.', error);
      })
      .finally(() => { if (active) setThinking(false); });
    return () => { active = false; cancelComputerMove(); setThinking(false); };
  }, [game, humanColor, level, mode, result, store, version, viewPly]);

  useEffect(() => {
    if (drawOffer && game.moves().length > drawOffer.ply && game.turn === drawOffer.by) setDrawOffer(null);
  }, [drawOffer, game, version]);

  const humanHasMoved = game.moves().some((record) => record.color === humanColor);
  const takeback = () => {
    cancelComputerMove();
    const current = store.getState();
    if (!undoAllowed(current)) return;
    if (mode === 'bot' && current.game.turn === humanColor) current.undo();
    current.undo();
    setDrawOffer(null);
  };
  const drawActions = mode === 'local' && !result && viewPly === null
    ? drawOffer === null
      ? <Button variant="outline" onClick={() => setDrawOffer({ by: game.turn, ply: game.moves().length })}>{t('play.offerDraw')}</Button>
      : game.turn !== drawOffer.by
        ? <Card className="draw-offer-card"><p>{t('play.drawOfferReceived')}</p><div><Button size="sm" onClick={() => { store.getState().agreeDraw(); setDrawOffer(null); }}>{t('play.acceptDraw')}</Button><Button size="sm" variant="outline" onClick={() => setDrawOffer(null)}>{t('play.declineDraw')}</Button></div></Card>
        : <Card className="draw-offer-card"><p>{t('play.drawOffered')}</p></Card>
    : null;

  return <section className="game-page">
    <div className="game-heading"><div><p className="atlas-kicker"><span className="kicker-rule" />{mode === 'bot' ? t('game.botEyebrow', { name: opponentName }) : t('game.localEyebrow')}</p><h1>{mode === 'bot' ? t('home.botTitle') : t('home.localTitle')}</h1></div><span className="live-note"><i />{t('game.savedOnDevice')}</span></div>
    <GameScreen
      variant={dameo}
      useSession={store}
      title={mode === 'bot' ? t('home.botTitle') : t('home.localTitle')}
      orientation={flipped ? 'b' : mode === 'bot' ? humanColor : 'w'}
      names={mode === 'bot'
        ? ({ [humanColor]: t('computer.you'), [opponentColor]: opponentName } as Record<Color, string>)
        : { w: t('colors.w'), b: t('colors.b') }}
      inputEnabled={mode === 'local' || game.turn === humanColor}
      canUndo={mode === 'local' ? undoAllowed({ game, result }) : humanHasMoved && undoAllowed({ game, result })}
      onUndo={takeback}
      resignColor={mode === 'local' ? game.turn : humanColor}
      status={mode === 'bot' ? <p className={`thinking-note${thinking ? '' : ' is-idle'}`} aria-live="polite">{thinking ? t('computer.thinking', { name: opponentName }) : '\u00a0'}</p> : null}
      actions={drawActions}
      onRematch={() => { cancelComputerMove(); setDrawOffer(null); store.getState().start(null); }}
      {...board}
      describeSquare={(square, piece) => t('board.square', { square, piece: piece ? `${t(`colors.${piece.color}`)} ${t(`pieces.${piece.type}`)}` : t('pieces.empty') })}
      pieceValues={PIECE_VALUES}
      routeChoiceTitle={t('play.chooseRoute')}
    />
  </section>;
}

function Learn() {
  const { t } = useTranslation();
  return (
    <section className="lesson-index">
      <div className="page-heading">
        <Link className="back-link" to="/" aria-label={t('nav.home')}><ArrowLeft size={16} aria-hidden />{t('nav.home')}</Link>
        <p className="atlas-kicker"><span className="kicker-rule" />{t('learn.kicker')}</p>
        <h1>{t('learn.title')}</h1>
        <p>{t('learn.intro')}</p>
      </div>
      <div className="unit-list">
        {UNITS.map((unit, unitIndex) => (
          <section className="lesson-unit" key={unit.id}>
            <div className="unit-heading"><span>{String(unitIndex + 1).padStart(2, '0')}</span><h2>{unit.title.en}</h2><i /></div>
            <div className="lesson-rows">
              {unit.lessons.map((lesson, lessonIndex) => {
                const stars = localStorage.getItem(lessonStarsKey(lesson.id));
                return <Link className="lesson-row" to={`/lesson/${lesson.id}`} key={lesson.id}>
                  <span className="lesson-index-number">{String(lessonIndex + 1).padStart(2, '0')}</span>
                  <span className="lesson-symbol" aria-hidden>{lesson.icon}</span>
                  <span className="lesson-description"><strong>{lesson.title.en}</strong><small>{lesson.summary.en}</small></span>
                  <span className="lesson-result">{stars ? t('learn.stars', { count: stars }) : t('learn.begin')}<ArrowUpRight size={15} aria-hidden /></span>
                </Link>;
              })}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}

function LessonRoute() {
  const { id } = useParams();
  const lesson = ALL_LESSONS.find((candidate) => candidate.id === id);
  return lesson ? <DameoTutorial lesson={lesson} /> : <Navigate to="/learn" replace />;
}

export function App() {
  const { t } = useTranslation();
  const { focus, FocusProvider } = useFocusModeProvider();
  const navigate = useNavigate();
  const [timeControl, setTimeControl] = useState<TimeControlChoice>({ kind: 'none' });
  const [onlineColor, setOnlineColor] = useState<'w' | 'b' | 'random'>('random');
  return (
    <div className={`dameo-app${focus ? ' is-focused' : ''}`}>
      <header className="site-masthead">
        <Link className="brand" to="/" aria-label={t('nav.home')}>
          <span className="brand-seal" aria-hidden><Compass size={21} strokeWidth={1.5} /></span>
          <span><strong>{t('home.title')}</strong><small>{t('home.brandNote')}</small></span>
        </Link>
        {focus ? <Link className="back-link" to={focus === 'game' ? (location.pathname.startsWith('/online/') ? '/online' : '/') : '/learn'}><ArrowLeft size={16} aria-hidden />{focus === 'game' ? t('nav.leaveGame') : t('nav.leave')}</Link> :
          <nav className="top-nav" aria-label={t('nav.label')}><Link to="/play">{t('nav.play')}</Link><Link to="/online">{t('modes.online')}</Link><Link to="/learn">{t('nav.lessons')}</Link><Link to="/tutorial">{t('nav.start')}</Link></nav>}
      </header>
      <main>
        <FocusProvider>
          <Routes>
            <RouteView index element={<Home />} />
            <RouteView path="learn" element={<Learn />} />
            <RouteView path="tutorial" element={<Navigate to={`/lesson/${ALL_LESSONS[0]!.id}`} replace />} />
            <RouteView path="lesson/:id" element={<LessonRoute />} />
            <RouteView path="play" element={<PlaySetup />} />
            <RouteView path="game/:mode/:side/:level" element={<GameRoute />} />
            <RouteView path="online" element={<OnlineLobby
              identity={identity}
              timeControl={timeControl}
              onTimeControlChange={setTimeControl}
              color={onlineColor}
              onColorChange={setOnlineColor}
              onEnterRoom={(code) => navigate('/online/' + code)}
            />} />
            <RouteView path="online/:code" element={<OnlineRoomRoute />} />
            <RouteView path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </FocusProvider>
      </main>
      {!focus && <footer className="site-footer"><MoreGames sites={__FAMILY__} locale={PRODUCT.defaultLocale} variant="footer" /><FeedbackLink product={PRODUCT.id} /></footer>}
    </div>
  );
}

function OnlineRoomRoute() {
  const { code = '' } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const board = useBoardIdentity();
  if (!/^[A-HJ-NP-Z2-9]{6}$/i.test(code)) return <Navigate to="/online" replace />;
  const normalized = code.toUpperCase();
  return <OnlineRoom
    key={normalized}
    code={normalized}
    variant={dameo}
    identity={identity}
    roomUrl={(roomCode) => location.origin + '/online/' + roomCode}
    onEnterRoom={(roomCode) => navigate('/online/' + roomCode)}
    onLeave={() => navigate('/online')}
    renderGame={(props) => <GameScreen
      {...props}
      variant={dameo}
      {...board}
      pieceValues={PIECE_VALUES}
      routeChoiceTitle={t('play.chooseRoute')}
    />}
  />;
}
