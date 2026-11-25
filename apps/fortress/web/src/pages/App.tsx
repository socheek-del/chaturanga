import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Game, isPlayable, sameTeam, teamOf, type PieceType, type Seat } from '@chaturanga/fortress';
import { Board, parseUci, PromotionPicker, type ParsedMove } from './Board';
import { Tutorial } from './Tutorial';
import { Online, requestedRoom } from './Online';

type Mode = { kind: 'local' } | { kind: 'bot'; human: Seat };
type Screen = 'home' | 'game' | 'tutorial' | 'botSeat' | 'online';
const seats: readonly Seat[] = ['r', 'b', 'w', 'k'];
const reserves: readonly Extract<PieceType, 'b' | 'n' | 'r'>[] = ['b', 'n', 'r'];
const STORAGE_PREFIX = 'fortress:petrov:v1';
const localKey = `${STORAGE_PREFIX}:local`;
const botKey = (seat: Seat) => `${STORAGE_PREFIX}:bot:${seat}`;
const saveKey = (mode: Mode) => (mode.kind === 'local' ? localKey : botKey(mode.human));

function loadGame(key: string): Game {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Game();
    const data: unknown = JSON.parse(raw);
    if (
      typeof data === 'object' &&
      data !== null &&
      'fen' in data &&
      typeof data.fen === 'string' &&
      'moves' in data &&
      Array.isArray(data.moves)
    ) {
      const game = new Game();
      for (const move of data.moves) {
        if (typeof move !== 'string') return new Game(data.fen);
        game.move(move);
      }
      return game.fen() === data.fen ? game : new Game(data.fen);
    }
    return new Game(raw);
  } catch {
    return new Game();
  }
}

function saveGame(game: Game, key: string): void {
  try {
    localStorage.setItem(key, JSON.stringify({ fen: game.fen(), moves: game.moves().map(({ uci }) => uci) }));
  } catch {
    /* A private browser may disable local storage. */
  }
}

function statusFor(game: Game, seat: Seat): 'playing' | 'check' | 'eliminated' | 'winner' {
  if (game.isEliminated(seat)) return 'eliminated';
  const result = game.status();
  if (result.kind === 'checkmate' && sameTeam(seat, result.winner)) return 'winner';
  if (seat === game.turn && game.inCheck()) return 'check';
  return 'playing';
}

