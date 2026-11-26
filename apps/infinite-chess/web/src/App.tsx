import { createIdentity, createOnlineSession, createRoom, fetchRoom, openGameConnection, storageKey, type Identity } from '@chaturanga/game-shell';
import { Game, infiniteChess } from '@chaturanga/infinite-chess';
import type { GameStatus } from '@chaturanga/rules-core';
import { MoreGames } from '@chaturanga/game-shell/ui';
import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { ArrowDownRight, ArrowLeft, ArrowRight, BookOpen, Check, ChevronRight, CircleHelp, Globe2, Handshake, LoaderCircle, RotateCcw, Share2, Shield, Swords, Users, Wifi, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router';
import { LESSONS, acceptsTutorialMove, type TutorialLesson } from './features/learn/lessons';
import { InfiniteBoard } from './features/board/InfiniteBoard';
import { useGameSession } from './stores/session';
import { PRODUCT } from '../product.config';

type BotLevel = 'beginner' | 'club' | 'strong';
type PlayMode = 'bot' | 'local';
interface MatchSettings { mode: PlayMode; humanColor: 'w' | 'b'; level: BotLevel; seed: number }
const MATCH_KEY = storageKey(PRODUCT, 'match');
const identity = createIdentity(storageKey(PRODUCT, 'identity'));
const BOT_LEVELS: readonly BotLevel[] = ['beginner', 'club', 'strong'];

function readMatch(): MatchSettings | null {
  try {
    const value = JSON.parse(localStorage.getItem(MATCH_KEY) ?? 'null') as Partial<MatchSettings> | null;
    if (value && (value.mode === 'bot' || value.mode === 'local') && (value.humanColor === 'w' || value.humanColor === 'b') &&
      BOT_LEVELS.includes(value.level as BotLevel) && Number.isInteger(value.seed)) return value as MatchSettings;
  } catch { /* Start a new game if the saved settings cannot be read. */ }
  return null;
}

function freshSeed(): number {
  const seed = new Uint32Array(1);
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) crypto.getRandomValues(seed);
  return seed[0] ?? 0;
}

function opposite(color: 'w' | 'b'): 'w' | 'b' { return color === 'w' ? 'b' : 'w'; }

function saveLesson(id: string): void {
  try {
    const key = storageKey(PRODUCT, 'lessonProgress');
    const current: unknown = JSON.parse(localStorage.getItem(key) ?? '[]');
    const values = Array.isArray(current) ? current.filter((item): item is string => typeof item === 'string') : [];
    localStorage.setItem(key, JSON.stringify([...new Set([...values, id])]));
  } catch { /* Learning still works when browser storage is unavailable. */ }
}

function lessonProgress(): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(storageKey(PRODUCT, 'lessonProgress')) ?? '[]');
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
  } catch { return []; }
}

function Header() {
  const { t } = useTranslation();
  const location = useLocation();
  const focused = location.pathname.startsWith('/game') || location.pathname.startsWith('/room/') || location.pathname.startsWith('/learn/');
  return (
    <header className="topbar">
      <Link to="/" className="wordmark" aria-label={t('nav.home')}>
        <span className="wordmark-mark" aria-hidden="true"><i /><i /><i /><i /></span>
        <span className="wordmark-copy"><b>{t('brand.name')}</b><small>{t('brand.game')}</small></span>
      </Link>
      {focused ? <Link to="/" className="focus-link"><ArrowLeft size={15} aria-hidden />{t('nav.home')}</Link> : (
        <nav className="main-nav" aria-label={t('nav.main')}>
          <Link to="/play?mode=bot">{t('nav.play')}</Link>
          <Link to="/learn">{t('nav.learn')}</Link>
          <Link to="/online">{t('nav.online')}</Link>
        </nav>
      )}
    </header>
  );
}

function Footer() {
  const { t } = useTranslation();
  return <footer className="site-footer"><span>{t('footer.edition')}</span><a href="https://github.com/socheek-del/chaturanga/blob/main/apps/infinite-chess/README.md" target="_blank" rel="noreferrer">{t('footer.source')}</a></footer>;
}

