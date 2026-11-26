import { BOTS } from '@chaturanga/senterej-ai';
import { Game, senterej, type Piece as SenterejPiece } from '@chaturanga/senterej';
import { type Color } from '@chaturanga/rules-core';
import { createIdentity, storageKey, type OnlineSessionStore, type TimeControlChoice } from '@chaturanga/game-shell';
import { FeedbackLink, LessonPlayer, MoreGames, OnlineLobby, OnlineRoom, type OnlineScreenProps, useFocusModeProvider } from '@chaturanga/game-shell/ui';
import { Button, Card } from '@chaturanga/ui';
import { ArrowLeft, ArrowRight, BookOpen, Bot, Compass, LoaderCircle, Moon, RotateCcw, Sun, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router';
import { PRODUCT } from '../product.config';
import type { BotMove } from '@chaturanga/senterej-ai';
import { PieceMark } from './features/board/PieceMark';
import { BOARD_THEME, GameScreen, undoAllowed } from './features/game/GameScreen';
import { LESSONS } from './features/learn/lessons';
import { useGameSession } from './stores/session';
import type { FamilyLink } from '@chaturanga/family';

const identity = createIdentity(storageKey(PRODUCT, 'identity'));
const MATCH_KEY = storageKey(PRODUCT, 'match');
type Mode = 'bot' | 'local';
interface MatchOptions { mode: Mode; humanColor: Color; level: number; seed: number }

function readMatch(): MatchOptions | null {
  try {
    const value = JSON.parse(localStorage.getItem(MATCH_KEY) ?? 'null') as Partial<MatchOptions> | null;
    if (value && (value.mode === 'bot' || value.mode === 'local') && (value.humanColor === 'w' || value.humanColor === 'b') &&
      Number.isInteger(value.level) && Number.isInteger(value.seed)) return value as MatchOptions;
  } catch { /* Start a new game when stored settings are unreadable. */ }
  return null;
}

function opposite(color: Color): Color { return color === 'w' ? 'b' : 'w'; }

function familySites(): FamilyLink[] {
  return typeof __FAMILY__ === 'undefined' ? [] : __FAMILY__;
}

function readLessonProgress(): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(storageKey(PRODUCT, 'lessonProgress')) ?? '[]');
    return Array.isArray(value) && value.every((id) => typeof id === 'string') ? value : [];
  } catch { return []; }
}

function Home({ hasSaved }: { hasSaved: boolean }) {
  const { t } = useTranslation();
  const preview = useMemo(() => new Game(), []);
  return (
    <main className="home-page page-width">
      <section className="home-copy">
        <p className="eyebrow"><span className="eyebrow-mark" />{t('home.eyebrow')}</p>
        <h1>{t('home.title').split('\n').map((line) => <span key={line}>{line}</span>)}</h1>
        <p className="home-intro">{t('home.intro')}</p>
        <div className="home-links">
          <Link to="/play?mode=bot" className="action-card action-primary"><Bot size={19} aria-hidden /><span>{t('home.playBot')}</span><ArrowRight size={17} aria-hidden /></Link>
          <Link to="/play?mode=local" className="action-card"><Users size={18} aria-hidden /><span>{t('home.passPlay')}</span><ArrowRight size={17} aria-hidden /></Link>
          <Link to="/learn" className="action-card"><BookOpen size={18} aria-hidden /><span>{t('home.learn')}</span><ArrowRight size={17} aria-hidden /></Link>
          <Link to="/online" className="action-card"><Compass size={18} aria-hidden /><span>{t('home.online')}</span><ArrowRight size={17} aria-hidden /></Link>
          {hasSaved && <Link to="/game" className="resume-link">{t('home.resume')} <ArrowRight size={16} aria-hidden /></Link>}
        </div>
        <p className="home-signature"><span className="signature-dot" />{t('home.signature')}</p>
      </section>
      <aside className="field-illustration">
        <div className="illustration-heading"><span>{t('home.diagram')}</span><span>8 × 8</span></div>
        <div className="preview-board"><BoardPreview game={preview} /></div>
        <div className="illustration-footer"><span>{t('home.diagramCaption')}</span><span className="diagram-seal">ሰ</span></div>
        <span className="orbit orbit-one" aria-hidden="true" /><span className="orbit orbit-two" aria-hidden="true" />
      </aside>
      <section className="home-family"><MoreGames sites={familySites()} locale="en" /></section>
    </main>
  );
}

