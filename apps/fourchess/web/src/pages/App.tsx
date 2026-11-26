import { parseUci } from '@chaturanga/board-ui';
import { MoreGames } from '@chaturanga/game-shell/ui';
import { Game, PLAYERS, fourchess, type Player } from '@chaturanga/fourchess';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GameBoard } from './GameBoard';
import { Online, requestedRoom } from './Online';
import { Tutorial } from './Tutorial';

type Screen = 'home' | 'game' | 'tutorial' | 'botSetup' | 'online';
type GameMode = 'pass' | 'bot';

const SAVE_PREFIX = 'fourfold:cross:v1';
const modeKey = (mode: GameMode, seat: Player) => mode === 'pass' ? `${SAVE_PREFIX}:pass` : `${SAVE_PREFIX}:bot:${seat}`;
const seatClass = (player: Player) => `seat-${player}`;

function readGame(key: string): Game {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Game();
    const data: unknown = JSON.parse(raw);
    if (typeof data !== 'object' || data === null || !('fen' in data) || typeof data.fen !== 'string') return new Game(raw);
    if ('moves' in data && Array.isArray(data.moves) && data.moves.every((move) => typeof move === 'string')) {
      const replay = new Game(fourchess.startFen);
      for (const move of data.moves) replay.move(move);
      return replay.fen() === data.fen ? replay : new Game(data.fen);
    }
    return new Game(data.fen);
  } catch {
    return new Game();
  }
}

function saveGame(game: Game, key: string): void {
  try {
    localStorage.setItem(key, JSON.stringify({ fen: game.fen(), moves: game.moves().map((move) => move.uci) }));
  } catch { /* Local storage can be unavailable in private browsing. */ }
}

