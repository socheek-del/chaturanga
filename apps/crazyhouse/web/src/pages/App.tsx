import { type Color, type Piece } from '@chaturanga/rules-core';
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
import { BOTS, botById } from '@chaturanga/crazyhouse-ai';
import { crazyhouse } from '@chaturanga/crazyhouse';
import { ArrowLeft, ArrowRight, BookOpen, Bot, Link2, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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

function initialRoute(): { screen: Screen; code: string } {
  if (location.pathname === '/online') return { screen: 'online', code: '' };
  const match = ROOM_PATH.exec(location.pathname);
  return match ? { screen: 'onlineRoom', code: match[1]!.toUpperCase() } : { screen: 'home', code: '' };
}

const THEME = {
  board: 'transparent',
  line: '#344c3c',
  coordinate: '#344c3c',
  selected: '#c28b55',
  lastMove: 'rgba(190, 133, 67, 0.38)',
  check: '#b34e40',
  hint: '#bc714e',
};
const PIECE_VALUE = { k: 0, q: 9, r: 5, b: 3, n: 3, p: 1 };
const sessionFor = (mode: Mode, color: Color): SessionStore =>
  mode === 'local' ? useLocalSession : color === 'w' ? useBotWhiteSession : useBotBlackSession;

export function App() {
  const { t, i18n } = useTranslation();
  const { focus, FocusProvider } = useFocusModeProvider();
  const [route] = useState(initialRoute);
  const [screen, setScreen] = useState<Screen>(route.screen);
  const [roomCode, setRoomCode] = useState(route.code);
  const [mode, setMode] = useState<Mode>('bot');
  const [humanColor, setHumanColor] = useState<Color>('w');
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
    window.history.pushState({}, '', `/online/${normalized}`);
    setRoomCode(normalized);
    setScreen('onlineRoom');
  };
  const leaveOnlineRoom = () => {
    window.history.pushState({}, '', '/online');
    setRoomCode('');
    setScreen('online');
  };
  const goHome = () => showScreen('home');
  const openPlay = (nextMode: Mode) => {
    setMode(nextMode);
    showScreen('play');
  };
  const openLesson = (next: Lesson) => {
    setLessonId(next.id);
    showScreen('lesson');
  };

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
          <button
            className="brand-lockup"
            type="button"
            onClick={() => {
              cancelComputerMove();
              goHome();
            }}
            aria-label={t('app.home')}
          >
            <span className="brand-mark" aria-hidden>
              ♟
            </span>
            <span>
              <strong>{t('app.name')}</strong>
              <small>{t('app.subtitle')}</small>
            </span>
          </button>
          {focus ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                cancelComputerMove();
                if (screen === 'onlineRoom') leaveOnlineRoom();
                else showScreen(screen === 'lesson' ? 'learn' : 'home');
              }}
            >
              <ArrowLeft aria-hidden className="h-4 w-4" />
              {t('nav.back')}
            </Button>
          ) : (
            <nav className="main-nav" aria-label={t('nav.label')}>
              <button type="button" onClick={() => showScreen('home')}>
                {t('nav.play')}
              </button>
              <button type="button" onClick={() => showScreen('learn')}>
                {t('nav.learn')}
              </button>
              <button type="button" onClick={openOnline}>
                {t('modes.online')}
              </button>
              <a href="#rules">{t('nav.rules')}</a>
            </nav>
          )}
        </header>
        <main className={cn('page-frame', focus && 'focus-frame')}>
          {screen === 'home' && (
            <Home
              onPlay={() => openPlay('bot')}
              onLocal={() => openPlay('local')}
              onOnline={openOnline}
              onLearn={() => showScreen('learn')}
            />
          )}
          {screen === 'play' &&
            (phase === 'playing' ? (
              <GameView mode={mode} humanColor={humanColor} level={level} />
            ) : (
              <Setup
                mode={mode}
                setMode={setMode}
                humanColor={humanColor}
                setHumanColor={setHumanColor}
                level={level}
                setLevel={setLevel}
                onStart={() => store.getState().start(null)}
              />
            ))}
          {screen === 'online' && (
            <OnlineLobby
              identity={identity}
              timeControl={timeControl}
              onTimeControlChange={setTimeControl}
              color={onlineColor}
              onColorChange={setOnlineColor}
              onEnterRoom={enterOnlineRoom}
            />
          )}
          {screen === 'onlineRoom' && roomCode && (
            <OnlineRoom
              key={roomCode}
              code={roomCode}
              variant={crazyhouse}
              identity={identity}
              roomUrl={(code) => `${location.origin}/online/${code}`}
              onEnterRoom={enterOnlineRoom}
              onLeave={leaveOnlineRoom}
              renderGame={(props) => (
                <GameScreen
                  {...props}
                  variant={crazyhouse}
                  theme={THEME}
                  showCoordinates
                  boardUnderlay={<Checkerboard />}
                  renderPiece={(piece: Piece, className: string) => (
                    <PieceArt piece={piece} className={className} />
                  )}
                  boardLabel={t('board.label')}
                  describeSquare={(square, piece) =>
                    piece
                      ? t('board.squareWithPiece', {
                          square,
                          piece: t(`pieces.${piece.type}`),
                          color: t(`colors.${piece.color}`),
                        })
                      : t('board.emptySquare', { square })
                  }
                  pieceValues={PIECE_VALUE}
                  describePromotion={(piece) => t(`pieces.${piece.type}`)}
                  handLabel={(color) => t('hand.label', { color: t(`colors.${color}`) })}
                  describeHandPiece={(type, count) => t('hand.piece', { piece: t(`pieces.${type}`), count })}
                />
              )}
            />
          )}
          {screen === 'learn' && <LearnList completed={completed} onSelect={openLesson} />}
          {screen === 'lesson' && lesson && (
            <LessonPlayer
              key={lesson.id}
              variant={crazyhouse}
              lesson={lesson}
              onExit={() => showScreen('learn')}
              onFinish={(stars) => {
                useProgress.getState().completeLesson(lesson.id, stars, lesson.xp);
                setScreen('learn');
              }}
              translate={(text) => text.en ?? ''}
              theme={THEME}
              boardUnderlay={<Checkerboard />}
              renderPiece={(piece, className) => <PieceArt piece={piece} className={className} />}
              boardLabel={t('board.label')}
              describeSquare={(square, piece) =>
                piece
                  ? t('board.squareWithPiece', {
                      square,
                      piece: t(`pieces.${piece.type}`),
                      color: t(`colors.${piece.color}`),
                    })
                  : t('board.emptySquare', { square })
              }
              handLabel={(color) => t('hand.label', { color: t(`colors.${color}`) })}
              describeHandPiece={(type, count) => t('hand.piece', { piece: t(`pieces.${type}`), count })}
            />
          )}
        </main>
        {!focus && screen !== 'lesson' && <RulesNote />}
        {!focus && <MoreGames sites={__FAMILY__} locale={i18n.language} variant="footer" />}
        {!focus && <footer className="site-footer">{t('footer.note')}</footer>}
      </div>
    </FocusProvider>
  );
}

