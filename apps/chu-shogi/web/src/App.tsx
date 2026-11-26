import { storageKey } from '@chaturanga/game-shell';
import { GameScreen, LessonPlayer, undoAllowed, useFocusModeProvider } from '@chaturanga/game-shell/ui';
import { parseUci } from '@chaturanga/board-ui';
import { Button, Card } from '@chaturanga/ui';
import { chuShogiVariant, Game, PIECE_TYPES, START_FEN, squareName } from '@chaturanga/chu-shogi';
import { BOTS, botById } from '@chaturanga/chu-shogi-ai';
import type { Color } from '@chaturanga/rules-core';
import { ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, Bot, Compass, Grid3X3, Moon, Sun, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, Route, Routes, useNavigate, useParams } from 'react-router';
import { PRODUCT } from '../product.config';
import { useBoardIdentity } from './board';
import { PieceGlyph, activeRank } from './components/PieceGlyph';
import { cancelComputerMove, requestComputerMove } from './features/ai/aiClient';
import { ALL_LESSONS, LESSON_UNITS } from './lessons/lessons';
import { PROMOTION_GUIDE, RANK_GUIDE } from './lessons/pieceAtlas';
import { useBotBlackSession, useBotWhiteSession, useLocalSession } from './stores/sessions';

type Mode = 'bot' | 'local';
type SessionStore = typeof useLocalSession;
const sessionFor = (mode: Mode, side: Color): SessionStore => mode === 'local' ? useLocalSession : side === 'w' ? useBotWhiteSession : useBotBlackSession;
const PIECE_VALUES: Record<string, number> = Object.fromEntries(PIECE_TYPES.map((type, index) => [type, [1000, 900, 850, 600, 500, 450, 400, 400, 360, 350, 320, 310, 300, 270, 250, 240, 220, 210, 190, 120, 100][index] ?? 100]));
const lessonStarsKey = (id: string) => storageKey(PRODUCT, `lesson.${id}.stars`);

function Home() {
  const { t } = useTranslation();
  const hero = new Game(START_FEN);
  return <section className="meridian-home">
    <div className="home-copy">
      <p className="eyebrow"><span />{t('home.edition')}</p>
      <h1>{t('home.title')}</h1>
      <p className="home-intro">{t('home.intro')}</p>
      <div className="home-actions">
        <Link className="action-primary" to="/play"><Bot size={17} aria-hidden />{t('home.playBot')}<ArrowUpRight size={16} aria-hidden /></Link>
        <Link className="action-secondary" to="/play?mode=local"><Users size={17} aria-hidden />{t('home.passAndPlay')}<ArrowRight size={16} aria-hidden /></Link>
        <Link className="action-secondary" to="/learn"><BookOpen size={17} aria-hidden />{t('home.learn')}<ArrowRight size={16} aria-hidden /></Link>
        <Link className="action-secondary" to="/atlas"><Grid3X3 size={17} aria-hidden />{t('home.atlas')}<ArrowRight size={16} aria-hidden /></Link>
      </div>
      <p className="edition-note">{t('home.profile')}</p>
    </div>
    <div className="opening-figure">
      <div className="figure-heading"><span>{t('home.diagram')}</span><span>12 × 12</span></div>
      <div className="mini-board" aria-label={t('board.label')}>
        {Array.from({ length: 144 }, (_, i) => {
          const square = (11 - Math.floor(i / 12)) * 12 + i % 12;
          const piece = hero.pieceAt(square);
          return <div className="mini-cell" key={square}>{piece && <PieceGlyph piece={piece} />}</div>;
        })}
      </div>
      <div className="figure-caption"><span>{t('home.boardCaption')}</span><Compass size={17} aria-hidden /></div>
    </div>
  </section>;
}