function Home() {
  const { t } = useTranslation();
  const phase = useGameSession((state) => state.phase);
  const hasSaved = phase === 'playing' && readMatch() !== null;
  return (
    <main className="home-layout">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow"><span className="status-point" />{t('home.eyebrow')}</p>
          <h1>{t('home.title')}<em>{t('home.titleAccent')}</em></h1>
          <p className="hero-description">{t('home.description')}</p>
          <div className="hero-actions">
            <Link className="primary-button" to="/play?mode=bot">{t('home.playBot')}<ArrowRight size={18} aria-hidden /></Link>
            {hasSaved && <Link className="quiet-button" to="/game">{t('home.resume')}<ChevronRight size={16} aria-hidden /></Link>}
          </div>
          <div className="hero-links">
            <Link to="/play?mode=local"><Users size={16} aria-hidden />{t('home.passPlay')}</Link>
            <Link to="/learn"><BookOpen size={16} aria-hidden />{t('home.tutorial')}</Link>
            <Link to="/online"><Wifi size={16} aria-hidden />{t('home.online')}</Link>
          </div>
        </div>
        <div className="hero-map" aria-hidden="true">
          <div className="map-grid" />
          <span className="map-axis map-axis-x">{t('brand.axisX')} →</span><span className="map-axis map-axis-y">{t('brand.axisY')} ↑</span>
          <span className="map-coordinate coordinate-a">(−3, 8)</span><span className="map-coordinate coordinate-b">(1, 1)</span>
          <span className="map-route route-one" /><span className="map-route route-two" />
          <span className="map-compass">{t('brand.north')}</span>
          <span className="map-piece">♘</span><span className="map-piece map-rook">♖</span>
          <span className="map-corner">{t('brand.mapNumber')}</span>
          <div className="map-caption"><span>{t('home.diagramTitle')}</span><b>{t('home.diagramCaption')}</b></div>
        </div>
      </section>
      <section className="principles">
        <article><span className="principle-number">01</span><div><h2>{t('home.ruleOneTitle')}</h2><p>{t('home.ruleOne')}</p></div></article>
        <article><span className="principle-number">02</span><div><h2>{t('home.ruleTwoTitle')}</h2><p>{t('home.ruleTwo')}</p></div></article>
        <article><span className="principle-number">03</span><div><h2>{t('home.ruleThreeTitle')}</h2><p>{t('home.ruleThree')}</p></div></article>
      </section>
      <div className="home-family"><MoreGames sites={__FAMILY__} locale={PRODUCT.defaultLocale} /></div>
    </main>
  );
}