function Home({
  onPlay,
  onLocal,
  onOnline,
  onLearn,
}: {
  onPlay: () => void;
  onLocal: () => void;
  onOnline: () => void;
  onLearn: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="home-layout">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="eyebrow-stamp" />
            {t('home.kicker')}
          </p>
          <h1>
            {t('home.title')} <em>{t('home.titleAccent')}</em>
          </h1>
          <p className="hero-lede">{t('home.description')}</p>
          <div className="hero-actions">
            <Button size="lg" onClick={onPlay}>
              {t('home.playBot')}
              <ArrowRight aria-hidden className="h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" onClick={onLocal}>
              {t('home.playTogether')}
              <Users aria-hidden className="h-5 w-5" />
            </Button>
          </div>
          <p className="hero-footnote">{t('home.footnote')}</p>
        </div>
        <div className="hero-illustration" aria-hidden>
          <div className="orbit orbit-a" />
          <div className="orbit orbit-b" />
          <div className="hero-board">
            {['♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜', '♟', '♟', '♟', '♟', '♟', '♟', '♟', '♟'].map(
              (piece, i) => (
                <span key={i} className={(i + Math.floor(i / 4)) % 2 ? 'shade' : ''}>
                  {piece}
                </span>
              ),
            )}
          </div>
          <div className="pocket-chip chip-top">
            <PieceArt piece={{ color: 'b', type: 'n', promoted: false }} className="h-8 w-8" />
            <b>×2</b>
          </div>
          <div className="pocket-chip chip-bottom">
            <PieceArt piece={{ color: 'w', type: 'p', promoted: false }} className="h-8 w-8" />
            <b>{t('home.inHand')}</b>
          </div>
          <span className="hero-caption">{t('home.artCaption')}</span>
        </div>
      </section>
      <section className="mode-grid" aria-label={t('home.modes')}>
        <button className="mode-card mode-featured" type="button" onClick={onPlay}>
          <span className="mode-icon">
            <Bot aria-hidden />
          </span>
          <span>
            <strong>{t('home.botTitle')}</strong>
            <small>{t('home.botDescription')}</small>
          </span>
          <ArrowRight aria-hidden className="mode-arrow" />
        </button>
        <button className="mode-card" type="button" onClick={onLocal}>
          <span className="mode-icon">
            <Users aria-hidden />
          </span>
          <span>
            <strong>{t('home.localTitle')}</strong>
            <small>{t('home.localDescription')}</small>
          </span>
          <ArrowRight aria-hidden className="mode-arrow" />
        </button>
        <button className="mode-card" type="button" onClick={onOnline}>
          <span className="mode-icon">
            <Link2 aria-hidden />
          </span>
          <span>
            <strong>{t('modes.online')}</strong>
            <small>{t('home.onlineDescription')}</small>
          </span>
          <ArrowRight aria-hidden className="mode-arrow" />
        </button>
        <button className="mode-card" type="button" onClick={onLearn}>
          <span className="mode-icon">
            <BookOpen aria-hidden />
          </span>
          <span>
            <strong>{t('home.learnTitle')}</strong>
            <small>{t('home.learnDescription')}</small>
          </span>
          <ArrowRight aria-hidden className="mode-arrow" />
        </button>
      </section>
      <section className="thesis-strip">
        <span className="thesis-mark">↗</span>
        <p>{t('home.ruleTeaser')}</p>
        <a href="#rules">
          {t('home.readRules')}
          <ArrowRight aria-hidden className="h-4 w-4" />
        </a>
      </section>
    </div>
  );
}