function PlaySetup() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const [mode, setMode] = useState<Mode>(params.get('mode') === 'local' ? 'local' : 'bot');
  const [humanColor, setHumanColor] = useState<Color>('w');
  const [level, setLevel] = useState(2);
  const bot = botById(level);
  const start = () => {
    sessionFor(mode, humanColor).getState().start(null);
    navigate(`/game/${mode}/${mode === 'local' ? 'w' : humanColor}/${level}`);
  };
  return <section className="content-page setup-page">
    <BackLink />
    <p className="eyebrow"><span />{t('setup.eyebrow')}</p><h1>{t('setup.title')}</h1><p className="page-intro">{t('setup.intro')}</p>
    <div className="setup-label">{t('setup.mode')}</div>
    <div className="mode-grid">
      <button type="button" aria-pressed={mode === 'bot'} className={mode === 'bot' ? 'mode-card selected' : 'mode-card'} onClick={() => setMode('bot')}><Bot /><span><strong>{t('setup.bot')}</strong><small>{t('setup.botDetail')}</small></span></button>
      <button type="button" aria-pressed={mode === 'local'} className={mode === 'local' ? 'mode-card selected' : 'mode-card'} onClick={() => setMode('local')}><Users /><span><strong>{t('setup.local')}</strong><small>{t('setup.localDetail')}</small></span></button>
    </div>
    {mode === 'bot' && <section className="setup-block">
      <div className="setup-heading"><div><p className="eyebrow"><span />{t('setup.strength')}</p><h2>{t(`bots.${bot.key}.name`)}</h2><p>{t(`bots.${bot.key}.description`)}</p></div><span className="level-count">{t('setup.levelCount', { count: BOTS.length })}</span></div>
      <div className="level-grid" role="group" aria-label={t('setup.strength')}>
        {BOTS.map((item) => <button key={item.id} type="button" aria-pressed={level === item.id} className={level === item.id ? 'level selected' : 'level'} onClick={() => setLevel(item.id)}><span>0{item.id}</span>{t(`bots.${item.key}.name`)}</button>)}
      </div>
      <p className="setup-label">{t('setup.side')}</p>
      <div className="side-grid" role="group" aria-label={t('setup.side')}>
        {(['w', 'b'] as const).map((color) => <button key={color} type="button" aria-pressed={humanColor === color} className={humanColor === color ? 'side-card selected' : 'side-card'} onClick={() => setHumanColor(color)}><PieceGlyph piece={{ color, type: 'king', promoted: false }} />{t(`colors.${color}`)}</button>)}
      </div>
    </section>}
    {mode === 'local' && <Card className="local-note">{t('setup.localNote')}</Card>}
    <Button size="lg" onClick={start}>{t('setup.start')}<ArrowRight className="h-5 w-5" aria-hidden /></Button>
  </section>;
}

function seedOf(value: string): number {
  let hash = 2166136261;
  for (const char of value) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return hash >>> 0;
}

function GameRoute() {
  const { mode: rawMode, side, level: rawLevel } = useParams();
  if ((rawMode !== 'bot' && rawMode !== 'local') || (side !== 'w' && side !== 'b')) return <Navigate to="/play" replace />;
  const level = Number(rawLevel);
  if (!Number.isInteger(level) || level < 1 || level > BOTS.length) return <Navigate to="/play" replace />;
  return <ActiveGameRoute mode={rawMode} side={side} level={level} />;
}

function ActiveGameRoute({ mode, side, level }: { mode: Mode; side: Color; level: number }) {
  const store = sessionFor(mode, side);
  return store((state) => state.phase) === 'playing' ? <GameView mode={mode} humanColor={side} level={level} store={store} /> : <Navigate to="/play" replace />;
}

