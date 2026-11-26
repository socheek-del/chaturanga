import { Button, Card } from '@chaturanga/ui';
import { Game, PIECE_TYPES, arimaa, type PieceType } from '@chaturanga/arimaa';
import { BOTS, botById } from '@chaturanga/arimaa-ai';
import { mulberry32 } from '@chaturanga/ai-core';
import type { Dispatch, SetStateAction } from 'react';
import { squareName, type Color, type Square } from '@chaturanga/rules-core';
import { ArrowDownRight, ArrowLeft, ArrowRight, BookOpen, Bot, Compass, Moon, Sun, Users } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router';
import { PRODUCT } from '../product.config';
import { ArimaaBoard, PieceMark } from './board';
import { TurnEditor } from './components/TurnEditor';
import { AiCancelled, cancelBotMove, requestBotMove } from './features/ai/aiClient';
import { LearnIndex, LessonRoute } from './tutorial';

type Mode = 'bot' | 'local';
interface SavedSession {
  mode: Mode;
  humanColor: Color;
  botId: number;
  seed: number;
  startFen: string;
  moves: string[];
}

const STORAGE_KEY = `${PRODUCT.storagePrefix}session.current`;

function restoreSession(session: SavedSession): Game {
  const game = new Game(session.startFen);
  for (const move of session.moves) game.move(move);
  return game;
}

function rabbitsLeft(game: Game, color: Color): number {
  return game.pieces().filter(({ piece }) => piece.color === color && piece.type === 'r').length + game.hand(color).filter((piece) => piece === 'r').length;
}

function readSession(): SavedSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as SavedSession;
    if ((value.mode !== 'bot' && value.mode !== 'local') || (value.humanColor !== 'w' && value.humanColor !== 'b') || !Number.isInteger(value.botId) || !Number.isInteger(value.seed) || typeof value.startFen !== 'string' || !Array.isArray(value.moves)) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    restoreSession(value);
    return value;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function FieldIllustration() {
  const { t } = useTranslation();
  const demo = useMemo(() => new Game('8/8/8/2Rr4/2Ec4/8/8/8 w - - 0 1'), []);
  return <div className="field-illustration">
    <div className="illustration-heading"><span>{t('home.diagram')}</span><span>{t('home.coordinates')}</span></div>
    <ArimaaBoard game={demo} orientation="w" disabled />
    <div className="illustration-footer"><span>{t('home.diagramCaption')}</span><ArrowDownRight size={17} aria-hidden /></div>
  </div>;
}

function Home({ hasSaved }: { hasSaved: boolean }) {
  const { t } = useTranslation();
  return <main className="home-page page-width">
    <section className="home-copy">
      <p className="eyebrow"><span className="eyebrow-mark" />{t('home.eyebrow')}</p>
      <h1>{t('home.title').split('\n').map((line) => <span key={line}>{line}</span>)}</h1>
      <p className="home-intro">{t('home.intro')}</p>
      <div className="home-links">
        <Link to="/play" className="action-card action-primary"><Bot size={19} aria-hidden /><span>{t('home.playBot')}</span><ArrowRight size={17} aria-hidden /></Link>
        <Link to="/play?mode=local" className="action-card"><Users size={18} aria-hidden /><span>{t('home.passPlay')}</span><ArrowRight size={17} aria-hidden /></Link>
        <Link to="/learn" className="action-card"><BookOpen size={18} aria-hidden /><span>{t('home.learn')}</span><ArrowRight size={17} aria-hidden /></Link>
        <Link to="/online" className="action-card"><Compass size={18} aria-hidden /><span>{t('home.online')}</span><ArrowRight size={17} aria-hidden /></Link>
        {hasSaved && <Link to="/game" className="resume-link">{t('home.resume')} <ArrowRight size={16} aria-hidden /></Link>}
      </div>
      <p className="home-signature"><span className="signature-dot" />{t('home.signature')}</p>
    </section>
    <FieldIllustration />
  </main>;
}