function PlaySetup() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const requestedMode = new URLSearchParams(location.search).get('mode');
  const [mode, setMode] = useState<PlayMode>(requestedMode === 'local' ? 'local' : 'bot');
  const [humanColor, setHumanColor] = useState<'w' | 'b'>('w');
  const [level, setLevel] = useState<BotLevel>('club');
  const start = () => {
    localStorage.setItem(MATCH_KEY, JSON.stringify({ mode, humanColor, level, seed: freshSeed() } satisfies MatchSettings));
    useGameSession.getState().start(null, infiniteChess.startFen);
    navigate('/game');
  };
  return (
    <main className="setup-layout">
      <Link className="back-link" to="/"><ArrowLeft size={15} aria-hidden />{t('nav.home')}</Link>
      <div className="section-heading"><p className="eyebrow">{t('setup.eyebrow')}</p><h1>{t('setup.title')}</h1><p>{t('setup.description')}</p></div>
      <section className="setup-card">
        <p className="field-label">{t('setup.mode')}</p>
        <div className="choice-grid">
          {(['bot', 'local'] as const).map((choice) => <button key={choice} className={`choice-card${mode === choice ? ' is-active' : ''}`} type="button" aria-pressed={mode === choice} onClick={() => setMode(choice)}>
            {choice === 'bot' ? <Swords size={21} aria-hidden /> : <Users size={21} aria-hidden />}<span><b>{t(`setup.${choice}Title`)}</b><small>{t(`setup.${choice}Description`)}</small></span>{mode === choice && <Check className="choice-check" size={17} aria-hidden />}
          </button>)}
        </div>
        {mode === 'bot' && <>
          <p className="field-label setup-subhead">{t('setup.botLevel')}</p>
          <div className="level-row" role="group" aria-label={t('setup.botLevel')}>
            {BOT_LEVELS.map((choice, index) => <button type="button" key={choice} aria-pressed={level === choice} className={level === choice ? 'is-active' : ''} onClick={() => setLevel(choice)}><small>0{index + 1}</small>{t(`bot.${choice}`)}</button>)}
          </div>
          <p className="level-note">{t(`bot.${level}Hint`)}</p>
          <p className="field-label setup-subhead">{t('setup.side')}</p>
          <div className="side-row" role="group" aria-label={t('setup.side')}>
            {(['w', 'b'] as const).map((color) => <button type="button" key={color} aria-pressed={humanColor === color} className={`side-card${humanColor === color ? ' is-active' : ''}`} onClick={() => setHumanColor(color)}><span className={`side-emblem side-${color}`}>{color === 'w' ? '♔' : '♚'}</span>{t(`colors.${color}`)}</button>)}
          </div>
        </>}
        {mode === 'local' && <p className="pass-note"><Users size={17} aria-hidden />{t('setup.localNote')}</p>}
        <button type="button" className="primary-button setup-start" onClick={start}>{t('setup.start')}<ArrowRight size={18} aria-hidden /></button>
      </section>
    </main>
  );
}

function statusText(status: GameStatus): string {
  if (status.kind === 'checkmate') return `checkmate:${status.winner}`;
  return status.kind;
}

