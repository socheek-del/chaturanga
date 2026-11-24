import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MoreGames } from '@chaturanga/game-shell/ui';
import { Game, threechess } from '@chaturanga/threechess';
import type { Player, SeatStatus } from '@chaturanga/threechess';
import { GLYPHS, HexBoard, parseUci, PromotionPicker, type ParsedMove } from './HexBoard';
import { Tutorial } from './Tutorial';
import { Online, requestedRoom } from './Online';

type Screen = 'home' | 'game' | 'tutorial' | 'botSetup' | 'online';
type Mode = 'local' | Player;
const STORAGE_KEY = 'threechess:hex:v1';
const saveKey = (mode: Mode): string => mode === 'local' ? STORAGE_KEY : `${STORAGE_KEY}:bot:${mode}`;
const PLAYERS: readonly Player[] = ['w', 'b', 'r'];

function loadGame(mode: Mode): Game {
  try {
    const saved = localStorage.getItem(saveKey(mode));
    if (saved) {
      try {
        const data: unknown = JSON.parse(saved);
        if (typeof data === 'object' && data !== null && 'version' in data && data.version === 2 && 'fen' in data && typeof data.fen === 'string' && 'moves' in data && Array.isArray(data.moves) && data.moves.every((move) => typeof move === 'string')) {
          const replay = new Game(threechess.startFen);
          for (const move of data.moves) replay.move(move);
          return replay.fen() === data.fen ? replay : new Game(data.fen);
        }
      } catch {
        return new Game(saved);
      }
      return new Game(saved);
    }
    return new Game(threechess.startFen);
  } catch {
    return new Game(threechess.startFen);
  }
}

function persistGame(game: Game, mode: Mode) {
  try {
    localStorage.setItem(saveKey(mode), JSON.stringify({ version: 2, fen: game.fen(), moves: game.moves().map(({ uci }) => uci) }));
  } catch { /* Private browsing can disable local storage. */ }
}

function statusLabel(status: SeatStatus, t: (key: string) => string): string {
  const labels: Record<SeatStatus, string> = {
    playing: t('players.playing'),
    check: t('players.check'),
    checkmate: t('players.checkmate'),
    stalemate: t('players.stalemate'),
    eliminated: t('players.eliminated'),
    winner: t('players.winner'),
  };
  return labels[status] ?? labels.playing;
}