export function App() {
  const { t } = useTranslation();
  const [screen, setScreen] = useState<Screen>(() => requestedRoom() ? 'online' : 'home');
  const [mode, setMode] = useState<GameMode>('pass');
  const [humanSeat, setHumanSeat] = useState<Player>('r');
  const [game, setGame] = useState(() => readGame(modeKey('pass', 'r')));
  const [revision, setRevision] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [botSetupSeat, setBotSetupSeat] = useState<Player>('r');

  const isFinished = game.isGameOver();
  const thinking = screen === 'game' && mode === 'bot' && !isFinished && game.turn !== humanSeat;
  const canPlay = screen === 'game' && !isFinished && !thinking && (mode === 'pass' || game.turn === humanSeat);
  // Game is intentionally mutable; revision invalidates legal moves after every accepted action.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const legalMoves = useMemo(() => canPlay ? game.legalUci().map((uci) => parseUci(uci, 14)).filter((move) => move !== null) : [], [game, revision, canPlay]);
  const moveTargets = legalMoves.filter((move) => move.kind === 'move');

  useEffect(() => {
    if (!thinking) return;
    const fallback = game.legalUci()[0];
    if (!fallback) return;
    let active = true;
    const worker = new Worker(new URL('./bot.worker.ts', import.meta.url), { type: 'module' });
    const respond = (suggested: string | null) => {
      if (!active) return;
      active = false;
      const move = suggested && game.legalUci().includes(suggested) ? suggested : fallback;
      game.move(move);
      saveGame(game, modeKey('bot', humanSeat));
      setRevision((value) => value + 1);
      setSelected(null);
    };
    worker.onmessage = (event: MessageEvent<string | null>) => respond(event.data);
    worker.onerror = () => respond(null);
    worker.postMessage({ fen: game.fen(), seed: 0x4f4f + game.moves().length + PLAYERS.indexOf(game.turn), maxNodes: 850 });
    const timeout = window.setTimeout(() => respond(null), 12_000);
    return () => {
      active = false;
      window.clearTimeout(timeout);
      worker.terminate();
    };
  }, [game, humanSeat, revision, thinking]);

  function updateAfterAction(target = game) {
    saveGame(target, modeKey(mode, humanSeat));
    setRevision((value) => value + 1);
    setSelected(null);
  }

  function playMove(uci: string) {
    if (!canPlay) return;
    game.move(uci);
    updateAfterAction();
  }

  function onSquareClick(square: number) {
    if (!canPlay) return;
    const chosen = selected === null ? [] : moveTargets.filter((move) => move.from === selected && move.to === square);
    if (chosen[0]?.kind === 'move') {
      playMove(chosen[0].uci);
      return;
    }
    const piece = game.pieceAt(square);
    setSelected(piece?.color === game.turn && game.isActive(game.turn) ? square : null);
  }

  function startPassGame() {
    setMode('pass');
    setHumanSeat('r');
    const next = readGame(modeKey('pass', 'r'));
    setGame(next);
    setRevision((value) => value + 1);
    setSelected(null);
    setScreen('game');
  }

  function startBotGame(seat: Player) {
    setMode('bot');
    setHumanSeat(seat);
    const next = readGame(modeKey('bot', seat));
    setGame(next);
    setRevision((value) => value + 1);
    setSelected(null);
    setScreen('game');
  }

  function newGame() {
    if (game.moves().length && !window.confirm(t('game.confirmReset'))) return;
    try { localStorage.removeItem(modeKey(mode, humanSeat)); } catch { /* Storage is optional. */ }
    const next = new Game();
    setGame(next);
    setRevision((value) => value + 1);
    setSelected(null);
  }

  function takeBack() {
    if (!game.moves().length || isFinished) return;
    let undone = game.undo();
    if (mode === 'bot') {
      while (undone && undone.color !== humanSeat) undone = game.undo();
      if (undone && undone.color === humanSeat) game.undo();
    }
    updateAfterAction();
  }

  function resign() {
    const player = mode === 'bot' ? humanSeat : game.turn;
    if (!game.resign(player)) return;
    updateAfterAction();
  }

  function goHome() {
    const url = new URL(location.href);
    url.searchParams.delete('room');
    history.replaceState(null, '', url);
    setScreen('home');
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button type="button" className="wordmark" onClick={goHome} aria-label={t('navigation.home')}>
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /><i /></span>
          <span className="brand-copy"><strong>{t('brand')}</strong><small>{t('brandTagline')}</small></span>
        </button>
        <nav className="top-actions" aria-label={t('navigation.home')}>
          <button type="button" className="top-link" onClick={() => setScreen('tutorial')}>{t('navigation.learn')}</button>
          {screen !== 'home' && <button type="button" className="top-link" onClick={goHome}>{t('navigation.home')}</button>}
        </nav>
      </header>

      {screen === 'home' && <Home onPass={startPassGame} onBotSetup={() => setScreen('botSetup')} onTutorial={() => setScreen('tutorial')} onOnline={() => setScreen('online')} />}

      {screen === 'botSetup' && <main className="setup-page">
        <p className="eyebrow">{t('bot.title')}</p>
        <h1>{t('bot.body')}</h1>
        <div className="seat-picker">
          {PLAYERS.map((player) => <button type="button" key={player} className={`seat-pick ${seatClass(player)} ${botSetupSeat === player ? 'is-picked' : ''}`}
            onClick={() => setBotSetupSeat(player)} aria-pressed={botSetupSeat === player}>
            <span className="seat-dot" /><strong>{t(`players.${player}`)}</strong><small>{player === botSetupSeat ? t('players.you') : t('players.bot')}</small>
          </button>)}
        </div>
        <button className="button button-primary" type="button" onClick={() => startBotGame(botSetupSeat)}>{t('bot.start', { player: t(`players.${botSetupSeat}`) })}</button>
        <button className="text-button" type="button" onClick={goHome}>{t('navigation.back')}</button>
      </main>}

      {screen === 'game' && <main className="game-page">
        <div className="game-heading">
          <div><p className="eyebrow">{mode === 'pass' ? t('game.passMode') : t('game.botMode')}</p><h1>{t('game.title')}</h1></div>
          <div className={`turn-banner ${game.inCheck() ? 'is-check' : ''}`} aria-live="polite">
            <span className={`turn-pip ${seatClass(game.turn)}`} />
            {thinking ? t('game.thinking', { player: t(`players.${game.turn}`) }) : game.inCheck() ? t('game.check', { player: t(`players.${game.turn}`) }) : t('game.turn', { player: t(`players.${game.turn}`) })}
          </div>
        </div>
        <div className="player-orbit">
          {PLAYERS.map((player) => <PlayerCard key={player} player={player} game={game} humanSeat={mode === 'bot' ? humanSeat : null} />)}
        </div>
        <div className="play-layout">
          <section className="board-column" aria-label={t('game.boardLabel')}>
            <GameBoard game={game} selected={selected} legalMoves={legalMoves} canPlay={canPlay} onSquareClick={onSquareClick} onMove={playMove} />
            <p className="board-hint">{canPlay ? t('game.moveHint') : thinking ? t('bot.thinking') : t('game.status.eliminated')}</p>
          </section>
          <aside className="game-rail">
            <ScorePanel game={game} />
            <MovePanel game={game} />
            {isFinished && <ResultCard game={game} />}
            <div className="game-controls">
              <button type="button" className="button button-quiet" onClick={takeBack} disabled={!game.moves().length || isFinished}>{t('game.takeback')}</button>
              <button type="button" className="button button-quiet" onClick={resign} disabled={isFinished || (mode === 'bot' && !game.isActive(humanSeat))}>{t('game.resign')}</button>
              <button type="button" className="button button-primary" onClick={newGame}>{t('game.newGame')}</button>
            </div>
          </aside>
        </div>
      </main>}

      {screen === 'tutorial' && <Tutorial onExit={goHome} />}
      {screen === 'online' && <Online onExit={goHome} />}
      <footer className="site-footer"><MoreGames sites={__FAMILY__} locale="en" variant="footer" /></footer>
    </div>
  );
}