function GameView({ mode, humanColor, level, store }: { mode: Mode; humanColor: Color; level: number; store: SessionStore }) {
  const { t } = useTranslation();
  const board = useBoardIdentity();
  const game = store((state) => state.game);
  const version = store((state) => state.version);
  const result = store((state) => state.result);
  const viewPly = store((state) => state.viewPly);
  const flipped = store((state) => state.flipped);
  const [thinking, setThinking] = useState(false);
  const bot = botById(level);
  const opponentColor: Color = humanColor === 'w' ? 'b' : 'w';
  const opponentName = t(`bots.${bot.key}.name`);
  useEffect(() => {
    if (mode !== 'bot' || result || game.turn === humanColor || viewPly !== null) { setThinking(false); return; }
    const fen = game.fen();
    const current = store.getState();
    const moves = game.moves().map((move) => move.uci);
    let active = true;
    setThinking(true);
    requestComputerMove(current.startFen, moves, level, seedOf(current.startFen + moves.join('|')))
      .then((answer) => {
        const latest = store.getState();
        if (!active || latest.game.fen() !== fen || latest.result) return;
        const move = answer.uci && latest.game.legalUci().includes(answer.uci) ? answer.uci : latest.game.legalUci()[0];
        if (move) latest.move(move);
      })
      .catch((error: unknown) => {
        if (!active) return;
        const latest = store.getState();
        if (latest.game.fen() === fen && !latest.result) {
          const fallback = latest.game.legalUci()[0];
          if (fallback) latest.move(fallback);
        }
        if (!(error instanceof Error && error.name === 'AiCancelled')) console.error('Chu Shogi bot failed; played a legal fallback.', error);
      })
      .finally(() => { if (active) setThinking(false); });
    return () => { active = false; cancelComputerMove(); setThinking(false); };
  }, [game, humanColor, level, mode, result, store, version, viewPly]);
  const canUndo = mode === 'local' ? undoAllowed({ game, result }) : game.moves().some((move) => move.color === humanColor) && undoAllowed({ game, result });
  const takeback = () => {
    cancelComputerMove();
    const current = store.getState();
    if (!undoAllowed(current)) return;
    if (mode === 'bot' && current.game.turn === humanColor) current.undo();
    current.undo();
  };
  return <section className="content-page game-page">
    <div className="game-heading"><div><p className="eyebrow"><span />{mode === 'bot' ? t('game.botLabel', { name: opponentName }) : t('game.localLabel')}</p><h1>{mode === 'bot' ? t('home.playBot') : t('home.passAndPlay')}</h1></div><span className="save-indicator">{t('game.saved')}</span></div>
    <GameScreen
      variant={chuShogiVariant} useSession={store}
      title={mode === 'bot' ? t('home.playBot') : t('home.passAndPlay')}
      orientation={flipped ? 'b' : mode === 'bot' ? humanColor : 'w'}
      names={mode === 'bot' ? ({ [humanColor]: t('game.you'), [opponentColor]: opponentName } as Record<Color, string>) : { w: t('colors.w'), b: t('colors.b') }}
      inputEnabled={mode === 'local' || game.turn === humanColor}
      canUndo={canUndo} onUndo={takeback} resignColor={mode === 'local' ? game.turn : humanColor}
      status={<p className={`thinking-status${thinking ? '' : ' idle'}`} aria-live="polite">{thinking ? t('game.thinking', { name: opponentName }) : '\u00a0'}</p>}
      onRematch={() => { cancelComputerMove(); store.getState().start(null); }}
      {...board} pieceValues={PIECE_VALUES} boardSizing="scroll" avatarType="king" showCheckStatus={false}
      routeChoiceTitle={t('play.chooseRoute')}
      describeRouteChoice={(uci) => {
        const move = parseUci(uci, 12);
        if (move?.kind !== 'move') return uci;
        const route = [move.from, ...move.path].map(squareName).join(' → ');
        const copy = new Game(game.fen());
        const record = copy.move(uci);
        const capturedPieces = record.captures ?? [];
        const moverColor = game.pieceAt(move.from)?.color;
        const captureSquares = move.path.filter((square) => {
          const target = game.pieceAt(square);
          return target !== null && target.color !== moverColor;
        });
        const captures = capturedPieces.length ? ` · ${t('play.captures', {
          count: capturedPieces.length,
          pieces: capturedPieces.map((piece, index) => t('play.captureAt', {
            square: captureSquares[index] === undefined ? '' : squareName(captureSquares[index]!),
            piece: t(`pieces.${piece.type}`),
          })).join(' · '),
        })}` : '';
        return `${route}${captures}${move.promotion ? ` · ${t('play.promotion')}` : ''}`;
      }}
      describePromotion={(piece) => {
        const rank = activeRank({ ...piece, promoted: true });
        return rank ? t(`atlas.ranks.${rank.nameKey}.name`) : t('play.promotedRank');
      }}
    />
  </section>;
}

function Atlas() {
  const { t } = useTranslation();
  return <section className="content-page atlas-page"><BackLink /><p className="eyebrow"><span />{t('atlas.eyebrow')}</p><h1>{t('atlas.title')}</h1><p className="page-intro">{t('atlas.intro')}</p>
    <div className="atlas-counts"><span><strong>29</strong>{t('atlas.rankCount')}</span><span><strong>18</strong>{t('atlas.promotionCount')}</span></div>
    <div className="rank-grid">{RANK_GUIDE.map((rank) => <Card className="rank-card" key={rank.id}>
      <PieceGlyph piece={{ color: 'w', type: rank.type, promoted: rank.promoted }} />
      <div><h2>{t(`atlas.ranks.${rank.nameKey}.name`)}</h2><p>{t(`atlas.ranks.${rank.movementKey}.movement`)}</p></div>
      <span className="rank-code">{rank.abbreviation}</span>
    </Card>)}</div>
    <section className="promotion-list"><h2>{t('atlas.promotionsTitle')}</h2>{PROMOTION_GUIDE.map(({ from, to }) => {
      const target = RANK_GUIDE.find((rank) => rank.id === to) ?? RANK_GUIDE.find((rank) => rank.type === to && !rank.promoted);
      return <div className="promotion-row" key={from}><span>{t(`pieces.${from}`)}</span><span aria-hidden>→</span><strong>{target ? t(`atlas.ranks.${target.nameKey}.name`) : to}</strong></div>;
    })}</section>
  </section>;
}

