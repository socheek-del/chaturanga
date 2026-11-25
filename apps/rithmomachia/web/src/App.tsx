import { storageKey } from '@chaturanga/game-shell';
import { GameScreen, undoAllowed, useFocusModeProvider } from '@chaturanga/game-shell/ui';
import { parseUci } from '@chaturanga/board-ui';
import { Button, Card } from '@chaturanga/ui';
import { Game, PIECE_TYPES, PYRAMID_COMPONENTS, START_FEN, rithmomachia, squareName } from '@chaturanga/rithmomachia';
import { BOTS, botById } from '@chaturanga/rithmomachia-ai';
import type { Color, Square } from '@chaturanga/rules-core';
import { ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, Bot, Compass, Moon, Sun, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, Route as RouteView, Routes, useNavigate, useParams } from 'react-router';
import { PRODUCT } from '../product.config';
import { DISPLAY_SQUARES, promotionName, useBoardIdentity } from './board';
import { PieceArt, pieceInfo } from './components/PieceArt';
import { cancelComputerMove, requestComputerMove } from './features/ai/aiClient';
import { ALL_LESSONS, UNITS } from './lessons/lessons';
import { useBotBlackSession, useBotWhiteSession, useLocalSession } from './stores/sessions';
import { lessonStarsKey, RithmomachiaTutorial, tutorialStarsKey } from './tutorial';

const hero = new Game(START_FEN);
type Mode = 'bot' | 'local';
type SessionStore = typeof useLocalSession;
const PIECE_VALUES = Object.fromEntries(PIECE_TYPES.map((type) => [type, pieceInfo(type, 'w').value]));

const sessionFor = (mode: Mode, humanColor: Color): SessionStore =>
  mode === 'local' ? useLocalSession : humanColor === 'w' ? useBotWhiteSession : useBotBlackSession;

function Home() {
  const { t } = useTranslation();
  const completed = localStorage.getItem(tutorialStarsKey);
  return (
    <section className="cabinet-home">
      <div className="home-copy">
        <p className="cabinet-kicker"><span />{t('home.edition')}</p>
        <h1>{t('home.title')}</h1>
        <p className="home-intro">{t('home.intro')}</p>
        <div className="home-actions">
          <Link className="cabinet-primary" to="/play"><Bot size={17} aria-hidden />{t('home.play')}<ArrowUpRight size={16} aria-hidden /></Link>
          <Link className="cabinet-secondary" to="/play?mode=local"><Users size={16} aria-hidden />{t('home.playLocal')}<span>→</span></Link>
          <Link className="cabinet-primary cabinet-learn" to="/tutorial"><BookOpen size={17} aria-hidden />{t('home.startLearning')}<ArrowUpRight size={16} aria-hidden /></Link>
          <Link className="cabinet-secondary" to="/learn">{t('home.allLessons')}<span>→</span></Link>
          {completed && <p className="completion-note">{t('home.lastResult', { stars: completed })}</p>}
        </div>
        <div className="home-signature"><Compass size={17} aria-hidden /><span>{t('home.signature')}</span></div>
        <p className="edition-note">{t('home.editionNote')}</p>
      </div>
      <div className="number-diagram">
        <div className="diagram-heading"><span>{t('home.diagram')}</span><span>{t('home.coordinates')}</span></div>
        <div className="opening-board" aria-label={t('board.label')}>
          {DISPLAY_SQUARES.map((sq) => {
            const piece = hero.pieceAt(sq);
            return <div className="opening-cell" data-tone={((sq % 8) + Math.floor(sq / 8)) % 2} key={sq}>
              {piece && <PieceArt piece={piece} />}
            </div>;
          })}
        </div>
        <div className="diagram-caption"><span>{t('home.boardNote')}</span><span>128 / 128</span></div>
        <div className="diagram-index"><span>THE NUMBER CABINET</span><span>01</span><span>16</span></div>
      </div>
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
      <p className="cabinet-kicker"><span />{t('setup.kicker')}</p>
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
      <div className="setup-section-heading"><div><p className="setup-label">{t('setup.strength')}</p><h2>{t(`bots.${selectedBot.key}.name`)}</h2><p>{t(`bots.${selectedBot.key}.description`)}</p></div><span className="level-stamp">{t('setup.levelCount', { count: BOTS.length })}</span></div>
      <div className="bot-levels" role="group" aria-label={t('setup.strength')}>
        {BOTS.map((bot) => <button key={bot.id} type="button" aria-pressed={level === bot.id} className={`bot-level${level === bot.id ? ' is-selected' : ''}`} onClick={() => setLevel(bot.id)}>
          <span className="bot-level-number">0{bot.id}</span><span>{t(`bots.${bot.key}.name`)}</span>
        </button>)}
      </div>
      <div className="setup-section-heading side-choice-heading"><div><p className="setup-label">{t('setup.seat')}</p><h2>{t('setup.playAs')}</h2></div></div>
      <div className="side-choice" role="group" aria-label={t('setup.playAs')}>
        {(['w', 'b'] as const).map((color) => <button key={color} type="button" aria-pressed={humanColor === color} className={`side-option${humanColor === color ? ' is-selected' : ''}`} onClick={() => setHumanColor(color)}>
          <PieceArt piece={{ color, type: 'c2', promoted: false }} />{t(`colors.${color}`)}
        </button>)}
      </div>
      <p className="setup-note">{t('setup.firstTurn')}</p>
    </div>}
    {mode === 'local' && <Card className="local-mode-note"><Users size={20} aria-hidden /><p>{t('setup.localPassNote')}</p></Card>}
    <div className="setup-actions"><Button size="lg" onClick={start}>{t('setup.start')}<ArrowRight aria-hidden className="h-5 w-5" /></Button></div>
  </section>;
}

