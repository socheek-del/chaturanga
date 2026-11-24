import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MoreGames } from '@chaturanga/game-shell/ui';
import { Game, hexAt, RADIUS, SIZE, parseSquare, squareName, threechess } from '@chaturanga/threechess';
import type { Player, PieceType, SeatStatus } from '@chaturanga/threechess';

type Screen = 'home' | 'game';
type ParsedMove = { uci: string; from: number; to: number; promotion?: Exclude<PieceType, 'p' | 'k'> };
const STORAGE_KEY = 'threechess:hex:v1';
const PLAYERS: readonly Player[] = ['w', 'b', 'r'];
const FILES = 'abcdefghijk';
const GLYPHS: Record<Player, Record<PieceType, string>> = {
  w: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' },
  b: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' },
  r: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' },
};

function parseUci(uci: string): ParsedMove | null {
  const match = /^([a-k](?:1[01]|[1-9]))([a-k](?:1[01]|[1-9]))([qrbn])?$/.exec(uci);
  if (!match) return null;
  const from = parseSquare(match[1]!);
  const to = parseSquare(match[2]!);
  if (from === null || to === null) return null;
  return { uci, from, to, ...(match[3] ? { promotion: match[3] as ParsedMove['promotion'] } : {}) };
}

function loadGame(): Game {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
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

function persistGame(game: Game) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 2, fen: game.fen(), moves: game.moves().map(({ uci }) => uci) }));
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

function getPieceLabel(piece: ReturnType<Game['pieceAt']>, t: (key: string, options?: Record<string, string>) => string) {
  if (!piece) return '';
  return ` · ${t('pieces.withOwner', { player: t(`players.${piece.color}`), piece: t(`pieces.${piece.type}`) })}`;
}

export function App() {
  const { t } = useTranslation();
  const [screen, setScreen] = useState<Screen>('home');
  const [game, setGame] = useState(loadGame);
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

  function refresh(next: Game = game) {
    setGame(next);
    setRevision((value) => value + 1);
    setSelected(null);
    setPromotion(null);
  }

  function playMove(move: ParsedMove) {
    game.move(move.uci);
    persistGame(game);
    refresh();
  }

  function onSquareClick(square: number) {
    if (isFinished || promotion) return;
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
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* Private browsing can disable local storage. */ }
    refresh(new Game(threechess.startFen));
    setScreen('game');
    setResetOpen(false);
  }

  function takeBack() {
    if (!game.undo()) return;
    persistGame(game);
    refresh();
  }

  function resultText() {
    if (result.kind === 'checkmate') return t('game.winner', { player: t(`players.${result.winner}`) });
    if (result.kind === 'stalemate') return t('game.draw');
    return game.inCheck() ? t('game.check') : t('game.turn', { player: t(`players.${game.turn}`) });
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="wordmark" href="#home" onClick={(event) => { event.preventDefault(); setScreen('home'); }} aria-label={t('game.home')}>
          <span className="mark">3</span>
          <span className="wordmark-copy"><b>THREE</b><small>PLAYER CHESS</small></span>
        </a>
        {screen === 'game' && (
          <div className="top-actions">
            <button className="quiet-button" onClick={takeBack} disabled={!game.moves().length} aria-label={t('game.undo')}>
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
              <button className="primary-button" onClick={() => { setScreen('game'); setRevision((value) => value + 1); }}>
                {t('home.play')}<span aria-hidden="true">↗</span>
              </button>
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
      ) : (
        <main className="game-layout">
          <div className="game-heading">
            <div>
              <p className="eyebrow"><span className="eyebrow-dot" />{t('home.note')}</p>
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
                  <div className="player-copy"><strong>{t(`players.${player}`)}</strong><small>{statusLabel(status, t)}</small></div>
                  {game.turn === player && !isFinished && <span className="active-dot" aria-label={t('game.turn', { player: t(`players.${player}`) })} />}
                </article>
              );
            })}
          </section>

          <div className="play-area">
            <section className="board-column" aria-label={t('game.turn', { player: t(`players.${game.turn}`) })}>
              <div className="board-frame">
                <div className="board-grid" role="grid" aria-label={t('game.turn', { player: t(`players.${game.turn}`) })}>
                  {Array.from({ length: SIZE }, (_, rank) => rank).map((rank) => (
                    <div className="board-row" role="row" key={rank} aria-label={t('game.boardLabel', { rank: rank + 1 })}>
                      {Array.from({ length: SIZE }, (_, file) => {
                        const q = file - RADIUS;
                        const r = rank - RADIUS;
                        const square = hexAt(q, r);
                        if (square === null) return null;
                        const shade = ((q - r) % 3 + 3) % 3;
                        const piece = game.pieceAt(square);
                        const destinationMoves = destinations.filter((move) => move.to === square);
                        const capture = destinationMoves.length > 0 && !!piece;
                        const isLast = square === lastParsed?.from || square === lastParsed?.to;
                        const ariaPiece = getPieceLabel(piece, t);
                        return (
                          <button
                            type="button"
                            role="gridcell"
                            key={square}
                            data-testid={`cell-${squareName(square)}`}
                            data-legal={destinationMoves.length > 0 || undefined}
                            aria-label={t('game.squareLabel', { file: FILES[file], rank: rank + 1, piece: ariaPiece })}
                            aria-pressed={selected === square}
                            onClick={() => onSquareClick(square)}
                            style={{ left: `${50 + (q + r / 2) * 100 / SIZE}%`, top: `${50 + r * 75 / 8.5}%` }}
                            className={`square hex-shade-${shade} ${selected === square ? 'is-selected' : ''} ${destinationMoves.length ? 'is-destination' : ''} ${capture ? 'is-capture' : ''} ${isLast ? 'is-last-move' : ''}`}
                          >
                            {piece && <span className={`piece seat-token piece-${piece.color}`} aria-hidden="true">{GLYPHS[piece.color][piece.type]}</span>}
                            {!piece && destinationMoves.length > 0 && <span className="move-dot" aria-hidden="true" />}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
                {promotion && (
                  <div className="promotion-popover" role="dialog" aria-label={t('game.promotion')}>
                    <p>{t('game.promotion')}</p>
                    <div className="promotion-options">
                      {promotion.moves.map((move) => (
                        <button key={move.uci} className="promotion-piece" onClick={() => playMove(move)} aria-label={t('game.promoteTo', { piece: t(`pieces.${move.promotion}`) })}>
                          <span className={`seat-token piece-${game.turn}`} aria-hidden="true">{GLYPHS[game.turn][move.promotion!]}</span>
                        </button>
                      ))}
                    </div>
                    <button className="promotion-cancel" onClick={() => setPromotion(null)}>{t('game.cancel')}</button>
                  </div>
                )}
              </div>
              <p className="board-hint">{t('game.selectPiece')}</p>
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