function Learn() {
  const { t } = useTranslation();
  return <section className="content-page learn-page"><BackLink /><p className="eyebrow"><span />{t('learn.eyebrow')}</p><h1>{t('learn.title')}</h1><p className="page-intro">{t('learn.intro')}</p>
    {LESSON_UNITS.map((unit, unitIndex) => <section className="lesson-unit" key={unit.id}><div className="unit-heading"><span>0{unitIndex + 1}</span><h2>{unit.title.en}</h2></div>
      {unit.lessons.map((lesson, lessonIndex) => {
        const stars = localStorage.getItem(lessonStarsKey(lesson.id));
        return <Link className="lesson-row" key={lesson.id} to={`/lesson/${lesson.id}`}><span className="lesson-number">{String(lessonIndex + 1).padStart(2, '0')}</span><span className="lesson-main"><strong>{lesson.title.en}</strong><small>{lesson.summary.en}</small></span><span className="lesson-state">{stars ? t('learn.stars', { count: stars }) : `${lesson.steps.length} ${t('learn.steps')}`}<ArrowUpRight size={15} aria-hidden /></span></Link>;
      })}
    </section>)}
  </section>;
}

function Tutorial({ lessonId }: { lessonId?: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const lesson = ALL_LESSONS.find((candidate) => candidate.id === lessonId) ?? ALL_LESSONS[0]!;
  const board = useBoardIdentity();
  const finish = useCallback((stars: number) => { localStorage.setItem(lessonStarsKey(lesson.id), String(stars)); navigate('/learn'); }, [lesson.id, navigate]);
  return <LessonPlayer {...board} variant={chuShogiVariant} lesson={lesson} translate={(text) => text.en ?? ''} onExit={() => navigate('/learn')} onFinish={finish} routeChoiceTitle={t('play.chooseRoute')} describeRouteChoice={(uci, path) => `${path.map(squareName).join(' → ')}${uci.endsWith('+') ? ` · ${t('play.promotion')}` : ''}`} />;
}

function BackLink() {
  const { t } = useTranslation();
  return <Link className="back-link" to="/" aria-label={t('nav.home')}><ArrowLeft size={16} aria-hidden />{t('nav.home')}</Link>;
}

export function App() {
  const { t } = useTranslation();
  const { focus, FocusProvider } = useFocusModeProvider();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem(storageKey(PRODUCT, 'theme'));
    return saved === 'light' || saved === 'dark' ? saved : window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(storageKey(PRODUCT, 'theme'), theme);
  }, [theme]);
  return <div className={`meridian-app${focus ? ' is-focused' : ''}`}>
    <header className="site-header"><Link to="/" className="wordmark"><span className="wordmark-mark"><Compass size={19} aria-hidden /></span><span><strong>{t('home.title')}</strong><small>{t('home.brandLine')}</small></span></Link>
      {focus ? <Link className="header-back" to={focus === 'game' ? '/play' : '/learn'}><ArrowLeft size={15} aria-hidden />{t('nav.leave')}</Link> : <nav className="top-nav" aria-label={t('nav.label')}><Link to="/play">{t('nav.play')}</Link><Link to="/learn">{t('nav.learn')}</Link><Link to="/atlas">{t('nav.atlas')}</Link></nav>}
      {!focus && <button className="theme-toggle" type="button" aria-label={t('theme.toggle')} title={t('theme.toggle')} onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
        {theme === 'light' ? <Moon size={15} aria-hidden /> : <Sun size={15} aria-hidden />}<span>{t(theme === 'light' ? 'theme.dark' : 'theme.light')}</span>
      </button>}
    </header>
    <main><FocusProvider><Routes>
      <Route index element={<Home />} /><Route path="play" element={<PlaySetup />} /><Route path="game/:mode/:side/:level" element={<GameRoute />} />
      <Route path="learn" element={<Learn />} /><Route path="tutorial" element={<Navigate to={`/lesson/${ALL_LESSONS[0]!.id}`} replace />} /><Route path="lesson/:id" element={<TutorialRoute />} />
      <Route path="atlas" element={<Atlas />} /><Route path="*" element={<Navigate to="/" replace />} />
    </Routes></FocusProvider></main>
    {!focus && <footer className="site-footer"><span>{t('home.footer')}</span><Link to="/learn">{t('nav.learn')}</Link></footer>}
  </div>;
}

function TutorialRoute() {
  const { id = '' } = useParams();
  return ALL_LESSONS.some((lesson) => lesson.id === id) ? <Tutorial lessonId={id} /> : <Navigate to="/learn" replace />;
}