export function App() {
  const { t } = useTranslation();
  const [screen, setScreen] = useState<Screen>(() => (requestedRoom() ? 'online' : 'home'));
  const [mode, setMode] = useState<Mode>({ kind: 'local' });
  const [game, setGame] = useState(() => loadGame(localKey));
  const [revision, setRevision] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [reserve, setReserve] = useState<ParsedMove['placement'] | null>(null);
  const [promotion, setPromotion] = useState<ParsedMove[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [botSeat, setBotSeat] = useState<Seat>('r');

  // The rules engine is mutable; revision invalidates the cached move list after each action.
  const legal = useMemo(
    () =>
      game
        .legalUci()
        .map(parseUci)
        .filter((move): move is ParsedMove => move !== null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [game, revision],
  );
  const destinations =
    selected === null
      ? reserve
        ? legal.filter((move) => move.placement === reserve)
        : []
      : legal.filter((move) => move.from === selected);
  const lastRecord = game.lastMove();
  const lastMove = lastRecord ? parseUci(lastRecord.uci) : null;
  const result = game.status();
  const finished = game.isGameOver();
  const thinking = screen === 'game' && mode.kind === 'bot' && game.turn !== mode.human && !finished;
  const canUndo =
    mode.kind === 'local' ? game.moves().length > 0 : game.moves().some((move) => move.color === mode.human);

  useEffect(() => {
    if (!thinking) return;
    const fallback = game.legalUci()[0];
    if (!fallback) return;
    let active = true;
    const worker = new Worker(new URL('./bot.worker.ts', import.meta.url), { type: 'module' });
    const reply = (candidate: string | null) => {
      if (!active) return;
      active = false;
      const move = candidate && game.legalUci().includes(candidate) ? candidate : fallback;
      try {
        game.move(move);
        saveGame(game, saveKey(mode));
        setError(null);
      } catch {
        game.move(fallback);
        saveGame(game, saveKey(mode));
      }
      setRevision((value) => value + 1);
      setSelected(null);
      setReserve(null);
      setPromotion([]);
    };
    worker.onmessage = (event: MessageEvent<string | null>) => reply(event.data);
    worker.onerror = () => reply(null);
    worker.postMessage({ fen: game.fen(), maxNodes: 1000 });
    const timeout = window.setTimeout(() => reply(null), 1300);
    return () => {
      active = false;
      window.clearTimeout(timeout);
      worker.terminate();
    };
  }, [game, mode, revision, thinking]);

  function refresh(next = game) {
    setGame(next);
    setRevision((value) => value + 1);
    setSelected(null);
    setReserve(null);
    setPromotion([]);
  }

  function playMove(move: ParsedMove) {
    try {
      game.move(move.uci);
      saveGame(game, saveKey(mode));
      setError(null);
      refresh();
    } catch {
      setError(t('game.moveRejected'));
    }
  }

  function onSquareClick(square: number) {
    if (finished || thinking || promotion.length) return;
    const options = destinations.filter((move) => move.to === square);
    if (options.length > 1) {
      setPromotion(options);
      return;
    }
    if (options[0]) {
      playMove(options[0]);
      return;
    }
    const piece = game.pieceAt(square);
    if (!reserve && piece?.color === game.turn && !game.isEliminated(piece.color))
      setSelected(square === selected ? null : square);
    else setSelected(null);
  }

  function startGame(nextMode: Mode) {
    setMode(nextMode);
    refresh(loadGame(saveKey(nextMode)));
    setScreen('game');
  }

  function resetGame() {
    const key = saveKey(mode);
    try {
      localStorage.removeItem(key);
    } catch {
      /* Ignore storage restrictions. */
    }
    refresh(new Game());
  }

  function takeBack() {
    if (!canUndo) return;
    let undone = game.undo();
    while (mode.kind === 'bot' && undone && undone.color !== mode.human) undone = game.undo();
    saveGame(game, saveKey(mode));
    refresh();
  }

  function resultLabel(): string {
    if (result.kind === 'checkmate')
      return t('game.resultTeam', { team: t(`players.team${teamOf(result.winner)}`) });
    if (result.kind === 'stalemate') return t('game.draw');
    if (game.inCheck()) return t('game.check', { player: t(`players.${game.turn}`) });
    if (thinking) return t('game.botTurn', { player: t(`players.${game.turn}`) });
    return mode.kind === 'bot' && mode.human === game.turn
      ? t('game.yourTurn', { player: t(`players.${game.turn}`) })
      : t(mode.kind === 'local' ? 'game.localTurn' : 'game.turn', { player: t(`players.${game.turn}`) });
  }

  function goHome() {
    setScreen('home');
    setError(null);
    setSelected(null);
    setReserve(null);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="wordmark" type="button" onClick={goHome} aria-label={t('game.home')}>
          <span className="wordmark-seal" aria-hidden="true">
            <svg viewBox="0 0 36 36">
              <path d="M4 29h28M7 29V15l5 4 6-11 6 11 5-4v14M8 10h5m7-6h5m4 6h4" />
            </svg>
          </span>
          <span>
            <strong>{t('game.wordmark')}</strong>
            <small>{t('game.wordmarkSubtitle')}</small>
          </span>
        </button>
        {screen === 'game' && (
          <div className="top-actions">
            <button className="button button-quiet" type="button" onClick={takeBack} disabled={!canUndo}>
              {t('game.undo')}
            </button>
            <button
              className="button button-quiet"
              type="button"
              onClick={() => {
                if (window.confirm(t('game.confirmReset'))) resetGame();
              }}
            >
              {t('game.newGame')}
            </button>
          </div>
        )}
      </header>

      {screen === 'home' ? (
        <Home
          t={t}
          onBot={() => setScreen('botSeat')}
          onLocal={() => startGame({ kind: 'local' })}
          onTutorial={() => setScreen('tutorial')}
          onOnline={() => setScreen('online')}
        />
      ) : screen === 'botSeat' ? (
        <main className="seat-select-page">
          <button className="text-action back-link" type="button" onClick={goHome}>
            ← {t('mode.back')}
          </button>
          <p className="eyebrow">{t('home.eyebrow')}</p>
          <h1>{t('bot.title')}</h1>
          <p className="page-intro">{t('bot.intro')}</p>
          <div className="seat-select-grid">
            {seats.map((seat) => (
              <button
                type="button"
                key={seat}
                className={`seat-choice seat-${seat} ${botSeat === seat ? 'is-chosen' : ''}`}
                aria-pressed={botSeat === seat}
                onClick={() => setBotSeat(seat)}
              >
                <SeatMark seat={seat} />
                <span>
                  <strong>{t(`players.${seat}`)}</strong>
                  <small>{t(`players.team${teamOf(seat)}`)}</small>
                </span>
                <span className="choice-check">{botSeat === seat ? '●' : '○'}</span>
              </button>
            ))}
          </div>
          <button
            className="button button-primary"
            type="button"
            onClick={() => startGame({ kind: 'bot', human: botSeat })}
          >
            {t('bot.start')}
          </button>
        </main>
      ) : screen === 'tutorial' ? (
        <Tutorial onExit={goHome} />
      ) : screen === 'online' ? (
        <Online onExit={goHome} />
      ) : (
        <main className="game-page">
          <div className="game-heading">
            <div>
              <p className="eyebrow">{t(mode.kind === 'local' ? 'mode.local' : 'bot.note')}</p>
              <h1>{t('brand')}</h1>
            </div>
            <div className={`turn-banner ${game.inCheck() ? 'is-check' : ''}`} aria-live="polite">
              <span className={`turn-marker seat-${game.turn}`} />
              {resultLabel()}
            </div>
          </div>
          <section className="seat-strip" aria-label={t('game.seats')}>
            {seats.map((seat) => {
              const status = statusFor(game, seat);
              const playerName =
                mode.kind === 'local'
                  ? t(`players.${seat}`)
                  : seat === mode.human
                    ? t('bot.you', { player: t(`players.${seat}`) })
                    : t('bot.bot', { player: t(`players.${seat}`) });
              return (
                <article
                  key={seat}
                  className={`seat-card seat-${seat} ${game.turn === seat && !finished ? 'is-active' : ''} ${status === 'eliminated' ? 'is-out' : ''}`}
                >
                  <SeatMark seat={seat} />
                  <div>
                    <strong>{playerName}</strong>
                    <small>{t(`game.status.${status}`)}</small>
                  </div>
                  {game.turn === seat && !finished && <i className="active-indicator" aria-hidden="true" />}
                </article>
              );
            })}
          </section>
          <div className="game-layout">
            <section className="board-column">
              {game.isSetupPhase() && (
                <div className="reserve-panel">
                  <div>
                    <p className="eyebrow">{t('game.reserveTitle')}</p>
                    <strong>{t('game.reserveRemaining', { count: game.hand(game.turn).length })}</strong>
                  </div>
                  <div className="reserve-tray" aria-label={t('game.reservePieces')}>
                    {reserves
                      .filter((type) => game.hand(game.turn).includes(type))
                      .map((type) => (
                        <button
                          type="button"
                          key={type}
                          className={`reserve-token seat-${game.turn} ${reserve === type ? 'is-selected' : ''}`}
                          disabled={thinking || finished}
                          aria-pressed={reserve === type}
                          onClick={() => {
                            setReserve(type);
                            setSelected(null);
                          }}
                        >
                          <span aria-hidden="true">{type.toUpperCase()}</span>
                          {t(`pieces.${type}`)}
                        </button>
                      ))}
                  </div>
                </div>
              )}
              <Board
                game={game}
                selected={selected}
                destinations={destinations}
                lastMove={lastMove}
                onSquareClick={!thinking && !finished ? onSquareClick : undefined}
              >
                {promotion.length > 0 && (
                  <PromotionPicker
                    player={game.turn}
                    moves={promotion}
                    onMove={playMove}
                    onCancel={() => setPromotion([])}
                  />
                )}
              </Board>
              <p className="board-hint" aria-live="polite">
                {game.isSetupPhase() ? t('game.selectReserve') : t('game.selectPiece')}
              </p>
              {error && (
                <p className="inline-error" role="alert">
                  {error}
                </p>
              )}
              {finished && (
                <div className="result-panel">
                  <span aria-hidden="true">✦</span>
                  <div>
                    <strong>{resultLabel()}</strong>
                    <small>{t('game.note')}</small>
                  </div>
                  <button className="button button-primary" type="button" onClick={resetGame}>
                    {t('game.newGame')}
                  </button>
                </div>
              )}
            </section>
            <aside className="record-panel">
              <div className="record-heading">
                <div>
                  <p className="eyebrow">{t('game.recordEyebrow')}</p>
                  <h2>{t('game.moves')}</h2>
                </div>
                <span>{game.moves().length}</span>
              </div>
              {game.isSetupPhase() && (
                <p className="setup-note">{t('game.setupNote', { player: t(`players.${game.turn}`) })}</p>
              )}
              <ol className="move-record" aria-label={t('game.logLabel')} aria-live="polite">
                {game.moves().length === 0 ? (
                  <li className="record-empty">{t('game.emptyMoves')}</li>
                ) : (
                  game
                    .moves()
                    .slice(-24)
                    .map((move, index) => (
                      <li key={`${move.uci}-${index}`} className={`move-seat-${move.color}`}>
                        <span className="record-seat">{t(`players.${move.color}`)}</span>
                        <span className="record-san">{move.san}</span>
                        <code>{move.uci}</code>
                      </li>
                    ))
                )}
              </ol>
              <div className="team-key">
                <span className="team-red" />
                {t('players.team0')}
                <span className="team-blue" />
                {t('players.team1')}
              </div>
              <button
                className="text-action tutorial-link"
                type="button"
                onClick={() => setScreen('tutorial')}
              >
                {t('game.tutorial')} ↗
              </button>
            </aside>
          </div>
        </main>
      )}
    </div>
  );
}

function SeatMark({ seat }: { seat: Seat }) {
  const { t } = useTranslation();
  return (
    <span className={`seat-mark seat-${seat}`} aria-label={t(`players.${seat}`)}>
      <span>{seat.toUpperCase()}</span>
    </span>
  );
}

function Home({
  t,
  onBot,
  onLocal,
  onTutorial,
  onOnline,
}: {
  t: (key: string, options?: Record<string, unknown>) => string;
  onBot: () => void;
  onLocal: () => void;
  onTutorial: () => void;
  onOnline: () => void;
}) {
  return (
    <main className="home-page">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="eyebrow-mark" />
            {t('home.eyebrow')}
          </p>
          <h1>
            {t('home.title')
              .split('\n')
              .map((line) => (
                <span key={line}>{line}</span>
              ))}
          </h1>
          <p className="hero-description">{t('home.description')}</p>
          <div className="hero-actions">
            <button className="button button-primary" type="button" onClick={onBot}>
              {t('home.botPlay')} <span aria-hidden="true">↗</span>
            </button>
            <button className="button button-outline" type="button" onClick={onLocal}>
              {t('home.passPlay')}
            </button>
          </div>
          <p className="hero-note">
            {t('home.boardFact')} <span>·</span> {t('home.teamFact')}
          </p>
        </div>
        <BoardMap />
        <div className="hero-tabs">
          <button type="button" onClick={onTutorial}>
            <span>01</span>
            {t('home.tutorial')}
            <b>↗</b>
          </button>
          <button type="button" onClick={onOnline}>
            <span>02</span>
            {t('home.online')}
            <b>↗</b>
          </button>
        </div>
      </section>
      <section className="home-lower">
        <div className="rules-intro">
          <p className="eyebrow">{t('home.ruleTitle')}</p>
          <p>{t('home.ruleBody')}</p>
          <button type="button" className="text-action" onClick={onTutorial}>
            {t('home.tutorial')} ↗
          </button>
        </div>
        <div className="seat-legend" aria-label={t('game.seats')}>
          {(['r', 'b', 'w', 'k'] as const).map((seat) => (
            <div key={seat} className={`legend-seat seat-${seat}`}>
              <SeatMark seat={seat} />
              <span>{t(`players.${seat}`)}</span>
              <small>{t(`players.team${teamOf(seat)}`)}</small>
            </div>
          ))}
        </div>
      </section>
      <p className="source-note">{t('home.sourceNote')}</p>
      <footer className="home-footer">
        <span>{t('brand')}</span>
        <span>{t('home.footer')}</span>
      </footer>
    </main>
  );
}

function BoardMap() {
  const { t } = useTranslation();
  return (
    <div className="hero-map" role="img" aria-label={t('home.boardLabel')}>
      <div className="map-coordinate map-top">{t('home.mapRanks')}</div>
      <div className="map-coordinate map-side">{t('home.mapFiles')}</div>
      <div className="map-grid">
        {Array.from({ length: 256 }, (_, square) => (
          <span
            key={square}
            className={`${isPlayable(square) ? 'map-square' : 'map-void'} ${[0, 3, 12, 15].includes(square % 16) || [0, 3, 12, 15].includes(Math.floor(square / 16)) ? 'map-edge' : ''}`}
          />
        ))}
        <svg className="map-lines" viewBox="0 0 100 100" aria-hidden="true">
          <path d="M11 17h11v11M78 17h11v11M11 83h11V72m67 11H78V72M17 31h8m58 0h-8M17 69h8m58 0h-8" />
          <circle cx="50" cy="50" r="2.2" />
        </svg>
        <span className="map-seat map-seat-r">R</span>
        <span className="map-seat map-seat-b">B</span>
        <span className="map-seat map-seat-w">W</span>
        <span className="map-seat map-seat-k">K</span>
      </div>
      <div className="map-caption">
        <span>{t('home.mapFigure')}</span>
        <span>{t('home.mapCaption')}</span>
        <span>{t('home.mapCellCount')}</span>
      </div>
    </div>
  );
}