function BoardPreview({ game }: { game: Game }) {
  const { t } = useTranslation();
  return (
    <div className="preview-grid" role="img" aria-label={t('home.diagramAlt')}>
      {Array.from({ length: 64 }, (_, offset) => {
        const square = (7 - Math.floor(offset / 8)) * 8 + offset % 8;
        const piece = game.pieceAt(square);
        return <div className="preview-cell" key={square}>{piece && <PieceMark piece={piece} />}</div>;
      })}
    </div>
  );
}

function PlaySetup({ onStart }: { onStart: (match: MatchOptions) => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const requestedMode = new URLSearchParams(location.search).get('mode');
  const [mode, setMode] = useState<Mode>(requestedMode === 'local' ? 'local' : 'bot');
  const [humanColor, setHumanColor] = useState<Color>('w');
  const [level, setLevel] = useState(2);
  const selectedBot = BOTS[level - 1]!;
  const start = () => {
    const seed = crypto.getRandomValues(new Uint32Array(1))[0] ?? 1;
    const match = { mode, humanColor, level, seed };
    localStorage.setItem(MATCH_KEY, JSON.stringify(match));
    useGameSession.getState().start(null);
    onStart(match);
    navigate('/game');
  };
  return (
    <main className="setup-page page-width">
      <header className="page-heading">
        <Link className="back-link" to="/"><ArrowLeft size={16} aria-hidden />{t('nav.home')}</Link>
        <p className="eyebrow"><span className="eyebrow-mark" />{t('setup.eyebrow')}</p>
        <h1>{t('setup.title')}</h1><p>{t('setup.intro')}</p>
      </header>
      <section className="form-section">
        <p className="field-label">{t('setup.mode')}</p>
        <div className="mode-choices" role="group" aria-label={t('setup.mode')}>
          {(['bot', 'local'] as const).map((choice) => <button key={choice} type="button" aria-pressed={mode === choice} className={`mode-choice${mode === choice ? ' is-active' : ''}`} onClick={() => setMode(choice)}>
            {choice === 'bot' ? <Bot aria-hidden /> : <Users aria-hidden />}
            <span><strong>{t(choice === 'bot' ? 'setup.botMode' : 'setup.localMode')}</strong><small>{t(choice === 'bot' ? 'setup.botHint' : 'setup.localHint')}</small></span>
          </button>)}
        </div>
      </section>
      {mode === 'bot' && <section className="form-section bot-section">
        <div className="form-heading"><div><p className="field-label">{t('setup.strength')}</p><h2>{t(`bots.${level}.name`)}</h2><p>{t(`bots.${level}.description`)}</p></div><span className="bot-count">0{level} / 06</span></div>
        <div className="bot-levels" role="group" aria-label={t('setup.strength')}>
          {BOTS.map((bot) => <button key={bot.id} type="button" aria-pressed={level === bot.id} onClick={() => setLevel(bot.id)} className={`bot-level${level === bot.id ? ' is-active' : ''}`}>
            <span>0{bot.id}</span>{t(`bots.${bot.id}.name`)}
          </button>)}
        </div>
        <div className="form-heading side-heading"><div><p className="field-label">{t('setup.side')}</p><h2>{t('setup.playAs')}</h2></div></div>
        <div className="side-choices" role="group" aria-label={t('setup.playAs')}>
          {(['w', 'b'] as const).map((color) => <button key={color} type="button" aria-pressed={humanColor === color} className={`side-choice${humanColor === color ? ' is-active' : ''}`} onClick={() => setHumanColor(color)}>
            <PieceMark piece={{ color, type: 'k', promoted: false }} compact /><span>{t(`colors.${color}`)}</span>
          </button>)}
        </div>
      </section>}
      {mode === 'local' && <Card className="form-note-card"><Users size={20} aria-hidden /><p>{t('setup.localNote')}</p></Card>}
      <div className="setup-actions"><Button size="lg" onClick={start}>{t('setup.start')}<ArrowRight className="h-5 w-5" aria-hidden /></Button></div>
      <span className="sr-only">{selectedBot.name}</span>
    </main>
  );
}

function latestRetractableIndex(game: Game, color: Color): number {
  if (game.phase !== 'werera') return -1;
  const moves = game.moves();
  for (let index = moves.length - 1; index >= 0; index--) {
    const move = moves[index]!;
    if (move.color === color && !move.captured && move.action !== 'capture') return index;
  }
  return -1;
}

function GameRoute({ match }: { match: MatchOptions | null }) {
  const { t } = useTranslation();
  const game = useGameSession((state) => state.game);
  const version = useGameSession((state) => state.version);
  const result = useGameSession((state) => state.result);
  const phase = useGameSession((state) => state.phase);
  const startFen = useGameSession((state) => state.startFen);
  const botColor = match ? opposite(match.humanColor) : 'b';
  const botTurn = Boolean(match?.mode === 'bot' && game.turn === botColor && game.status().kind === 'ongoing');
  const [thinking, setThinking] = useState(false);

  useEffect(() => {
    if (!botTurn || !match) { setThinking(false); return; }
    const session = useGameSession.getState();
    const expectedVersion = session.version;
    const history = session.game.moves().map(({ color, uci }) => ({ color: color as Color, uci }));
    const seed = (match.seed ^ Math.imul(history.length + 1, 0x9e3779b1)) >>> 0;
    const worker = new Worker(new URL('./features/ai/ai.worker.ts', import.meta.url), { type: 'module' });
    setThinking(true);
    worker.onmessage = (event: MessageEvent<BotMove | null>) => {
      worker.terminate();
      const current = useGameSession.getState();
      if (current.version !== expectedVersion || current.result) return setThinking(false);
      const legalMoves = current.game.legalUciFor(botColor);
      const requested = event.data?.uci;
      const move = requested && legalMoves.includes(requested) ? requested : legalMoves[0];
      if (move) current.moveFor(botColor, move);
      setThinking(false);
    };
    worker.onerror = () => {
      worker.terminate();
      const current = useGameSession.getState();
      if (current.version === expectedVersion) {
        const fallback = current.game.legalUciFor(botColor)[0];
        if (fallback) current.moveFor(botColor, fallback);
      }
      setThinking(false);
    };
    worker.postMessage({ fen: startFen, color: botColor, seed, level: match.level, history });
    return () => { worker.terminate(); setThinking(false); };
  }, [botColor, botTurn, match, startFen, version]);

  if (phase !== 'playing') return <Navigate to="/play" replace />;
  if (!match) return <Navigate to="/play" replace />;
  const humanHasMoved = game.moves().some((move) => move.color === match.humanColor);
  const lastHumanMove = latestRetractableIndex(game, match.humanColor);
  const lastTurnMove = game.moves().at(-1);
  const retractColor = match.mode === 'local' ? lastTurnMove?.color : match.humanColor;
  const retractIndex = retractColor ? latestRetractableIndex(game, retractColor) : -1;
  const canUndo = match.mode === 'local'
    ? undoAllowed({ game, result })
    : humanHasMoved && undoAllowed({ game, result });

  return <main className="play-page page-width">
    <header className="game-topline"><span className="save-indicator"><span />{t('game.saved')}</span></header>
    <GameScreen
      title={t(match.mode === 'bot' ? 'modes.single' : 'modes.local')}
      useSession={useGameSession}
      orientation={useGameSession.getState().flipped ? opposite(match.humanColor) : match.mode === 'bot' ? match.humanColor : 'w'}
      names={{
        w: match.mode === 'bot' ? t(match.humanColor === 'w' ? 'computer.you' : 'computer.opponent', { name: t(`bots.${match.level}.name`) }) : t('colors.w'),
        b: match.mode === 'bot' ? t(match.humanColor === 'b' ? 'computer.you' : 'computer.opponent', { name: t(`bots.${match.level}.name`) }) : t('colors.b'),
      }}
      inputEnabled={match.mode === 'local' || (game.turn === match.humanColor && !thinking)}
      canUndo={canUndo}
      onUndo={() => {
        const session = useGameSession.getState();
        const count = match.mode === 'local' || game.turn !== match.humanColor ? 1 : 2;
        for (let index = 0; index < count && session.game.moves().length > 0; index++) session.undo();
      }}
      resignColor={match.mode === 'bot' ? match.humanColor : game.turn}
      onRematch={() => {
        const next = { ...match, seed: (match.seed + 1) >>> 0 };
        localStorage.setItem(MATCH_KEY, JSON.stringify(next));
        useGameSession.getState().start(null);
      }}
      turnLabel={game.phase === 'werera' ? t('play.werera') : undefined}
      status={thinking ? <Card tone="secondary" role="status" className="flex items-center justify-center gap-2 py-2 font-bold"><LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />{t('game.thinking', { name: t(`bots.${match.level}.name`) })}</Card> : undefined}
      actions={game.phase === 'werera' && retractIndex >= 0 ? <Button variant="outline" onClick={() => useGameSession.getState().retract(retractColor!, retractIndex)}><RotateCcw className="h-4 w-4" aria-hidden />{t('play.retract')}</Button> : undefined}
    />
    <section className="quick-rule"><p className="field-label">{t('game.fieldNote')}</p><p>{t('game.quickRule')}</p></section>
    <span className="sr-only">{lastHumanMove >= 0 ? t('game.retractionAvailable') : ''}</span>
  </main>;
}

function LearnIndex() {
  const { t } = useTranslation();
  const completed = readLessonProgress();
  return <main className="learn-page page-width">
    <header className="page-heading"><Link className="back-link" to="/"><ArrowLeft size={16} aria-hidden />{t('nav.home')}</Link><p className="eyebrow"><span className="eyebrow-mark" />{t('learn.eyebrow')}</p><h1>{t('learn.title')}</h1><p>{t('learn.intro')}</p><p className="progress-copy">{t('learn.progressSummary', { done: completed.length, total: LESSONS.length })}</p></header>
    <div className="lesson-grid">{LESSONS.map((lesson, index) => <Link className={`lesson-card${completed.includes(lesson.id) ? ' is-done' : ''}`} to={`/learn/${lesson.id}`} key={lesson.id}>
      <span className="lesson-number">{String(index + 1).padStart(2, '0')}</span><span className="lesson-copy"><b>{lesson.title.en}</b><small>{lesson.summary.en}</small></span>{completed.includes(lesson.id) ? <span className="lesson-check">✓</span> : <ArrowRight size={18} aria-hidden />}
    </Link>)}</div>
  </main>;
}

function LessonRoute() {
  const { t } = useTranslation();
  const { lessonId = '' } = useParams();
  const navigate = useNavigate();
  const lesson = LESSONS.find((candidate) => candidate.id === lessonId);
  if (!lesson) return <Navigate to="/learn" replace />;
  return <main className="lesson-page page-width"><LessonPlayer
    variant={senterej}
    lesson={lesson}
    onExit={() => navigate('/learn')}
    onFinish={() => {
      const completed = readLessonProgress();
      localStorage.setItem(storageKey(PRODUCT, 'lessonProgress'), JSON.stringify([...new Set([...completed, lesson.id])]));
      navigate('/learn');
    }}
    translate={(text) => text.en ?? ''}
    theme={BOARD_THEME}
    showCoordinates
    renderPiece={(piece, className) => <PieceMark piece={piece as SenterejPiece} className={className} />}
    describeSquare={(square, piece) => piece
      ? t('board.squareWithPiece', { square, piece: t(`pieces.${piece.type}`), color: t(`colors.${piece.color}`) })
      : t('board.emptySquare', { square })}
    boardLabel={t('board.lessonLabel')}
  /></main>;
}

function OnlinePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [timeControl, setTimeControl] = useState<TimeControlChoice>({ kind: 'preset', id: '5+0' });
  const [color, setColor] = useState<'w' | 'b' | 'random'>('random');
  return <main className="simple-page page-width">
    <header className="page-heading"><Link className="back-link" to="/"><ArrowLeft size={16} aria-hidden />{t('nav.home')}</Link><p className="eyebrow"><span className="eyebrow-mark" />{t('online.title')}</p><h1>{t('online.title')}</h1><p>{t('online.body')}</p></header>
    <OnlineLobby identity={identity} timeControl={timeControl} onTimeControlChange={setTimeControl} color={color} onColorChange={setColor} onEnterRoom={(code) => navigate(`/online/${code}`)} />
  </main>;
}