function LocalGame() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const game = useGameSession((state) => state.game);
  const version = useGameSession((state) => state.version);
  const phase = useGameSession((state) => state.phase);
  const match = useMemo(() => readMatch(), []);
  const [thinking, setThinking] = useState(false);
  const status = game.status();
  const sessionResult = useGameSession((state) => state.result);
  const botColor = match ? opposite(match.humanColor) : 'b';
  const botTurn = Boolean(match?.mode === 'bot' && game.turn === botColor && status.kind === 'ongoing');

  useEffect(() => {
    if (!botTurn || !match) { setThinking(false); return; }
    const expectedVersion = useGameSession.getState().version;
    const seed = (match.seed ^ Math.imul(game.moves().length + 1, 0x9e3779b1)) >>> 0;
    const worker = new Worker(new URL('./features/ai/ai.worker.ts', import.meta.url), { type: 'module' });
    setThinking(true);
    worker.onmessage = (event: MessageEvent<{ uci?: string } | null>) => {
      worker.terminate();
      const session = useGameSession.getState();
      if (session.version === expectedVersion && !session.result && event.data?.uci) session.moveFor(botColor, event.data.uci);
      setThinking(false);
    };
    worker.onerror = () => {
      worker.terminate();
      setThinking(false);
    };
    worker.postMessage({ fen: game.fen(), seed, level: match.level });
    return () => worker.terminate();
  }, [botColor, botTurn, game, match, version]);

  if (phase !== 'playing' || !match) return <Navigate to="/play" replace />;
  const inputEnabled = !sessionResult && (match.mode === 'local' || (game.turn === match.humanColor && !thinking && status.kind === 'ongoing'));
  const moves = game.moves();
  const currentStatus = statusText(status);
  const handleMove = (uci: string) => Boolean(useGameSession.getState().move(uci));
  const undo = () => {
    const count = match.mode === 'bot' ? Math.min(2, useGameSession.getState().game.moves().length) : 1;
    for (let index = 0; index < count; index++) useGameSession.getState().undo();
  };
  const playerName = (color: 'w' | 'b') => match.mode === 'local'
    ? t(`colors.${color}`)
    : color === match.humanColor ? t('game.you') : t(`bot.${match.level}`);

  return (
    <main className="game-layout">
      <div className="game-topline"><span className="eyebrow">{t(match.mode === 'bot' ? 'game.botTitle' : 'game.localTitle')}</span><button className="text-button" type="button" onClick={() => navigate('/play')}>{t('game.newGame')}</button></div>
      <div className="game-columns">
        <div className="board-column">
          <div className={`turn-banner${game.inCheck() ? ' is-check' : ''}`}><span>{game.inCheck() ? t('game.check') : t('game.toMove')}</span><b>{status.kind === 'ongoing' ? playerName(game.turn) : t(`status.${currentStatus}`)}</b>{thinking && <span className="thinking"><LoaderCircle className="spin" size={15} aria-hidden />{t('game.thinking')}</span>}</div>
          <InfiniteBoard game={game} version={version} inputEnabled={inputEnabled} onMove={handleMove} />
          <div className="game-actions">
            <button className="quiet-button" type="button" onClick={undo} disabled={moves.length === 0 || sessionResult !== null}><RotateCcw size={15} aria-hidden />{t('game.undo')}</button>
            <button className="quiet-button" type="button" onClick={() => useGameSession.getState().agreeDraw()} disabled={status.kind !== 'ongoing'}><Handshake size={15} aria-hidden />{t('game.draw')}</button>
            <button className="quiet-button quiet-danger" type="button" onClick={() => useGameSession.getState().resign(match.mode === 'local' ? game.turn : match.humanColor)} disabled={status.kind !== 'ongoing'}><X size={16} aria-hidden />{t('game.resign')}</button>
          </div>
          {(status.kind !== 'ongoing' || sessionResult) && <div className="result-banner" role="status"><Check size={18} aria-hidden /><span>{sessionResult?.winner ? t('game.winner', { color: t(`colors.${sessionResult.winner}`) }) : t(`status.${sessionResult?.reason ?? currentStatus}`)}</span><button type="button" onClick={() => navigate('/play')}>{t('game.playAgain')}</button></div>}
        </div>
        <aside className="move-panel">
          <div className="move-panel-heading"><span className="eyebrow">{t('game.record')}</span><span>{moves.length} {t('game.plies')}</span></div>
          <div className="seat-card"><span className="seat-piece seat-white">♔</span><div><b>{playerName('w')}</b><small>{t('colors.w')}</small></div><i className={game.turn === 'w' && status.kind === 'ongoing' ? 'is-active' : ''} /></div>
          <div className="seat-card"><span className="seat-piece seat-black">♚</span><div><b>{playerName('b')}</b><small>{t('colors.b')}</small></div><i className={game.turn === 'b' && status.kind === 'ongoing' ? 'is-active' : ''} /></div>
          <div className="move-list" aria-label={t('game.moveList')}>
            {moves.length === 0 ? <p className="empty-record">{t('game.noMoves')}</p> : moves.map((move, index) => <div className="move-record" key={`${move.uci}-${index}`}><span>{Math.floor(index / 2) + 1}{index % 2 ? '…' : '.'}</span><code>{move.uci}</code></div>)}
          </div>
          <div className="rule-note"><Shield size={16} aria-hidden /><p>{t('game.serverlessNote')}</p></div>
        </aside>
      </div>
    </main>
  );
}