function Home({ onPass, onBotSetup, onTutorial, onOnline }: { onPass: () => void; onBotSetup: () => void; onTutorial: () => void; onOnline: () => void }) {
  const { t } = useTranslation();
  return (
    <main className="home-page">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow"><span className="status-light" />{t('home.eyebrow')}</p>
          <h1>{t('home.title').split('\n').map((line) => <span key={line}>{line}</span>)}</h1>
          <p className="hero-description">{t('home.body')}</p>
          <div className="hero-actions">
            <button type="button" className="button button-primary" onClick={onPass}>{t('home.playPass')} <span aria-hidden="true">↗</span></button>
            <button type="button" className="button button-outline" onClick={onBotSetup}>{t('home.playBots')}</button>
          </div>
          <p className="play-note">{t('home.onlineNote')}</p>
        </div>
        <CrossMap />
      </section>
      <section className="feature-strip" aria-label={t('home.mapLabel')}>
        <Fact icon="⌗" label={t('home.facts.board')} />
        <Fact icon="↻" label={t('home.facts.seats')} />
        <Fact icon="◉" label={t('home.facts.goal')} />
      </section>
      <section className="home-lower">
        <article className="rules-card">
          <p className="eyebrow">{t('home.rulesEyebrow')}</p>
          <h2>{t('home.rulesTitle')}</h2>
          <p>{t('home.rulesBody')}</p>
          <div className="lower-actions">
            <button type="button" className="text-button" onClick={onTutorial}>{t('home.tutorial')} <span aria-hidden="true">→</span></button>
            <button type="button" className="text-button" onClick={onOnline}>{t('home.online')} <span aria-hidden="true">→</span></button>
          </div>
        </article>
        <div className="seat-legend">
          {PLAYERS.map((player) => <div key={player} className={`legend-row ${seatClass(player)}`}><span className="seat-dot" /><span>{t(`players.${player}`)}</span><small>{t(`players.position.${player}`)}</small></div>)}
        </div>
      </section>
    </main>
  );
}