function OnlineRoomRoute() {
  const { code = '' } = useParams();
  const navigate = useNavigate();
  const normalized = code.toUpperCase();
  return <main className="play-page page-width"><OnlineRoom
    key={normalized}
    code={normalized}
    variant={senterej}
    identity={identity}
    roomUrl={(roomCode) => `${location.origin}/online/${roomCode}`}
    onEnterRoom={(roomCode) => navigate(`/online/${roomCode}`)}
    onLeave={() => navigate('/online')}
    renderGame={(screen, { session, you }) => <OnlineGame screen={screen} session={session} you={you} />}
  /></main>;
}

function OnlineGame({ screen, session, you }: { screen: OnlineScreenProps<Game>; session: OnlineSessionStore<Game>; you: Color | null }) {
  const { t } = useTranslation();
  const game = session((state) => state.game);
  const result = session((state) => state.result);
  const snapshot = session((state) => state.snapshot);
  const retractIndex = you ? latestRetractableIndex(game, you) : -1;
  const actions = <div className="online-actions">{screen.actions}{you && retractIndex >= 0 && !result && <Button variant="outline" onClick={() => session.getState().retract(you, retractIndex)}><RotateCcw className="h-4 w-4" aria-hidden />{t('play.retract')}</Button>}</div>;
  return <section className="online-game">
    <header className="game-topline"><span className="save-indicator">{t('online.roomLabel', { code: snapshot?.code ?? '' })}</span></header>
    <GameScreen
      {...screen}
      title={t('modes.online')}
      turnLabel={game.phase === 'werera' ? t('play.werera') : undefined}
      actions={actions}
      orientation={screen.orientation}
    />
    <section className="quick-rule"><p className="field-label">{t('game.fieldNote')}</p><p>{t('game.quickRule')}</p></section>
  </section>;
}