function PositionNotebook({ game, selected }: { game: Game; selected: Square | null }) {
  const { t } = useTranslation();
  const piece = selected === null ? null : game.pieceAt(selected);
  const info = piece ? pieceInfo(piece.type, piece.color) : null;
  const selectedName = selected === null ? '' : squareName(selected);
  const choices = selected === null ? [] : game.legalUci().flatMap((uci) => {
    const match = /^([a-h]\d{1,2})([a-h]\d{1,2})([a-z]?)$/.exec(uci);
    if (!match || match[1] !== selectedName) return [];
    const to = game.pieceAt((Number(match[2]!.match(/\d+$/)![0]) - 1) * 8 + match[2]!.charCodeAt(0) - 97);
    if (!to || to.color === piece?.color) return [];
    const suffix = match[3] ?? '';
    const targetInfo = pieceInfo(to.type, to.color);
    const targetValue = /^[a-v]$/.test(suffix)
      ? PYRAMID_COMPONENTS[suffix.charCodeAt(0) - 97]?.value ?? targetInfo.value
      : targetInfo.value;
    return [{ square: match[2]!, value: targetValue, all: suffix === 'z' }];
  });
  const uniqueChoices = [...new Map(choices.map((choice) => [`${choice.square}:${choice.value}:${choice.all}`, choice])).values()];

  return <Card className="number-notebook" data-testid="number-notebook">
    <p className="notebook-label">{t('notebook.title')}</p>
    {piece && info ? <>
      <h2>{t(`shapes.${info.shape}`)} · {info.value}</h2>
      <p>{t(`notebook.movement.${info.shape}`)}</p>
      {uniqueChoices.length > 0 && <div className="notebook-captures">
        <strong>{t('notebook.captures')}</strong>
        {uniqueChoices.map((choice) => <span key={`${choice.square}:${choice.value}:${choice.all}`}>
          {choice.all ? t('capture.siegeAll') : t('notebook.captureAt', { square: choice.square, value: choice.value })}
        </span>)}
      </div>}
    </> : <>
      <h2>{t('notebook.promptTitle')}</h2>
      <p>{t('notebook.prompt')}</p>
    </>}
    <p className="notebook-footnote">{t('notebook.ruleSource')}</p>
  </Card>;
}