export function App() {
  const { t } = useTranslation();
  const [screen, setScreen] = useState<Screen>(() => requestedRoom() ? 'online' : 'home');
  const [mode, setMode] = useState<Mode>('local');
  const [game, setGame] = useState(() => loadGame('local'));
  const [revision, setRevision] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [promotion, setPromotion] = useState<{ moves: ParsedMove[]; target: number } | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  // The engine instance is mutable, so revision also invalidates this memo after a move or take-back.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const legalMoves = useMemo(() => game.legalUci().map(parseUci).filter((move): move is ParsedMove => move !== null), [game, revision]);
  const destinations = selected === null ? [] : legalMoves.filter((move) => move.from === selected);
  const lastMove = game.lastMove();
  const lastParsed = lastMove ? parseUci(lastMove.uci) : null;
  const result = game.status();
  const isFinished = game.isGameOver();
  const thinking = screen === 'game' && mode !== 'local' && !isFinished && game.turn !== mode;
  const canUndo = mode === 'local' ? game.moves().length > 0 : game.moves().some((move) => move.color === mode);

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
      persistGame(game, mode);
      setRevision((value) => value + 1);
      setSelected(null);
      setPromotion(null);
    };
    worker.onmessage = (event: MessageEvent<string | null>) => respond(event.data);
    worker.onerror = () => respond(null);
    worker.postMessage({ fen: game.fen(), earlierFens: game.moves().map((move) => move.fenAfter) });
    const timeout = window.setTimeout(() => respond(null), 2000);
    return () => {
      active = false;
      window.clearTimeout(timeout);
      worker.terminate();
    };
  }, [game, mode, revision, thinking]);

  function refresh(next: Game = game) {
    setGame(next);
    setRevision((value) => value + 1);
    setSelected(null);
    setPromotion(null);
  }

  function playMove(move: ParsedMove) {
    game.move(move.uci);
    persistGame(game, mode);
    refresh();
  }

  function onSquareClick(square: number) {
    if (isFinished || thinking || promotion) return;
    const options = selected === null ? [] : legalMoves.filter((move) => move.from === selected && move.to === square);
    if (options.length > 1) {
      setPromotion({ moves: options, target: square });
      return;
    }
    if (options.length === 1) {
      playMove(options[0]!);
      return;
    }
    const piece = game.pieceAt(square);
    if (piece?.color === game.turn && !game.isEliminated(piece.color)) setSelected(square);
    else setSelected(null);
  }

  function startNewGame(skipConfirm = false) {
    if (!skipConfirm && game.moves().length && !window.confirm(t('game.confirmReset'))) return;
    try { localStorage.removeItem(saveKey(mode)); } catch { /* Private browsing can disable local storage. */ }
    refresh(new Game(threechess.startFen));
    setScreen('game');
    setResetOpen(false);
  }

  function openGame(next: Mode) {
    setMode(next);
    refresh(loadGame(next));
    setScreen('game');
  }

  function takeBack() {
    if (!canUndo) return;
    let undone = game.undo();
    while (mode !== 'local' && undone && undone.color !== mode) undone = game.undo();
    persistGame(game, mode);
    refresh();
  }

  function goHome() {
    const url = new URL(location.href);
    url.searchParams.delete('room');
    history.replaceState(null, '', url);
    setScreen('home');
  }

  function resultText() {
    if (result.kind === 'checkmate') return t('game.winner', { player: t(`players.${result.winner}`) });
    if (result.kind === 'stalemate') return t('game.draw');
    return game.inCheck() ? t('game.check') : t('game.turn', { player: t(`players.${game.turn}`) });
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="wordmark" href="#home" onClick={(event) => { event.preventDefault(); goHome(); }} aria-label={t('game.home')}>
          <span className="mark">3</span>
          <span className="wordmark-copy"><b>THREE</b><small>PLAYER CHESS</small></span>
        </a>
        {screen === 'game' && (
          <div className="top-actions">
            <button className="quiet-button" onClick={takeBack} disabled={!canUndo} aria-label={t('game.undo')}>
              <span aria-hidden="true">↶</span><span className="button-label">{t('game.undo')}</span>
            </button>
            <button className="quiet-button" onClick={() => setResetOpen(true)} aria-label={t('game.newGame')}>
              <span aria-hidden="true">＋</span><span className="button-label">{t('game.newGame')}</span>
            </button>
          </div>
        )}
      </header>

      {screen === 'home' ? (
        <main className="home-layout">
          <section className="hero-panel">
            <div className="hero-copy">
              <p className="eyebrow"><span className="eyebrow-dot" />{t('home.eyebrow')}</p>
              <h1>{t('home.title').split('\n').map((line) => <span key={line}>{line}</span>)}</h1>
              <p className="hero-description">{t('home.description')}</p>
              <button className="primary-button" onClick={() => openGame('local')}>
                {t('home.play')}<span aria-hidden="true">↗</span>
              </button>
              <button className="tutorial-link" type="button" onClick={() => setScreen('botSetup')}>{t('bot.start')} <span aria-hidden>↗</span></button>
              <button className="tutorial-link" type="button" onClick={() => setScreen('online')}>{t('online.title')} <span aria-hidden>↗</span></button>
              <button className="tutorial-link" type="button" onClick={() => setScreen('tutorial')}>{t('tutorial.start')} <span aria-hidden>↗</span></button>
              <p className="play-note">{t('home.note')}</p>
            </div>
            <div className="hero-art" aria-hidden="true">
              <div className="orbit orbit-one" />
              <div className="orbit orbit-two" />
              <div className="orbit orbit-three" />
              <div className="center-piece">3</div>
              <span className="orbit-label label-white">WHITE</span>
              <span className="orbit-label label-black">BLACK</span>
              <span className="orbit-label label-red">RED</span>
              <span className="orbit-glyph glyph-white">♔</span>
              <span className="orbit-glyph glyph-black">♚</span>
              <span className="orbit-glyph glyph-red">♚</span>
            </div>
          </section>
          <section className="rules-card" aria-labelledby="rules-heading">
            <div className="rules-card-heading"><span className="mini-seal">i</span><h2 id="rules-heading">{t('home.ruleTitle')}</h2></div>
            <p>{t('home.ruleBody')}</p>
            <details>
              <summary>{t('home.details')}</summary>
              <ul className="rules-list">
                <li>{t('rules.board')}</li>
                <li>{t('rules.turns')}</li>
                <li>{t('rules.pieces')}</li>
                <li>{t('rules.elimination')}</li>
              </ul>
            </details>
          </section>
          <MoreGames sites={__FAMILY__} locale="en" variant="section" />
        </main>
      ) : screen === 'botSetup' ? (
        <main className="tutorial-layout">
          <h1>{t('bot.choose')}</h1>
          <div className="tutorial-choices">
            {PLAYERS.map((player) => <button
              key={player} type="button" className="quiet-button" onClick={() => openGame(player)}>
              {t(`players.${player}`)}
            </button>)}
          </div>
        </main>
      ) : screen === 'online' ? (
        <Online />
      ) : screen === 'tutorial' ? (
        <Tutorial onExit={() => setScreen('home')} />
      ) : (
        <main className="game-layout">
          <div className="game-heading">
            <div>
              <p className="eyebrow"><span className="eyebrow-dot" />{t(mode === 'local' ? 'home.note' : 'bot.note')}</p>
              <h1>{t('brand')}</h1>
            </div>
            <div className={`turn-pill player-${game.turn} ${game.inCheck() ? 'is-check' : ''}`} aria-live="polite">
              <span className="turn-pip" />{resultText()}
            </div>
          </div>

          <section className="players-row" aria-label={t('players.playing')}>
            {PLAYERS.map((player) => {
              const status = game.playerStatus(player);
              return (
                <article key={player} className={`player-card player-${player} ${game.turn === player && !isFinished ? 'is-active' : ''} ${status === 'eliminated' ? 'is-out' : ''}`}>
                  <span className={`player-crown seat-token piece-${player}`} aria-hidden="true">{GLYPHS[player].k}</span>
                  <div className="player-copy"><strong>{t(mode === 'local' ? `players.${player}` : player === mode ? 'bot.you' : 'bot.seat', { player: t(`players.${player}`) })}</strong><small>{statusLabel(status, t)}</small></div>
                  {game.turn === player && !isFinished && <span className="active-dot" aria-label={t('game.turn', { player: t(`players.${player}`) })} />}
                </article>
              );
            })}
          </section>

          <div className="play-area">
            <section className="board-column" aria-label={t('game.turn', { player: t(`players.${game.turn}`) })}>
              <HexBoard game={game} selected={selected} destinations={destinations} lastMove={lastParsed} onSquareClick={!thinking && !isFinished ? onSquareClick : undefined}>
                {promotion && <PromotionPicker
                  player={game.turn} moves={promotion.moves} onMove={playMove} onCancel={() => setPromotion(null)}
                />}
              </HexBoard>
              <p className="board-hint" aria-live="polite">{t(thinking ? 'bot.thinking' : 'game.selectPiece')}</p>
            </section>

            <aside className="move-panel">
              <div className="move-panel-header"><div><p className="eyebrow">{t('game.logEyebrow')}</p><h2>{t('game.moves')}</h2></div><span className="move-count">{game.moves().length}</span></div>
              <ol className="move-list" aria-live="polite">
                {game.moves().length === 0 ? <li className="empty-moves">{t('game.emptyMoves')}</li> : game.moves().slice(-18).map((move, index) => (
                  <li className={`move-entry move-${move.color}`} key={`${move.uci}-${index}`}>
                    <span className="move-seat">{t(`players.${move.color}`)}</span>
                    <span className="move-san">{move.san}</span>
                    <span className="move-coordinate">{move.uci}</span>
                  </li>
                ))}
              </ol>
              {isFinished && <div className="result-card"><span className="result-star">✦</span><strong>{resultText()}</strong><p>{t('game.note')}</p><button className="primary-button compact" onClick={() => setResetOpen(true)}>{t('game.newGame')}</button></div>}
              <div className="panel-footer"><span className="turn-ring" aria-hidden="true">◉</span><span>{t('game.boardNote')}</span></div>
            </aside>
          </div>
          <MoreGames sites={__FAMILY__} locale="en" variant="footer" />
        </main>
      )}

      {resetOpen && (
        <div className="modal-scrim" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setResetOpen(false); }}>
          <section className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="reset-heading">
            <h2 id="reset-heading">{t('game.newGame')}</h2>
            <p>{t('game.confirmReset')}</p>
            <div className="modal-actions"><button className="quiet-button" onClick={() => setResetOpen(false)}>{t('game.cancel')}</button><button className="primary-button compact" onClick={() => startNewGame(true)}>{t('game.newGame')}</button></div>
          </section>
        </div>
      )}
    </div>
  );
}