function PlaySetup({ onStart }: { onStart: (session: SavedSession) => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const [mode, setMode] = useState<Mode>(params.get('mode') === 'local' ? 'local' : 'bot');
  const [humanColor, setHumanColor] = useState<Color>('w');
  const [botId, setBotId] = useState(2);
  const selectedBot = botById(botId);

  const start = () => {
    const seed = crypto.getRandomValues(new Uint32Array(1))[0] ?? 1;
    onStart({ mode, humanColor, botId, seed, startFen: arimaa.startFen, moves: [] });
    navigate('/game');
  };

  return <main className="setup-page page-width">
    <header className="page-heading">
      <Link className="back-link" to="/"><ArrowLeft size={16} aria-hidden />{t('nav.home')}</Link>
      <p className="eyebrow"><span className="eyebrow-mark" />{t('setup.eyebrow')}</p>
      <h1>{t('setup.title')}</h1>
      <p>{t('setup.intro')}</p>
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
      <div className="form-heading"><div><p className="field-label">{t('setup.strength')}</p><h2>{t(`bots.${selectedBot.key}.name`)}</h2><p>{t(`bots.${selectedBot.key}.description`)}</p></div><span className="bot-count">0{botId} / 06</span></div>
      <div className="bot-levels" role="group" aria-label={t('setup.strength')}>
        {BOTS.map((bot) => <button key={bot.id} type="button" aria-pressed={botId === bot.id} onClick={() => setBotId(bot.id)} className={`bot-level${botId === bot.id ? ' is-active' : ''}`}>
          <span>0{bot.id}</span>{t(`bots.${bot.key}.name`)}
        </button>)}
      </div>
      <div className="form-heading side-heading"><div><p className="field-label">{t('setup.side')}</p><h2>{t('setup.playAs')}</h2></div></div>
      <div className="side-choices" role="group" aria-label={t('setup.playAs')}>
        {(['w', 'b'] as const).map((color) => <button key={color} type="button" aria-pressed={humanColor === color} className={`side-choice${humanColor === color ? ' is-active' : ''}`} onClick={() => setHumanColor(color)}>
          <PieceMark piece={{ color, type: 'e', promoted: false }} compact /><span>{t(`colors.${color}`)}</span>
        </button>)}
      </div>
      <p className="form-note">{t('setup.firstTurn')}</p>
    </section>}
    {mode === 'local' && <Card className="form-note-card"><Users size={20} aria-hidden /><p>{t('setup.localNote')}</p></Card>}
    <div className="setup-actions"><Button size="lg" onClick={start}>{t('setup.start')}<ArrowRight className="h-5 w-5" aria-hidden /></Button></div>
  </main>;
}

function SetupControls({ game, disabled, botName, onPlace }: { game: Game; disabled: boolean; botName: string; onPlace: (uci: string) => void }) {
  const { t } = useTranslation();
  const hand = game.hand(game.turn);
  const [selected, setSelected] = useState<PieceType | null>(null);
  useEffect(() => {
    if (selected && !hand.includes(selected)) setSelected(null);
  }, [hand, selected]);
  const activeType = selected ?? hand[0] ?? null;

  const clickSquare = (square: Square) => {
    if (!activeType || disabled) return;
    const uci = `${activeType.toUpperCase()}@${squareName(square)}`;
    if (game.legalUci().includes(uci)) onPlace(uci);
  };

  return <>
    <ArimaaBoard game={game} orientation={game.turn} disabled={disabled || hand.length === 0} onSquare={clickSquare} />
    <Card className="setup-tray">
      <div className="tray-heading"><div><p className="field-label">{t('setup.chooseSetup')}</p><h2>{t('setup.available')}: {hand.length}</h2></div><span className="side-stamp">{t(`colors.${game.turn}`)}</span></div>
      <p>{t('setup.setupHint')}</p>
      <div className="piece-tray" role="group" aria-label={t('setup.available')}>
        {PIECE_TYPES.map((type) => {
          const count = hand.filter((piece) => piece === type).length;
          return <button key={type} type="button" className={`tray-piece${activeType === type ? ' is-active' : ''}`} aria-pressed={activeType === type} disabled={disabled || count === 0} onClick={() => setSelected(type)}>
            <PieceMark piece={{ color: game.turn, type, promoted: false }} compact /><span>{t(`pieces.${type}`)}</span><b>{count}</b>
          </button>;
        })}
      </div>
      <p className="placement-status" aria-live="polite">{disabled ? t('game.thinking', { name: botName }) : t('setup.selected', { piece: activeType ? t(`pieces.${activeType}`) : t('setup.none') })}</p>
    </Card>
  </>;
}

function statusCopy(game: Game, t: ReturnType<typeof useTranslation>['t']): { title: string; body: string } {
  const status = game.status();
  if (status.kind === 'ongoing') return { title: '', body: '' };
  const winner = 'winner' in status ? status.winner : undefined;
  const title = winner ? t('game.result', { winner: t(`game.winner${winner === 'w' ? 'Gold' : 'Silver'}`) }) : t('game.draw');
  const bodyKey = status.kind === 'goal-square' ? 'game.resultGoal' : status.kind === 'elimination' ? 'game.resultElimination' : status.kind === 'stalemate' ? 'game.resultImmobile' : status.kind === 'repetition' ? 'game.resultRepetition' : 'game.resultOther';
  return { title, body: t(bodyKey) };
}

