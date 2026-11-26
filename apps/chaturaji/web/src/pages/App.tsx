import { parseUci, type ParsedMove } from '@chaturanga/board-ui';
import { MoreGames } from '@chaturanga/game-shell/ui';
import { Game, createSeededStartFen, PLAYERS, type PieceType, type Player } from '@chaturanga/chaturaji';
import { BOT_LEVELS } from '@chaturanga/chaturaji-ai';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GameBoard, playerSeatClass } from './GameBoard';
import { Online, requestedRoom } from './Online';
import { Tutorial } from './Tutorial';

type Screen = 'home' | 'setup' | 'game' | 'tutorial' | 'online';
type GameMode = 'pass' | 'bot';
interface RestoredGame { game: Game; startFen: string }
interface SavedGame { fen: string; startFen: string; moves: string[] }

const SAVE_PREFIX = 'chaturaji:table:v1';
const saveKey = (mode: GameMode, seat: Player) => `${SAVE_PREFIX}:${mode}:${seat}`;
const pieceOrder: PieceType[] = ['k', 'e', 'h', 'b', 'p'];

function randomSeed(): number {
  const seed = new Uint32Array(1);
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(seed);
  else seed[0] = Math.floor(Math.random() * 0x1_0000_0000);
  return seed[0]!;
}

function freshGame(): RestoredGame {
  const startFen = createSeededStartFen(randomSeed());
  return { game: new Game(startFen), startFen };
}

function restoreGame(mode: GameMode, seat: Player): RestoredGame {
  try {
    const raw = localStorage.getItem(saveKey(mode, seat));
    if (raw) {
      const saved = JSON.parse(raw) as Partial<SavedGame>;
      if (typeof saved.startFen === 'string' && typeof saved.fen === 'string' && Array.isArray(saved.moves) && saved.moves.every((move) => typeof move === 'string')) {
        const replay = new Game(saved.startFen);
        for (const move of saved.moves) replay.move(move);
        if (replay.fen() === saved.fen) return { game: replay, startFen: saved.startFen };
      }
    }
  } catch { /* A damaged or unavailable local save starts a fresh seeded game. */ }
  return freshGame();
}

function persistGame(game: Game, startFen: string, mode: GameMode, seat: Player): void {
  try {
    localStorage.setItem(saveKey(mode, seat), JSON.stringify({ startFen, fen: game.fen(), moves: game.moves().map((move) => move.uci) } satisfies SavedGame));
  } catch { /* Local storage can be unavailable in private browsing. */ }
}