function TutorialIndex() {
  const { t } = useTranslation();
  const done = lessonProgress();
  return (
    <main className="learn-layout">
      <Link className="back-link" to="/"><ArrowLeft size={15} aria-hidden />{t('nav.home')}</Link>
      <div className="section-heading"><p className="eyebrow">{t('tutorial.eyebrow')}</p><h1>{t('tutorial.title')}</h1><p>{t('tutorial.description')}</p><span className="progress-label">{t('tutorial.progress', { done: done.length, total: LESSONS.length })}</span></div>
      <div className="lesson-list">
        {LESSONS.map((lesson, index) => <Link className={`lesson-card${done.includes(lesson.id) ? ' is-done' : ''}`} key={lesson.id} to={`/learn/${lesson.id}`}>
          <span className="lesson-number">{String(index + 1).padStart(2, '0')}</span><span className="lesson-copy"><b>{t(`lesson.${lesson.id}.title`)}</b><small>{t(`lesson.${lesson.id}.summary`)}</small></span>{done.includes(lesson.id) ? <Check size={17} aria-label={t('tutorial.completed')} /> : <ArrowRight size={17} aria-hidden />}
        </Link>)}
      </div>
    </main>
  );
}

function TutorialStep({ lesson }: { lesson: TutorialLesson }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const lessonIndex = LESSONS.findIndex(({ id }) => id === lesson.id);
  const [game, setGame] = useState(() => new Game(lesson.fen));
  const [version, setVersion] = useState(0);
  const [sequenceIndex, setSequenceIndex] = useState(0);
  const [complete, setComplete] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    setGame(infiniteChess.createGame(lesson.fen));
    setVersion((current) => current + 1);
    setSequenceIndex(0);
    setComplete(false);
    setFeedback('');
  }, [lesson]);

  const onMove = (uci: string) => {
    if (!acceptsTutorialMove(lesson.rule, uci, game, sequenceIndex)) {
      setFeedback(t('tutorial.tryAgain'));
      return false;
    }
    if (lesson.rule.kind === 'ending-move') {
      const preview = new Game(game.fen());
      preview.move(uci);
      if (preview.status().kind !== lesson.rule.result) {
        setFeedback(t('tutorial.tryAgain'));
        return false;
      }
    }
    game.move(uci);
    setVersion((current) => current + 1);
    if (lesson.rule.kind === 'sequence' && sequenceIndex + 1 < lesson.rule.ucis.length) {
      const next = sequenceIndex + 1;
      setSequenceIndex(next);
      setFeedback(t('tutorial.sequenceProgress', { done: next, total: lesson.rule.ucis.length }));
      return true;
    }
    setComplete(true);
    setFeedback(t('tutorial.success'));
    saveLesson(lesson.id);
    return true;
  };

  const answerQuiz = (answer: string) => {
    if (answer === 'draw' && lesson.rule.kind === 'quiz') {
      setComplete(true);
      setFeedback(t('tutorial.quizCorrect'));
      saveLesson(lesson.id);
    } else setFeedback(t('tutorial.quizWrong'));
  };

  const advance = () => navigate(lessonIndex + 1 < LESSONS.length ? `/learn/${LESSONS[lessonIndex + 1]!.id}` : '/learn');
  return (
    <main className="lesson-layout">
      <Link className="back-link" to="/learn"><ArrowLeft size={15} aria-hidden />{t('tutorial.allLessons')}</Link>
      <div className="lesson-heading"><span className="lesson-kicker">{String(lessonIndex + 1).padStart(2, '0')} / {String(LESSONS.length).padStart(2, '0')}</span><h1>{t(`lesson.${lesson.id}.title`)}</h1><p>{t(`lesson.${lesson.id}.description`)}</p></div>
      <div className="lesson-columns">
        <div className="lesson-board"><InfiniteBoard game={game} version={version} inputEnabled={!complete && lesson.rule.kind !== 'quiz'} onMove={onMove} coordinateEntry={lesson.id === 'coordinates'} /></div>
        <aside className="lesson-instructions">
          <p className="eyebrow">{t('tutorial.practice')}</p>
          <h2>{t(`lesson.${lesson.id}.prompt`)}</h2>
          <p>{t(`lesson.${lesson.id}.hint`)}</p>
          {lesson.rule.kind === 'quiz' && <div className="quiz-options"><button type="button" onClick={() => answerQuiz('draw')}>{t('tutorial.draw')}</button><button type="button" onClick={() => answerQuiz('win')}>{t('tutorial.win')}</button></div>}
          {feedback && <p className={`lesson-feedback${complete ? ' is-correct' : ''}`} role="status">{feedback}</p>}
          {complete && <button className="primary-button lesson-next" type="button" onClick={advance}>{lessonIndex + 1 < LESSONS.length ? t('tutorial.next') : t('tutorial.finish')}<ArrowRight size={17} aria-hidden /></button>}
          <div className="lesson-tip"><CircleHelp size={17} aria-hidden /><span>{t('lesson.sharedCoordinates')}</span></div>
        </aside>
      </div>
    </main>
  );
}