function GamePage({ session, game, thinking, onMove, onNewGame }: {
  session: SavedSession;
  game: Game;
  thinking: boolean;
  onMove: (uci: string) => void;
  onNewGame: () => void;
}) {
  const { t } = useTranslation();
  const inSetup = game.hand('w').length + game.hand('b').length > 0;
  const status = statusCopy(game, t);
  const bot = botById(session.botId);
  const activeHuman = session.mode === 'local' || game.turn === session.humanColor;
  const busy = thinking || (session.mode === 'bot' && !activeHuman);

  return <main className="game-page page-width">
    <header className="game-topline">
      <Link className="back-link" to="/"><ArrowLeft size={16} aria-hidden />{t('nav.home')}</Link>
      <span className="save-indicator"><span />{t('game.saved')}</span>
    </header>
    <div className="game-layout">
      <section className="board-column">
        <div className="player-strip">
          <div className={`player-card${game.turn === 'b' ? ' is-current' : ''}`}><span className="player-token silver-token">S</span><span><small>{session.mode === 'bot' && session.humanColor === 'b' ? t('game.human') : session.mode === 'bot' ? t('game.opponent', { name: t(`bots.${bot.key}.name`) }) : t('game.silver')}</small><strong>{t('colors.b')}</strong></span><b>{rabbitsLeft(game, 'b')} / 8</b></div>
          <div className={`player-card${game.turn === 'w' ? ' is-current' : ''}`}><span className="player-token gold-token">G</span><span><small>{session.mode === 'bot' && session.humanColor === 'w' ? t('game.human') : session.mode === 'bot' ? t('game.opponent', { name: t(`bots.${bot.key}.name`) }) : t('game.gold')}</small><strong>{t('colors.w')}</strong></span><b>{rabbitsLeft(game, 'w')} / 8</b></div>
        </div>
        <div className="turn-status" aria-live="polite">
          {status.title ? <><strong>{status.title}</strong><span>{status.body}</span></> : thinking ? <strong>{t('game.thinking', { name: t(`bots.${bot.key}.name`) })}</strong> : inSetup ? <strong>{t('game.place', { color: t(`colors.${game.turn}`), remaining: game.hand(game.turn).length })}</strong> : <strong>{t('game.toMove', { color: t(`colors.${game.turn}`) })}</strong>}
        </div>
        {inSetup
          ? <SetupControls game={game} disabled={busy} botName={t(`bots.${bot.key}.name`)} onPlace={onMove} />
          : <TurnEditor game={game} disabled={busy || Boolean(status.title)} onCommit={onMove} />}
      </section>
      <aside className="game-aside">
        {status.title && <Card className="result-card"><p className="field-label">{t('game.resultOther')}</p><h2>{status.title}</h2><p>{status.body}</p><Button onClick={onNewGame}>{t('game.newGame')}</Button></Card>}
        <Card className="move-record">
          <div className="record-heading"><div><p className="field-label">{t('game.lastMoves')}</p><h2>{game.moves().length}</h2></div><span className="step-stamp">4<br /><small>MAX</small></span></div>
          {game.moves().length === 0 ? <p className="empty-record">{t('game.noMoves')}</p> : <ol>{game.moves().slice(-12).reverse().map((move, index) => <li key={`${move.uci}-${index}`}><span>{game.moves().length - index}</span><b>{t(`colors.${move.color}`)}</b><code>{move.uci}</code></li>)}</ol>}
        </Card>
        <Card className="rules-note"><p className="field-label">{t('game.quickRule')}</p><p>{t('game.quickRuleText')}</p><Link to="/learn">{t('nav.learn')}<ArrowRight size={14} aria-hidden /></Link></Card>
        {!status.title && <Button variant="secondary" onClick={onNewGame}>{t('game.newGame')}</Button>}
      </aside>
    </div>
  </main>;
}

function OnlinePage() {
  const { t } = useTranslation();
  return <main className="page-width simple-page"><header className="page-heading"><Link className="back-link" to="/"><ArrowLeft size={16} aria-hidden />{t('nav.home')}</Link><p className="eyebrow"><span className="eyebrow-mark" />{t('online.title')}</p><h1>{t('online.title')}</h1><p>{t('online.body')}</p></header><Card className="notice-card"><Compass size={22} aria-hidden /><p>{t('online.coming')}</p><small>{t('online.noChat')}</small></Card></main>;
}