export function App() {
  const { t } = useTranslation();
  const [screen, setScreen] = useState<Screen>(() => requestedRoom() ? 'online' : 'home');
  const [mode, setMode] = useState<GameMode>('pass');
  const [humanSeat, setHumanSeat] = useState<Player>('r');
  const [setupSeat, setSetupSeat] = useState<Player>('r');
  const [botLevel, setBotLevel] = useState<number>(2);
  const [game, setGame] = useState(() => freshGame().game);
  const [startFen, setStartFen] = useState(() => game.fen());
  const [revision, setRevision] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);

  const finished = game.isGameOver();
  const thinking = screen === 'game' && mode === 'bot' && !finished && game.turn !== humanSeat;
  const canPlay = screen === 'game' && !finished && !thinking;
  // Game is a mutable rules object. revision forces legal move regeneration after each event.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const legalMoves = useMemo(() => canPlay ? game.legalUci().map((uci) => parseUci(uci, 8)).filter((move): move is ParsedMove => move !== null) : [], [game, revision, canPlay]);
  const boardMoves = legalMoves.filter((move): move is Extract<ParsedMove, { kind: 'move' }> => move.kind === 'move');

  function updateAfterAction(target = game) {
    if (!target.isGameOver() && target.dice === null) target.prepareTurn(randomSeed());
    persistGame(target, startFen, mode, humanSeat);
    setRevision((value) => value + 1);
    setSelected(null);
  }

  function playMove(uci: string) {
    if (!canPlay || !game.legalUci().includes(uci)) return;
    game.move(uci);
    updateAfterAction();
  }

  function onSquareClick(square: number) {
    if (!canPlay) return;
    const destination = selected === null ? undefined : boardMoves.find((move) => move.from === selected && move.to === square);
    if (destination) { playMove(destination.uci); return; }
    setSelected(game.pieceAt(square)?.color === game.activeArmy ? square : null);
  }

  function begin(modeToStart: GameMode, seat: Player) {
    const restored = restoreGame(modeToStart, seat);
    setMode(modeToStart);
    setHumanSeat(seat);
    setGame(restored.game);
    setStartFen(restored.startFen);
    setRevision((value) => value + 1);
    setSelected(null);
    setScreen('game');
  }

  function newGame() {
    const restored = freshGame();
    setGame(restored.game);
    setStartFen(restored.startFen);
    setRevision((value) => value + 1);
    setSelected(null);
    persistGame(restored.game, restored.startFen, mode, humanSeat);
  }

  useEffect(() => {
    if (!thinking) return;
    const fallback = game.legalUci()[0] ?? 'pass';
    let active = true;
    const worker = new Worker(new URL('../bot.worker.ts', import.meta.url), { type: 'module' });
    const respond = (suggested: string | null) => {
      if (!active) return;
      active = false;
      const move = suggested && game.legalUci().includes(suggested) ? suggested : fallback;
      if (game.legalUci().includes(move)) {
        game.move(move);
        updateAfterAction();
      }
      worker.terminate();
    };
    worker.onmessage = (event: MessageEvent<string | null>) => respond(event.data);
    worker.onerror = () => respond(null);
    worker.postMessage({ fen: game.fen(), seed: randomSeed(), level: botLevel });
    const timeout = window.setTimeout(() => respond(null), 8_000);
    return () => { active = false; window.clearTimeout(timeout); worker.terminate(); };
    // updateAfterAction is stable for the current render; the effect is keyed by the mutable-state revision.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game, revision, thinking, humanSeat, botLevel]);

  const status = game.status();
  const winnerNames = status.kind === 'points' ? status.winners.map((player) => t(`players.${player}`)).join(', ') : '';
  const activeDie = game.dice?.[game.dieIndex] ?? null;
  const history = game.moves();

  return (
    <div className="app-shell">
      <header className="masthead">
        <button type="button" className="wordmark" onClick={() => setScreen('home')} aria-label={t('navigation.home')}>
          <span className="seal" aria-hidden="true"><i /><i /><i /><i /></span>
          <span className="brand-copy"><strong>{t('brand')}</strong><small>{t('brandTagline')}</small></span>
        </button>
        <nav className="nav-actions" aria-label={t('navigation.label')}>
          <button type="button" className="nav-link" onClick={() => setScreen('tutorial')}>{t('navigation.learn')}</button>
          {screen !== 'home' && <button type="button" className="nav-link" onClick={() => setScreen('home')}>{t('navigation.home')}</button>}
        </nav>
      </header>

      {screen === 'home' && <Home onPass={() => begin('pass', 'r')} onBots={() => setScreen('setup')} onLearn={() => setScreen('tutorial')} onOnline={() => setScreen('online')} />}

      {screen === 'setup' && <main className="seat-picker-page">
        <p className="eyebrow"><span className="eyebrow-mark" />{t('bot.eyebrow')}</p>
        <h1 className="page-title">{t('bot.title')}</h1>
        <p className="page-description">{t('bot.body')}</p>
        <div className="seat-picker" role="group" aria-label={t('bot.chooseSeat')}>
          {PLAYERS.map((player) => <button key={player} type="button" className={`seat-choice ${playerSeatClass(player)} ${setupSeat === player ? 'is-selected' : ''}`} aria-pressed={setupSeat === player} onClick={() => setSetupSeat(player)}>
            <span className="seat-dot" /><strong>{t(`players.${player}`)}</strong><small>{setupSeat === player ? t('players.you') : t('players.bot')}</small>
          </button>)}
        </div>
        <label className="level-label" htmlFor="bot-level">{t('bot.level')}</label>
        <select id="bot-level" className="level-select" value={botLevel} onChange={(event) => setBotLevel(Number(event.target.value))}>
          {BOT_LEVELS.map(({ level }) => <option key={level} value={level}>{t('bot.levelName', { level })}</option>)}
        </select>
        <div className="button-row setup-actions">
          <button className="button button-primary" type="button" onClick={() => begin('bot', setupSeat)}>{t('bot.start', { player: t(`players.${setupSeat}`) })}</button>
          <button className="text-button" type="button" onClick={() => setScreen('home')}>{t('navigation.back')}</button>
        </div>
      </main>}

      {screen === 'game' && <main className="play-page">
        <div className="play-heading">
          <div><p className="eyebrow"><span className="eyebrow-mark" />{t(mode === 'bot' ? 'game.botMode' : 'game.passMode')}</p><h1 className="page-title">{t('game.title')}</h1></div>
          <div className={`turn-chip ${playerSeatClass(game.turn)}`} aria-live="polite"><span className="seat-dot" />{thinking ? t('game.thinking', { player: t(`players.${game.turn}`) }) : t('game.turn', { player: t(`players.${game.turn}`), army: t(`players.${game.activeArmy}`) })}</div>
        </div>
        <div className="seat-cards" aria-label={t('game.seats')}>
          {PLAYERS.map((player) => {
            const kingCaptured = game.kingCaptureOwners[player] !== null;
            const controller = game.controllers[player];
            return <article key={player} className={`seat-card ${playerSeatClass(player)} ${game.activeArmy === player && !finished ? 'is-active' : ''} ${kingCaptured ? 'is-captured' : ''}`}>
              <span className="seat-dot" />
              <span className="seat-label"><strong>{t(`players.${player}`)}</strong><small>{controller !== player ? t('game.controlledBy', { player: t(`players.${controller}`) }) : mode === 'bot' && player === humanSeat ? t('players.you') : mode === 'bot' ? t('players.bot') : t('game.originalKing', { state: t(kingCaptured ? 'game.lost' : 'game.safe') })}</small></span>
              <span className="seat-points">{game.scores[player]}<small> {t('game.pointsShort')}</small></span>
            </article>;
          })}
        </div>
        <div className="play-layout">
          <section className="board-column" aria-label={t('game.boardLabel')}>
            <GameBoard game={game} selected={selected} legalMoves={legalMoves} canPlay={canPlay} onSquareClick={onSquareClick} onMove={playMove} />
            <p className="board-hint" aria-live="polite">{thinking ? t('bot.thinking') : canPlay ? t('game.moveHint', { piece: activeDie === null ? '' : t(`die.faces.${activeDie}`) }) : t('game.finishedHint')}</p>
          </section>
          <aside className="game-rail">
            <section className="rail-card">
              <div className="rail-heading"><div><p className="eyebrow">{t('game.diceEyebrow')}</p><h2>{t('game.diceTitle')}</h2></div><span className="turn-count">{t('game.actionCount', { current: game.dice ? game.dieIndex + 1 : 0 })}</span></div>
              {game.dice ? <div className="die-row">{game.dice.map((face, index) => <div key={`${face}-${index}`} className={`die-tile ${game.dieIndex === index ? 'is-current' : ''}`}>
                <span className="die-face">{face}</span><span><small>{t(index === 0 ? 'game.firstDie' : 'game.secondDie')}</small><strong>{t(`die.faces.${face}`)}</strong></span>
              </div>)}</div> : <p className="empty-history">{t('game.waitingForRoll')}</p>}
              {activeDie !== null && <p className="pass-note">{t('game.eligiblePieces', { pieces: t(`die.faces.${activeDie}`) })}</p>}
              {canPlay && <div className="action-row"><button className="button button-quiet" type="button" onClick={() => playMove('pass')}>{t('game.pass')}</button></div>}
            </section>
            <ScorePanel game={game} />
            <section className="rail-card"><div className="rail-heading"><div><p className="eyebrow">{t('game.recordEyebrow')}</p><h2>{t('game.recordTitle')}</h2></div></div>
              {history.length ? <ol className="move-history">{history.slice(-14).reverse().map((move, index) => <li key={`${move.uci}-${history.length - index}`}><span className={`history-seat ${playerSeatClass(move.color)}`}>{t(`players.${move.color}`)}</span><code>{move.uci}</code><small>{t(`game.event.${move.action ?? 'move'}`)}</small></li>)}</ol> : <p className="empty-history">{t('game.noMoves')}</p>}
            </section>
            {finished && <section className="result-card" aria-live="polite"><p className="eyebrow">{t('game.resultEyebrow')}</p><h2>{t('game.winner', { players: winnerNames })}</h2><p>{t('game.resultBody')}</p></section>}
            <div className="game-controls"><button type="button" className="button button-primary" onClick={newGame}>{t('game.newGame')}</button><button type="button" className="button button-quiet" onClick={() => setScreen('tutorial')}>{t('navigation.learn')}</button></div>
          </aside>
        </div>
      </main>}

      {screen === 'tutorial' && <Tutorial onExit={() => setScreen('home')} />}
      {screen === 'online' && <Online onExit={() => setScreen('home')} />}
      <footer className="site-footer"><MoreGames sites={__FAMILY__} locale="en" variant="footer" /></footer>
    </div>
  );
}

function Home({ onPass, onBots, onLearn, onOnline }: { onPass: () => void; onBots: () => void; onLearn: () => void; onOnline: () => void }) {
  const { t } = useTranslation();
  return <main className="home-page">
    <section className="hero">
      <div className="hero-copy">
        <p className="eyebrow"><span className="eyebrow-mark" />{t('home.eyebrow')}</p>
        <h1>{t('home.title')}</h1>
        <p className="hero-description">{t('home.description')}</p>
        <div className="button-row"><button className="button button-primary" type="button" onClick={onBots}>{t('home.playBots')}</button><button className="button button-outline" type="button" onClick={onPass}>{t('home.passPlay')}</button><button className="button button-outline" type="button" onClick={onOnline}>{t('home.online')}</button></div>
        <p className="hero-note">{t('home.note')}</p>
      </div>
      <FourCourts />
    </section>
    <div className="fact-strip"><div className="fact"><b>4</b><span>{t('home.factSeats')}</span></div><div className="fact"><b>2</b><span>{t('home.factDice')}</span></div><div className="fact"><b>8×8</b><span>{t('home.factBoard')}</span></div></div>
    <div className="home-lower">
      <section className="paper-card"><p className="eyebrow">{t('home.aboutEyebrow')}</p><h2>{t('home.aboutTitle')}</h2><p>{t('home.aboutBody')}</p><button className="text-button" type="button" onClick={onLearn}>{t('home.learnRules')}</button></section>
      <section className="paper-card seat-legend"><p className="eyebrow">{t('home.seatsEyebrow')}</p>{PLAYERS.map((player) => <div className={`legend-row ${playerSeatClass(player)}`} key={player}><span className="seat-dot" /><span>{t(`players.${player}`)}</span><small>{t(`home.direction.${player}`)}</small></div>)}</section>
    </div>
  </main>;
}

function FourCourts() {
  const { t } = useTranslation();
  return <div className="hero-mark" role="img" aria-label={t('home.boardArt')}>
    <span className="hero-ring" /><span className="hero-ring inner" />
    <span className="court-arm north seat-b"><span className="court-marker">B</span></span>
    <span className="court-arm east seat-r"><span className="court-marker">R</span></span>
    <span className="court-arm south seat-g"><span className="court-marker">G</span></span>
    <span className="court-arm west seat-y"><span className="court-marker">Y</span></span>
    <span className="court-center"><span>{t('home.boardCenter')}</span></span>
  </div>;
}

function ScorePanel({ game }: { game: Game }) {
  const { t } = useTranslation();
  return <section className="rail-card"><div className="rail-heading"><div><p className="eyebrow">{t('game.scoreEyebrow')}</p><h2>{t('game.scoreTitle')}</h2></div></div>
    <div className="score-list">{PLAYERS.map((player) => <div className={`score-line ${playerSeatClass(player)}`} key={player}><span className="seat-dot" /><span>{t(`players.${player}`)}</span><strong>{game.scores[player]} {t('game.pointsShort')}</strong></div>)}</div>
    <p className="pool-heading">{t('game.capturedPool')}</p>
    {PLAYERS.map((player) => <div className="pool-row" key={player}><span className={`pool-owner ${playerSeatClass(player)}`}>{t(`players.${player}`)}</span><div className="pool-list">{game.capturedPools[player].length ? game.capturedPools[player].map((piece, index) => <span className="pool-piece" key={`${piece}-${index}`} aria-label={t('game.capturedPiece', { piece: t(`piece.${piece}`) })}>{t(`piece.short.${piece}`)}</span>) : <span className="pool-empty">—</span>}</div></div>)}
    <div className="point-key">{pieceOrder.map((piece) => <span key={piece}>{t(`piece.short.${piece}`)} <b>{piece === 'p' ? 1 : piece === 'b' ? 2 : piece === 'h' ? 3 : piece === 'e' ? 4 : 5}</b></span>)}</div>
  </section>;
}