function Setup({
  mode,
  setMode,
  humanColor,
  setHumanColor,
  level,
  setLevel,
  onStart,
}: {
  mode: Mode;
  setMode: (mode: Mode) => void;
  humanColor: Color;
  setHumanColor: (color: Color) => void;
  level: number;
  setLevel: (level: number) => void;
  onStart: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="setup-layout">
      <div className="section-heading">
        <p className="eyebrow">{t('setup.kicker')}</p>
        <h1>{mode === 'bot' ? t('setup.botTitle') : t('setup.localTitle')}</h1>
        <p>{mode === 'bot' ? t('setup.botDescription') : t('setup.localDescription')}</p>
      </div>
      <div className="setup-tabs" role="tablist" aria-label={t('setup.mode')}>
        <button role="tab" aria-selected={mode === 'bot'} onClick={() => setMode('bot')} type="button">
          <Bot aria-hidden />
          {t('home.botTitle')}
        </button>
        <button role="tab" aria-selected={mode === 'local'} onClick={() => setMode('local')} type="button">
          <Users aria-hidden />
          {t('home.localTitle')}
        </button>
      </div>
      {mode === 'bot' ? (
        <>
          <Card className="setup-card">
            <div className="card-heading">
              <div>
                <p className="eyebrow">{t('setup.opponent')}</p>
                <h2>{t('setup.chooseLevel')}</h2>
              </div>
              <span className="level-stamp">{t('setup.levelCount', { count: BOTS.length })}</span>
            </div>
            <div className="bot-grid" role="radiogroup" aria-label={t('setup.chooseLevel')}>
              {BOTS.map((bot) => (
                <button
                  key={bot.id}
                  type="button"
                  role="radio"
                  aria-checked={level === bot.id}
                  className={cn('bot-option', level === bot.id && 'is-selected')}
                  onClick={() => setLevel(bot.id)}
                >
                  <span className="bot-seal">
                    <PieceArt
                      piece={{
                        color: 'w',
                        type: ['p', 'n', 'b', 'r', 'q', 'k'][bot.id - 1]!,
                        promoted: false,
                      }}
                      className="h-9 w-9"
                    />
                  </span>
                  <span>
                    <b>{t(`bots.${bot.key}.name`)}</b>
                    <small>{t(`bots.${bot.key}.description`)}</small>
                  </span>
                  <span className="bot-number">0{bot.id}</span>
                </button>
              ))}
            </div>
          </Card>
          <Card className="setup-card side-card">
            <div>
              <p className="eyebrow">{t('setup.seat')}</p>
              <h2>{t('setup.playAs')}</h2>
              <p>{t('setup.sideNote')}</p>
            </div>
            <SegmentedControl<Color>
              label={t('setup.playAs')}
              value={humanColor}
              onChange={setHumanColor}
              options={[
                { value: 'w', label: t('colors.w') },
                { value: 'b', label: t('colors.b') },
              ]}
            />
          </Card>
        </>
      ) : (
        <Card className="setup-card local-note">
          <Users aria-hidden />
          <div>
            <h2>{t('setup.localTitle')}</h2>
            <p>{t('setup.localNote')}</p>
          </div>
        </Card>
      )}
      <div className="setup-actions">
        <Button variant="ghost" onClick={() => setMode(mode === 'bot' ? 'local' : 'bot')}>
          {t('setup.switchMode')}
        </Button>
        <Button size="lg" onClick={onStart}>
          {t('play.start')}
          <ArrowRight aria-hidden className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

function GameView({ mode, humanColor, level }: { mode: Mode; humanColor: Color; level: number }) {
  const { t } = useTranslation();
  const store = sessionFor(mode, humanColor);
  const game = store((state) => state.game);
  const version = store((state) => state.version);
  const result = store((state) => state.result);
  const viewPly = store((state) => state.viewPly);
  const flipped = store((state) => state.flipped);
  const bot = botById(level);
  const computerColor: Color = humanColor === 'w' ? 'b' : 'w';
  const [thinking, setThinking] = useState(false);
  const botName = t(`bots.${bot.key}.name`);

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
        const move =
          response.uci && current.game.legalUci().includes(response.uci)
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
          console.error('Crazyhouse bot failed; played the first legal move.', error);
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

  return (
    <div className="game-page">
      <div className="game-heading">
        <div>
          <p className="eyebrow">
            {mode === 'bot' ? t('game.botEyebrow', { name: botName }) : t('game.localEyebrow')}
          </p>
          <h1>{mode === 'bot' ? t('home.botTitle') : t('home.localTitle')}</h1>
        </div>
        <span className="live-note">
          <i />
          {t('game.savedOnDevice')}
        </span>
      </div>
      <GameScreen
        variant={crazyhouse}
        useSession={store}
        title={mode === 'bot' ? t('home.botTitle') : t('home.localTitle')}
        orientation={flipped ? computerColor : mode === 'bot' ? humanColor : 'w'}
        names={
          mode === 'bot'
            ? ({ [humanColor]: t('computer.you'), [computerColor]: botName } as Record<Color, string>)
            : { w: t('colors.w'), b: t('colors.b') }
        }
        inputEnabled={mode === 'local' || game.turn === humanColor}
        canUndo={
          mode === 'local' ? undoAllowed({ game, result }) : humanHasMoved && undoAllowed({ game, result })
        }
        onUndo={takeback}
        resignColor={mode === 'local' ? game.turn : humanColor}
        status={
          <p className={cn('thinking-note', !thinking && 'invisible')} aria-hidden={!thinking}>
            <span className="thinking-dot" />
            {t('computer.thinking', { name: botName })}
          </p>
        }
        onRematch={() => {
          cancelComputerMove();
          store.getState().start(null);
        }}
        theme={THEME}
        showCoordinates
        boardUnderlay={<Checkerboard />}
        renderPiece={(piece: Piece, className: string) => <PieceArt piece={piece} className={className} />}
        boardLabel={t('board.label')}
        describeSquare={(square, piece) =>
          piece
            ? t('board.squareWithPiece', {
                square,
                piece: t(`pieces.${piece.type}`),
                color: t(`colors.${piece.color}`),
              })
            : t('board.emptySquare', { square })
        }
        pieceValues={PIECE_VALUE}
        describePromotion={(piece) => t(`pieces.${piece.type}`)}
        handLabel={(color) => t('hand.label', { color: t(`colors.${color}`) })}
        describeHandPiece={(type, count) => t('hand.piece', { piece: t(`pieces.${type}`), count })}
      />
    </div>
  );
}

function LearnList({
  completed,
  onSelect,
}: {
  completed: Record<string, { stars: number }>;
  onSelect: (lesson: Lesson) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="learn-layout">
      <div className="section-heading">
        <p className="eyebrow">{t('learn.kicker')}</p>
        <h1>{t('learn.title')}</h1>
        <p>{t('learn.description')}</p>
      </div>
      <Card className="learn-intro">
        <BookOpen aria-hidden />
        <p>{t('learn.intro')}</p>
        <span>
          {t('learn.progressCount', { done: Object.keys(completed).length, total: ALL_LESSONS.length })}
        </span>
      </Card>
      {UNITS.map((unit, i) => (
        <section className="lesson-unit" key={unit.id}>
          <div className="unit-heading">
            <span>0{i + 1}</span>
            <h2>{unit.title.en}</h2>
            <i />
          </div>
          <div className="lesson-cards">
            {unit.lessons.map((item, n) => (
              <button key={item.id} type="button" className="lesson-card" onClick={() => onSelect(item)}>
                <span className="lesson-index">{String(n + 1).padStart(2, '0')}</span>
                <span className="lesson-copy">
                  <strong>{item.title.en}</strong>
                  <small>{item.summary.en}</small>
                </span>
                <span className="lesson-status">
                  {completed[item.id] ? `${completed[item.id]!.stars} ★` : <ArrowRight aria-hidden />}
                </span>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function RulesNote() {
  const { t } = useTranslation();
  return (
    <section id="rules" className="rules-note">
      <div className="rules-seal">CH</div>
      <div>
        <p className="eyebrow">{t('rules.kicker')}</p>
        <h2>{t('rules.title')}</h2>
        <p>{t('rules.description')}</p>
        <ul>
          {['capture', 'drop', 'pawn', 'promoted', 'ending'].map((key) => (
            <li key={key}>
              <b>{t(`rules.items.${key}.title`)}</b>
              <span>{t(`rules.items.${key}.body`)}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Checkerboard() {
  const squares = [];
  for (let row = 0; row < 8; row++)
    for (let col = 0; col < 8; col++) {
      squares.push(
        <rect
          key={`${row}-${col}`}
          x={col}
          y={row}
          width="1"
          height="1"
          fill={(row + col) % 2 === 0 ? '#e9dfc9' : '#829780'}
        />,
      );
    }
  return (
    <svg viewBox="0 0 8 8" className="h-full w-full" preserveAspectRatio="none" aria-hidden="true">
      {squares}
    </svg>
  );
}