function describePyramidRoute(uci: string, game: Game, t: ReturnType<typeof useTranslation>['t']): string {
  const parsed = parseUci(uci, 8);
  if (parsed?.kind !== 'move') return uci;
  const route = [parsed.from, ...parsed.path].map(squareName).join(' → ');
  const suffix = parsed.promotion;
  const target = game.pieceAt(parsed.to);
  if (suffix === 'z') {
    const total = target ? pieceInfo(target.type, target.color).value : 0;
    return `${route} · ${t('capture.siegeChoice', { value: total })}`;
  }
  if (suffix && /^[a-v]$/.test(suffix)) {
    const component = PYRAMID_COMPONENTS[suffix.charCodeAt(0) - 97];
    if (component) {
      const remaining = target ? Math.max(0, pieceInfo(target.type, target.color).value - component.value) : 0;
      return `${route} · ${t('capture.componentChoice', {
        shape: t(`shapes.${component.shape}`), value: component.value, remaining,
      })}`;
    }
  }
  return route;
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
  const opponentColor: Color = humanColor === 'w' ? 'b' : 'w';
  const opponentName = t(`bots.${bot.key}.name`);

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
    requestComputerMove(current.startFen, moves, level)
      .then((response) => {
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
        if (!(error instanceof Error && error.name === 'AiCancelled')) console.error('Rithmomachia bot failed; used a legal fallback action.', error);
      })
      .finally(() => { if (active) setThinking(false); });
    return () => { active = false; cancelComputerMove(); setThinking(false); };
  }, [game, humanColor, level, mode, result, store, version, viewPly]);

  const humanHasMoved = game.moves().some((record) => record.color === humanColor);
  const takeback = () => {
    cancelComputerMove();
    const current = store.getState();
    if (!undoAllowed(current)) return;
    if (mode === 'bot' && current.game.turn === humanColor) current.undo();
    current.undo();
  };

  return <section className="game-page">
    <div className="game-heading"><div><p className="cabinet-kicker"><span />{mode === 'bot' ? t('game.botEyebrow', { name: opponentName }) : t('game.localEyebrow')}</p><h1>{mode === 'bot' ? t('home.botTitle') : t('home.localTitle')}</h1></div><span className="live-note"><i />{t('game.savedOnDevice')}</span></div>
    <GameScreen
      variant={rithmomachia}
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
      status={<p className={`thinking-note${thinking ? '' : ' is-idle'}`} aria-live="polite">{thinking ? t('computer.thinking', { name: opponentName }) : '\u00a0'}</p>}
      onRematch={() => { cancelComputerMove(); store.getState().start(null); }}
      {...board}
      describeSquare={(square, piece) => board.describeSquare(square, piece)}
      pieceValues={PIECE_VALUES}
      boardSizing="scroll"
      avatarType="c2"
      routeChoiceTitle={t('play.chooseCapture')}
      describeRouteChoice={(uci) => describePyramidRoute(uci, game, t)}
      describePromotion={(piece) => promotionName(piece.type, piece.color, t)}
      handLabel={(color) => t('play.reserve', { color: t(`colors.${color}`) })}
      describeHandPiece={(type, count) => {
        const info = pieceInfo(type, 'w');
        return t('play.reservePiece', { name: `${t(`shapes.${info.shape}`)} ${info.value}`, count });
      }}
      renderPositionDetails={(position, selected) => <PositionNotebook game={position as Game} selected={selected} />}
    />
  </section>;
}