function AboutPage() {
  const { t } = useTranslation();
  return <main className="simple-page page-width"><header className="page-heading"><Link className="back-link" to="/"><ArrowLeft size={16} aria-hidden />{t('nav.home')}</Link><p className="eyebrow"><span className="eyebrow-mark" />{t('about.eyebrow')}</p><h1>{t('about.title')}</h1><p>{t('about.body')}</p></header>
    <Card className="notice-card"><p>{t('about.profile')}</p><p>{t('about.conventions')}</p><p>{t('about.provenance')}</p><div className="about-links"><a href="https://en.wikipedia.org/wiki/Senterej" target="_blank" rel="noreferrer">{t('about.catalog')}<ArrowRight size={14} aria-hidden /></a><a href="https://upload.wikimedia.org/wikipedia/commons/3/37/Travels_in_Abyssinia_and_the_Galla_country_-_with_an_account_of_a_mission_to_Ras_Ali_in_1848_%28IA_travelsinabyssin00plow%29.pdf" target="_blank" rel="noreferrer">{t('about.primarySource')}<ArrowRight size={14} aria-hidden /></a></div></Card>
  </main>;
}

export default function App() {
  const { t } = useTranslation();
  const { focus, FocusProvider } = useFocusModeProvider();
  const location = useLocation();
  const [match, setMatch] = useState<MatchOptions | null>(() => readMatch());
  const [theme, setTheme] = useState<'light' | 'dark'>(() => localStorage.getItem(storageKey(PRODUCT, 'theme')) === 'dark' ? 'dark' : 'light');
  const saved = useGameSession((state) => state.phase === 'playing');
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(storageKey(PRODUCT, 'theme'), theme);
  }, [theme]);

  const focusReturn = focus === 'lesson' ? '/learn' : location.pathname.startsWith('/online/') ? '/online' : '/';
  return <div className={`app-shell${focus ? ' is-focused' : ''}`}>
    <header className="site-header">
      <Link className="brand" to="/" aria-label={t('nav.home')}><span className="brand-symbol" aria-hidden="true"><i /><i /><i /><i /></span><span><b>SENTEREJ</b><small>FIELD OF OCHRE</small></span></Link>
      {focus
        ? <Link className="focus-back" to={focusReturn}><ArrowLeft size={16} aria-hidden />{t(focus === 'lesson' ? 'nav.leaveLesson' : 'nav.leaveGame')}</Link>
        : <><nav aria-label={t('nav.label')}><Link to="/play">{t('nav.play')}</Link><Link to="/learn">{t('nav.learn')}</Link><Link to="/online">{t('nav.online')}</Link></nav><button className="theme-toggle" type="button" aria-label={t('nav.theme')} onClick={() => setTheme((current) => current === 'light' ? 'dark' : 'light')}>{theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}</button></>}
    </header>
    <FocusProvider>
      <Routes>
        <Route path="/" element={<Home hasSaved={saved && !!match} />} />
        <Route path="/play" element={<PlaySetup onStart={setMatch} />} />
        <Route path="/game" element={<GameRoute match={match} />} />
        <Route path="/learn" element={<LearnIndex />} />
        <Route path="/learn/:lessonId" element={<LessonRoute />} />
        <Route path="/online" element={<OnlinePage />} />
        <Route path="/online/:code" element={<OnlineRoomRoute />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </FocusProvider>
    {!focus && location.pathname !== '/' && <MoreGames sites={familySites()} locale="en" variant="footer" />}
    {!focus && <div className="feedback-row"><FeedbackLink product={PRODUCT.id} /></div>}
    {!focus && <footer className="site-footer"><span>{t('footer.independent')}</span><Link to="/about">{t('nav.about')}</Link></footer>}
  </div>;
}