function TutorialRoute() {
  const { lessonId } = useParams();
  const lesson = LESSONS.find((candidate) => candidate.id === lessonId);
  return lesson ? <TutorialStep key={lesson.id} lesson={lesson} /> : <Navigate to="/learn" replace />;
}

function OnlineLobby() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const create = async () => {
    setBusy(true);
    setError('');
    try {
      const guest = await identity.ensureIdentity();
      const room = await createRoom(guest.token, { timeControl: null, color: 'random', rated: false });
      navigate(`/room/${room}`);
    } catch { setError(t('online.connectionError')); }
    finally { setBusy(false); }
  };
  const join = async (event: FormEvent) => {
    event.preventDefault();
    const normalized = code.trim().toUpperCase();
    if (!/^[A-HJ-NP-Z2-9]{6}$/.test(normalized)) { setError(t('online.invalidCode')); return; }
    setBusy(true);
    setError('');
    try {
      const room = await fetchRoom(normalized);
      if (!room) setError(t('online.roomNotFound'));
      else navigate(`/room/${normalized}`);
    } catch { setError(t('online.connectionError')); }
    finally { setBusy(false); }
  };
  return (
    <main className="online-layout">
      <Link className="back-link" to="/"><ArrowLeft size={15} aria-hidden />{t('nav.home')}</Link>
      <div className="section-heading"><p className="eyebrow">{t('online.eyebrow')}</p><h1>{t('online.title')}</h1><p>{t('online.description')}</p></div>
      <div className="online-card">
        <div className="online-card-icon"><Share2 size={21} aria-hidden /></div><div><h2>{t('online.createTitle')}</h2><p>{t('online.createDescription')}</p></div>
        <button className="primary-button" type="button" onClick={create} disabled={busy}>{busy ? <LoaderCircle className="spin" size={17} aria-hidden /> : <ArrowRight size={17} aria-hidden />}{t('online.create')}</button>
      </div>
      <form className="online-card join-card" onSubmit={join}>
        <div className="online-card-icon"><Users size={21} aria-hidden /></div><div><h2>{t('online.joinTitle')}</h2><p>{t('online.joinDescription')}</p></div>
        <label htmlFor="room-code">{t('online.roomCode')}</label><input id="room-code" value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} maxLength={6} autoCapitalize="characters" autoComplete="off" placeholder={t('online.codeExample')} />
        <button className="quiet-button" type="submit" disabled={busy}>{t('online.join')}</button>
      </form>
      {error && <p className="inline-error" role="alert">{error}</p>}
      <p className="no-chat-note"><Shield size={15} aria-hidden />{t('online.noChat')}</p>
    </main>
  );
}