function Learn() {
  const { t } = useTranslation();
  return <section className="lesson-index">
    <div className="page-heading">
      <Link className="back-link" to="/" aria-label={t('nav.home')}><ArrowLeft size={16} aria-hidden />{t('nav.home')}</Link>
      <p className="cabinet-kicker"><span />{t('learn.kicker')}</p><h1>{t('learn.title')}</h1><p>{t('learn.intro')}</p>
    </div>
    {UNITS.map((unit, unitIndex) => <section className="lesson-unit" key={unit.id}>
      <div className="unit-heading"><span>0{unitIndex + 1}</span><h2>{unit.title.en}</h2><i /></div>
      <div className="lesson-rows">{unit.lessons.map((lesson, lessonIndex) => {
        const stars = localStorage.getItem(lessonStarsKey(lesson.id));
        return <Link className="lesson-row" key={lesson.id} to={`/lesson/${lesson.id}`}>
          <span className="lesson-index-number">{String(lessonIndex + 1).padStart(2, '0')}</span>
          <span className="lesson-symbol" aria-hidden>{lesson.icon}</span>
          <span className="lesson-description"><strong>{lesson.title.en}</strong><small>{lesson.summary.en}</small></span>
          <span className="lesson-result">{stars ? t('learn.stars', { count: stars }) : <>{lesson.steps.length} {t('learn.steps')}</>}<ArrowUpRight size={15} aria-hidden /></span>
        </Link>;
      })}</div>
    </section>)}
  </section>;
}

function LessonRoute() {
  const { id = '' } = useParams();
  const lesson = ALL_LESSONS.find((candidate) => candidate.id === id);
  return lesson ? <RithmomachiaTutorial lesson={lesson} /> : <Navigate to="/learn" replace />;
}

export function App() {
  const { t } = useTranslation();
  const { focus, FocusProvider } = useFocusModeProvider();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem(storageKey(PRODUCT, 'theme'));
    return saved === 'light' || saved === 'dark'
      ? saved
      : window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(storageKey(PRODUCT, 'theme'), theme);
  }, [theme]);
  return <div className={`cabinet-app${focus ? ' is-focused' : ''}`}>
    <header className="site-masthead">
      <Link className="brand" to="/" aria-label={t('nav.home')}>
        <span className="brand-seal" aria-hidden><Compass size={20} strokeWidth={1.5} /></span>
        <span><strong>{t('home.title')}</strong><small>{t('home.brandNote')}</small></span>
      </Link>
      {focus ? <Link className="back-link" to={focus === 'game' ? '/' : '/learn'}><ArrowLeft size={16} aria-hidden />{focus === 'game' ? t('nav.leaveGame') : t('nav.leave')}</Link> :
        <div className="masthead-actions">
          {!focus && <nav className="top-nav" aria-label={t('nav.label')}><Link to="/play">{t('nav.play')}</Link><Link to="/learn">{t('nav.lessons')}</Link><Link to="/tutorial">{t('nav.start')}</Link></nav>}
          <button className="theme-toggle" type="button" aria-label={t('theme.toggle')} title={t('theme.toggle')} onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
            {theme === 'light' ? <Moon size={15} aria-hidden /> : <Sun size={15} aria-hidden />}<span className="theme-label">{t(theme === 'light' ? 'theme.dark' : 'theme.light')}</span>
          </button>
        </div>}
    </header>
    <main><FocusProvider><Routes>
      <RouteView index element={<Home />} />
      <RouteView path="learn" element={<Learn />} />
      <RouteView path="tutorial" element={<Navigate to={`/lesson/${ALL_LESSONS[0]!.id}`} replace />} />
      <RouteView path="lesson/:id" element={<LessonRoute />} />
      <RouteView path="play" element={<PlaySetup />} />
      <RouteView path="game/:mode/:side/:level" element={<GameRoute />} />
      <RouteView path="*" element={<Navigate to="/" replace />} />
    </Routes></FocusProvider></main>
    {!focus && <footer className="site-footer"><span>{t('home.footer')}</span><Link to="/learn">{t('nav.lessons')}</Link></footer>}
  </div>;
}