function AboutPage() {
  const { t } = useTranslation();
  return <main className="page-width simple-page"><header className="page-heading"><Link className="back-link" to="/"><ArrowLeft size={16} aria-hidden />{t('nav.home')}</Link><p className="eyebrow"><span className="eyebrow-mark" />{t('about.eyebrow')}</p><h1>{t('about.title')}</h1><p>{t('about.body')}</p></header><Card className="notice-card"><p>{t('about.licenseNotice')}</p><p>{t('about.attribution')}</p><div className="about-links"><a href="https://arimaa.com/arimaa/learn/rulesIntro.html" target="_blank" rel="noreferrer">{t('about.rules')}<ArrowRight size={14} aria-hidden /></a><a href="https://arimaa.com/arimaa/license/" target="_blank" rel="noreferrer">{t('about.license')}<ArrowRight size={14} aria-hidden /></a></div></Card></main>;
}

function GameRoute({ session, setSession }: { session: SavedSession | null; setSession: Dispatch<SetStateAction<SavedSession | null>> }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [thinking, setThinking] = useState(false);
  const game = useMemo(() => session ? restoreSession(session) : null, [session]);

  const addMove = useCallback((uci: string, expected?: { length: number; seed: number }) => {
    setSession((current) => {
      if (!current || (expected && (current.moves.length !== expected.length || current.seed !== expected.seed))) return current;
      const verifier = restoreSession(current);
      try {
        verifier.move(uci);
      } catch {
        return current;
      }
      return { ...current, moves: [...current.moves, uci] };
    });
  }, [setSession]);

  const botTurn = Boolean(session && game && session.mode === 'bot' && game.turn !== session.humanColor && game.status().kind === 'ongoing');
  useEffect(() => {
    if (!session || !game || !botTurn) {
      setThinking(false);
      return;
    }
    const seed = (session.seed ^ Math.imul(session.moves.length + 1, 0x9e3779b1)) >>> 0;
    const expected = { length: session.moves.length, seed: session.seed };
    let active = true;
    setThinking(true);
    const fallbackMove = () => {
      const fallbackGame = restoreSession(session);
      const fallback = fallbackGame.sampleLegalUci(mulberry32(seed));
      if (fallback) addMove(fallback, expected);
    };
    requestBotMove(session.startFen, session.moves, session.botId, seed)
      .then((response) => {
        if (!active) return;
        if (response.uci) {
          const verifier = restoreSession(session);
          try {
            verifier.move(response.uci);
            addMove(response.uci, expected);
            return;
          } catch {
            // Use an engine-sampled legal turn if a stale or malformed worker response arrives.
          }
        }
        fallbackMove();
      })
      .catch((error: unknown) => {
        if (!active || error instanceof AiCancelled) return;
        fallbackMove();
        console.error(t('errors.botFallback'));
      })
      .finally(() => { if (active) setThinking(false); });
    return () => { active = false; cancelBotMove(); setThinking(false); };
  }, [addMove, botTurn, game, session, t]);

  if (!session || !game) return <Navigate to="/play" replace />;
  return <GamePage session={session} game={game} thinking={thinking} onMove={(uci) => addMove(uci)} onNewGame={() => { cancelBotMove(); setThinking(false); setSession(null); navigate('/play'); }} />;
}

export default function App() {
  const { t } = useTranslation();
  const [session, setSession] = useState<SavedSession | null>(() => readSession());
  const [theme, setTheme] = useState<'light' | 'dark'>(() => localStorage.getItem(`${PRODUCT.storagePrefix}theme`) === 'dark' ? 'dark' : 'light');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(`${PRODUCT.storagePrefix}theme`, theme);
  }, [theme]);
  useEffect(() => {
    if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else localStorage.removeItem(STORAGE_KEY);
  }, [session]);

  return <div className="app-shell">
    <header className="site-header">
      <Link className="brand" to="/" aria-label={t('nav.home')}><span className="brand-symbol" aria-hidden="true"><i /><i /><i /><i /></span><span><b>ARIMAA</b><small>FIELD MANUAL</small></span></Link>
      <nav aria-label={t('nav.label')}>
        <Link to="/play">{t('nav.play')}</Link><Link to="/learn">{t('nav.learn')}</Link><Link to="/online">{t('nav.online')}</Link>
      </nav>
      <button className="theme-toggle" type="button" aria-label={t('nav.theme')} onClick={() => setTheme((current) => current === 'light' ? 'dark' : 'light')}>{theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}</button>
    </header>
    <Routes>
      <Route path="/" element={<Home hasSaved={Boolean(session)} />} />
      <Route path="/play" element={<PlaySetup onStart={setSession} />} />
      <Route path="/game" element={<GameRoute session={session} setSession={setSession} />} />
      <Route path="/learn" element={<LearnIndex />} />
      <Route path="/learn/:lessonId" element={<LessonRoute />} />
      <Route path="/online" element={<OnlinePage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    <footer className="site-footer"><span>{t('footer.independent')}</span><Link to="/about">{t('nav.about')}</Link><a href="https://arimaa.com/" target="_blank" rel="noreferrer">{t('about.site')}</a></footer>
  </div>;
}