function RoomPage() {
  const { t } = useTranslation();
  const { code: routeCode = '' } = useParams();
  const code = routeCode.toUpperCase();
  const navigate = useNavigate();
  const [guest, setGuest] = useState<Identity | null>(null);
  const [loadState, setLoadState] = useState<'loading' | 'found' | 'missing' | 'error'>('loading');
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [copyState, setCopyState] = useState(false);
  const [session] = useState(() => createOnlineSession(infiniteChess));
  const snapshot = session((state) => state.snapshot);
  const game = session((state) => state.game);
  const version = session((state) => state.version);
  const you = session((state) => state.you);
  const result = session((state) => state.result);
  const connection = session((state) => state.connection);
  const lastError = session((state) => state.lastError);

  useEffect(() => {
    let active = true;
    void identity.ensureIdentity().then((value) => active && setGuest(value)).catch(() => active && setLoadState('error'));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!guest) return;
    let active = true;
    void fetchRoom(code).then((room) => {
      if (active) setLoadState(room ? 'found' : 'missing');
    }).catch(() => active && setLoadState('error'));
    return () => { active = false; };
  }, [code, guest]);

  useEffect(() => {
    if (!guest || loadState !== 'found') return;
    const socket = openGameConnection(code, guest.token, {
      onMessage: (message) => {
        const current = session.getState();
        current.receive(message);
        if (message.type === 'error' && current.snapshot) {
          session.getState().receive({ type: 'state', you: current.you, game: current.snapshot }, current.receivedAt);
          session.setState({ lastError: message.code });
        }
      },
      onStatus: (status) => { setConnectionStatus(status); session.getState().setConnection(status); },
    });
    session.getState().bindSender(socket.send);
    return () => socket.close();
  }, [code, guest, loadState, session]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${location.origin}/room/${code}`);
      setCopyState(true);
    } catch { setCopyState(false); }
  };

  if (loadState === 'missing') return <main className="online-layout"><p className="inline-error">{t('online.roomNotFound')}</p><Link className="primary-button" to="/online">{t('online.backToLobby')}<ArrowRight size={16} aria-hidden /></Link></main>;
  if (loadState === 'error') return <main className="online-layout"><p className="inline-error">{t('online.connectionError')}</p><Link className="primary-button" to="/online">{t('online.backToLobby')}<ArrowRight size={16} aria-hidden /></Link></main>;
  if (!snapshot) return <main className="online-layout room-loading"><LoaderCircle className="spin" size={22} aria-hidden /><span>{t('online.connecting')}</span></main>;
  if (snapshot.status === 'waiting') return (
    <main className="waiting-layout">
      <span className="waiting-mark"><Globe2 size={23} aria-hidden /></span>
      <p className="eyebrow">{t('online.waitingEyebrow')}</p><h1>{t('online.waitingTitle')}</h1><p>{t('online.shareHint')}</p>
      <div className="room-code" data-testid="room-code">{code}</div>
      <button className="primary-button" type="button" onClick={copyLink}>{copyState ? <Check size={17} aria-hidden /> : <Share2 size={17} aria-hidden />}{copyState ? t('online.copied') : t('online.copyLink')}</button>
      <p className="waiting-status"><LoaderCircle className="spin" size={15} aria-hidden />{t('online.waitingFor')}</p>
      <button className="text-button" type="button" onClick={() => navigate('/online')}>{t('online.cancelRoom')}</button>
    </main>
  );

  const inputEnabled = Boolean(you && you === game.turn && connection === 'open' && !result);
  const send = session.getState().send;
  const onlineStatus = game.status();
  const players = snapshot.players;
  return (
    <main className="game-layout online-game-layout">
      <div className="game-topline"><span className="eyebrow">{t('online.roomLabel')} · {code}</span><span className={`connection-pill${connection === 'open' ? ' is-open' : ''}`}>{connection === 'open' ? <Wifi size={13} aria-hidden /> : <LoaderCircle className="spin" size={13} aria-hidden />}{t(`online.connection.${connectionStatus}`)}</span></div>
      {connection !== 'open' && <p className="connection-warning" role="status">{t('online.reconnecting')}</p>}
      {lastError && <p className="inline-error" role="alert">{t('online.moveRejected')}</p>}
      <div className="game-columns">
        <div className="board-column">
          <div className={`turn-banner${game.inCheck() ? ' is-check' : ''}`}><span>{game.inCheck() ? t('game.check') : t('game.toMove')}</span><b>{result ? t('online.gameFinished') : you === game.turn ? t('game.you') : t('online.opponent')}</b></div>
          <InfiniteBoard game={game} version={version} inputEnabled={inputEnabled} onMove={(uci) => Boolean(session.getState().move(uci))} />
          <div className="game-actions">
            {!result && <button className="quiet-button" type="button" onClick={() => send({ type: 'offerDraw' })} disabled={snapshot.drawOfferBy !== null}><Handshake size={15} aria-hidden />{t('game.draw')}</button>}
            {!result && <button className="quiet-button quiet-danger" type="button" onClick={() => send({ type: 'resign' })}><X size={15} aria-hidden />{t('game.resign')}</button>}
            {result && <button className="quiet-button" type="button" onClick={() => send({ type: 'rematch' })}>{t('online.rematch')}</button>}
            <button className="text-button" type="button" onClick={() => navigate('/online')}>{t('online.leave')}</button>
          </div>
          {snapshot.drawOfferBy && snapshot.drawOfferBy !== you && !result && <div className="result-banner"><span>{t('online.drawOffered')}</span><button type="button" onClick={() => send({ type: 'acceptDraw' })}>{t('online.acceptDraw')}</button><button type="button" onClick={() => send({ type: 'declineDraw' })}>{t('online.declineDraw')}</button></div>}
          {result && <div className="result-banner" role="status"><Check size={17} aria-hidden /><span>{result.winner ? t('game.winner', { color: t(`colors.${result.winner}`) }) : t(`status.${result.reason}`)}</span></div>}
        </div>
        <aside className="move-panel">
          <div className="move-panel-heading"><span className="eyebrow">{t('game.record')}</span><span>{game.moves().length} {t('game.plies')}</span></div>
          {(['w', 'b'] as const).map((color) => <div className="seat-card" key={color}><span className={`seat-piece seat-${color === 'w' ? 'white' : 'black'}`}>{color === 'w' ? '♔' : '♚'}</span><div><b>{players[color]?.name ?? t('online.waitingSeat')}</b><small>{t(`colors.${color}`)}</small></div><i className={game.turn === color && !result ? 'is-active' : ''} /></div>)}
          <div className="move-list" aria-label={t('game.moveList')}>
            {game.moves().length === 0 ? <p className="empty-record">{t('game.noMoves')}</p> : game.moves().map((move, index) => <div className="move-record" key={`${move.uci}-${index}`}><span>{Math.floor(index / 2) + 1}{index % 2 ? '…' : '.'}</span><code>{move.uci}</code></div>)}
          </div>
          <div className="rule-note"><Shield size={16} aria-hidden /><p>{t('online.validated')}</p></div>
        </aside>
      </div>
      {onlineStatus.kind !== 'ongoing' && !result && <p className="inline-error">{t(`status.${statusText(onlineStatus)}`)}</p>}
    </main>
  );
}

function About() {
  const { t } = useTranslation();
  return <main className="simple-layout"><Link className="back-link" to="/"><ArrowLeft size={15} aria-hidden />{t('nav.home')}</Link><div className="section-heading"><p className="eyebrow">{t('about.eyebrow')}</p><h1>{t('about.title')}</h1></div><section className="about-card"><p>{t('about.description')}</p><h2>{t('about.rules')}</h2><p>{t('about.rulesText')}</p><h2>{t('about.license')}</h2><p>{t('about.licenseText')}</p><a href="https://github.com/socheek-del/chaturanga/tree/main" target="_blank" rel="noreferrer">{t('footer.source')}<ArrowDownRight size={15} aria-hidden /></a></section></main>;
}

export default function App() {
  return <div className="app-shell"><Header /><Routes>
    <Route path="/" element={<Home />} />
    <Route path="/play" element={<PlaySetup />} />
    <Route path="/game" element={<LocalGame />} />
    <Route path="/learn" element={<TutorialIndex />} />
    <Route path="/learn/:lessonId" element={<TutorialRoute />} />
    <Route path="/online" element={<OnlineLobby />} />
    <Route path="/room/:code" element={<RoomPage key={location.pathname} />} />
    <Route path="/about" element={<About />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes><Footer /></div>;
}