function CrossMap() {
  const { t } = useTranslation();
  return (
    <div className="hero-map" role="img" aria-label={t('home.mapLabel')}>
      <div className="map-ring ring-a" /><div className="map-ring ring-b" />
      <div className="map-arm arm-north"><span className="map-seat seat-y">Y</span></div>
      <div className="map-arm arm-east"><span className="map-seat seat-g">G</span></div>
      <div className="map-arm arm-south"><span className="map-seat seat-r">R</span></div>
      <div className="map-arm arm-west"><span className="map-seat seat-b">B</span></div>
      <div className="map-center"><span>4</span><small>{t('home.seatsLabel')}</small></div>
      <span className="north-mark">N</span>
    </div>
  );
}

function Fact({ icon, label }: { icon: string; label: string }) {
  return <div className="fact-item"><span aria-hidden="true">{icon}</span><strong>{label}</strong></div>;
}

function PlayerCard({ player, game, humanSeat }: { player: Player; game: Game; humanSeat: Player | null }) {
  const { t } = useTranslation();
  const status = game.playerStatus(player);
  const statusKey = status === 'playing' ? game.turn === player ? 'turn' : 'active' : status;
  return (
    <article className={`player-card ${seatClass(player)} ${game.turn === player && !game.isGameOver() ? 'is-active' : ''} ${!game.isActive(player) ? 'is-out' : ''}`}>
      <span className="seat-dot" />
      <div className="player-name"><strong>{t(`players.${player}`)}</strong><small>{humanSeat === player ? t('players.you') : humanSeat ? t('players.bot') : t('game.passMode')}</small></div>
      {game.turn === player && !game.isGameOver() && <span className="active-tick" aria-hidden="true" />}
      <span className="player-state">{t(`players.${statusKey}`)}</span>
      <strong className="player-score">{game.score(player)}<small> {t('players.points')}</small></strong>
    </article>
  );
}

function ScorePanel({ game }: { game: Game }) {
  const { t } = useTranslation();
  return (
    <section className="rail-card score-panel">
      <div className="rail-heading"><div><p className="eyebrow">{t('game.table')}</p><h2>{t('game.scores')}</h2></div><span className="round-chip">{game.moves().length}</span></div>
      {PLAYERS.map((player) => <div key={player} className={`score-row ${seatClass(player)}`}><span className="seat-dot" /><span>{t(`players.${player}`)}</span><strong>{game.score(player)}</strong></div>)}
    </section>
  );
}

function MovePanel({ game }: { game: Game }) {
  const { t } = useTranslation();
  const moves = game.moves();
  return (
    <section className="rail-card move-panel">
      <div className="rail-heading"><div><p className="eyebrow">{t('game.historyEyebrow')}</p><h2>{t('game.history')}</h2></div><span className="round-chip">{moves.length}</span></div>
      {moves.length === 0 ? <p className="empty-history">{t('game.noMoves')}</p> : (
        <ol className="move-history">
          {moves.slice(-18).map((move, index) => <li key={`${move.uci}-${index}`} className={seatClass(move.color)}><span className="history-seat">{t(`players.${move.color}`)}</span><span>{move.san}</span><code>{move.uci}</code></li>)}
        </ol>
      )}
    </section>
  );
}

function ResultCard({ game }: { game: Game }) {
  const { t } = useTranslation();
  const status = game.status();
  if (status.kind !== 'points') return null;
  const winners = status.winners.map((player) => t(`players.${player}`));
  return (
    <section className="result-card" aria-live="polite">
      <span aria-hidden="true" className="result-rosette">✦</span>
      <p className="eyebrow">{t('game.endTitle')}</p>
      <strong>{winners.length ? t('game.winnerLine', { players: winners.join(' · ') }) : t('game.drawLine')}</strong>
      <p>{t(`game.reason.${status.reason}`)}</p>
      {PLAYERS.map((player) => <div key={player} className={`result-score ${seatClass(player)}`}><span>{t(`players.${player}`)}</span><strong>{status.scores[player]}</strong></div>)}
    </section>
  );
}
