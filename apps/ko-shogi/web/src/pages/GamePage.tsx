import { Board } from '@chaturanga/board-ui';
import type { Candidate } from '@chaturanga/ko-shogi';
import { Game, squareOf } from '@chaturanga/ko-shogi';
import type { GameStatus } from '@chaturanga/rules-core';
import { Button } from '@chaturanga/ui';
import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useNavigate, useParams } from 'react-router';
import { ActionPicker } from '../components/ActionPicker';
import { useBoardIdentity } from '../board';
import { requestComputerMove, cancelComputerMove } from '../features/ai/aiClient';
import { BOTS, botById } from '@chaturanga/ko-shogi-ai';
import type { Color } from '@chaturanga/rules-core';
import { gameRoute, newSession, readSavedSession, saveSession, sessionGame, type GameMode, type SavedSession } from '../stores/sessions';

function seedOf(text: string): number {
  let seed = 2_166_136_261;
  for (const char of text) seed = Math.imul(seed ^ char.charCodeAt(0), 16_777_619);
  return seed >>> 0;
}

function winnerFromStatus(status: GameStatus<Color>): Color | null {
  if ('winner' in status && status.winner) return status.winner;
  return null;
}

function GameRoute() {
  const { mode: rawMode, side, level: rawLevel } = useParams();
  const saved = readSavedSession();
  const level = Number(rawLevel);
  if ((rawMode !== 'bot' && rawMode !== 'local') || (side !== 'w' && side !== 'b')
    || !Number.isInteger(level) || level < 1 || level > BOTS.length
    || !saved || saved.mode !== rawMode || saved.humanColor !== side || saved.level !== level)
    return <Navigate to="/play" replace />;
  try {
    const game = sessionGame(saved);
    return <ActiveGame key={gameRoute(saved)} initialSession={saved} initialGame={game} />;
  } catch { return <Navigate to="/play" replace />; }
}

export function GamePage() { return <GameRoute />; }

function ActiveGame({ initialSession, initialGame }: { initialSession: SavedSession; initialGame: Game }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const board = useBoardIdentity();
  const [session, setSession] = useState(initialSession);
  const [game] = useState(initialGame);
  const [version, setVersion] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [movesForSelected, setMovesForSelected] = useState<readonly Candidate[]>([]);
  const [routeChoices, setRouteChoices] = useState<readonly Candidate[]>([]);
  const [thinking, setThinking] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [resultText, setResultText] = useState<string | null>(null);
  const mode: GameMode = session.mode;
  const humanColor = session.humanColor;
  const bot = botById(session.level);
  const status = game.status();
  const ended = status.kind !== 'ongoing' || resultText !== null;
  const botTurn = mode === 'bot' && game.turn !== humanColor && !ended;
  const inputEnabled = !ended && !thinking && (mode === 'local' || game.turn === humanColor);
  const targets = useMemo(() => [...new Set(movesForSelected.map(({ to }) => to))], [movesForSelected]);
  const latest = game.lastMove();
  const lastMove = latest ? { to: latest.to, from: squareOf(latest.uci.match(/^[a-s](?:1[0-9]|[1-9])/u)?.[0] ?? '') } : null;
  const orientation: Color = mode === 'bot' ? humanColor : flipped ? 'b' : 'w';

  const persist = useCallback(() => {
    const updated: SavedSession = { ...session, moves: game.moves().map(({ uci }) => uci), savedAt: Date.now() };
    setSession(updated);
    saveSession(updated);
    setVersion((current) => current + 1);
    setSelected(null);
    setMovesForSelected([]);
    setRouteChoices([]);
  }, [game, session]);

  const playCandidate = useCallback((candidate: Candidate) => {
    try {
      game.playGeneratedCandidate(candidate);
      setResultText(null);
      persist();
    } catch (error) {
      console.error('Ko Shogi rejected a candidate supplied by the board.', error);
      setSelected(null);
      setMovesForSelected([]);
      setRouteChoices([]);
    }
  }, [game, persist]);

  const chooseSquare = (square: number) => {
    if (!inputEnabled) return;
    if (selected !== null && targets.includes(square)) {
      const matches = movesForSelected.filter((candidate) => candidate.to === square);
      if (matches.length === 1) playCandidate(matches[0]!);
      else if (matches.length > 1) setRouteChoices(matches);
      return;
    }
    const piece = game.pieceAt(square);
    if (piece?.color === game.turn) {
      const moves = game.legalCandidatesFrom(square);
      setSelected(square);
      setMovesForSelected(moves);
      setRouteChoices([]);
      return;
    }
    setSelected(null);
    setMovesForSelected([]);
    setRouteChoices([]);
  };

  useEffect(() => {
    if (!botTurn) { setThinking(false); return; }
    const currentFen = game.fen();
    const moves = session.moves;
    let active = true;
    setThinking(true);
    requestComputerMove(session.startFen, moves, session.level, seedOf(session.startFen + moves.join('|')))
      .then((answer) => {
        if (!active || game.fen() !== currentFen) return;
        const name = answer.uci?.match(/^[a-s](?:1[0-9]|[1-9])/u)?.[0];
        const origin = name ? squareOf(name) : null;
        const candidate = origin === null || !answer.uci ? undefined : game.legalCandidatesFrom(origin).find((action) => action.uci === answer.uci);
        if (candidate) playCandidate(candidate);
        else {
          const fallback = game.searchCandidates(64, 8)[0];
          if (fallback) {
            game.playSearchCandidate(fallback);
            persist();
          }
        }
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (!(error instanceof Error && error.name === 'AiCancelled')) console.error('Ko Shogi bot could not return a move.', error);
        const fallback = game.searchCandidates(64, 8)[0];
        if (game.fen() === currentFen && fallback) {
          game.playSearchCandidate(fallback);
          persist();
        }
      })
      .finally(() => { if (active) setThinking(false); });
    return () => { active = false; cancelComputerMove(); setThinking(false); };
  }, [botTurn, game, persist, playCandidate, session, version]);

  const undo = () => {
    if (!game.moves().length || thinking) return;
    if (mode === 'bot' && game.turn === humanColor) {
      game.undo();
      if (game.turn !== humanColor) game.undo();
    } else game.undo();
    setResultText(null);
    persist();
  };

  const rematch = () => {
    const next = newSession(mode, humanColor, session.level);
    saveSession(next);
    setResultText(null);
    navigate(gameRoute(next), { replace: true });
  };

  const winner = winnerFromStatus(status);
  const statusLine = resultText ?? (() => {
    if (status.kind === 'ongoing') return t('game.turn', { color: t(`colors.${game.turn}`) });
    if (status.kind === 'progression') return t('game.resultWin', { color: t(`colors.${status.winner}`) });
    if (status.kind === 'perpetual-check') return t('game.resultPerpetual', { color: t(`colors.${status.winner}`) });
    if (status.kind === 'repetition') return t('game.resultRepetition');
    if (status.kind === 'stalemate') return winner ? t('game.resultLoss', { color: t(`colors.${game.turn}`) }) : t('game.resultDraw');
    return t('game.gameOver');
  })();
  const moves = game.moves();

  return <section className="game-page">
    <div className="game-heading">
      <div><p className="eyebrow"><span className="eyebrow-rule" />{mode === 'bot' ? t('game.botLabel', { name: t(`bots.${bot.key}.name`) }) : t('game.localLabel')}</p><h1>{mode === 'bot' ? t('home.playBot') : t('home.passPlay')}</h1></div>
      <span className="save-indicator">{t('game.saved')}</span>
    </div>
    <div className="game-layout">
      <div className="game-board-column">
        <div className="player-strip player-strip--top">
          <PieceSealOrName color={orientation === 'w' ? 'b' : 'w'} name={mode === 'bot' ? (humanColor === 'b' ? t(`bots.${bot.key}.name`) : t('game.botLabel', { name: t(`bots.${bot.key}.name`) })) : t(`colors.${orientation === 'w' ? 'b' : 'w'}`)} />
          <span>{t(`colors.${orientation === 'w' ? 'b' : 'w'}`)}</span>
        </div>
        <div className="board-scroll">
          <Board {...board} files={19} ranks={19} pieces={game.pieces()} orientation={orientation} selected={selected} targets={targets}
            lastMove={lastMove} onSquareClick={chooseSquare} className="ko-board" />
        </div>
        <div className="player-strip player-strip--bottom">
          <PieceSealOrName color={orientation} name={mode === 'bot' ? (humanColor === orientation ? t('game.you') : t(`bots.${bot.key}.name`)) : t(`colors.${orientation}`)} />
          <span>{t(`colors.${orientation}`)}</span>
        </div>
      </div>
      <aside className="game-ledger">
        <div className={`turn-card${ended ? ' is-ended' : ''}`} aria-live="polite">
          <span className="turn-card__index">{ended ? '—' : `${moves.length + 1}`.padStart(2, '0')}</span>
          <p>{thinking ? t('game.thinking', { name: t(`bots.${bot.key}.name`) }) : statusLine}</p>
        </div>
        <p className="board-instruction">{inputEnabled ? (selected === null ? t('game.selectPiece') : t('game.chooseDestination')) : mode === 'bot' && thinking ? t('game.thinking', { name: t(`bots.${bot.key}.name`) }) : t('game.waiting')}</p>
        <div className="ledger-actions">
          <Button variant="secondary" onClick={undo} disabled={!moves.length || thinking}><RotateCcw size={15} aria-hidden="true" />{t('game.undo')}</Button>
          <Button variant="ghost" onClick={() => setFlipped((current) => !current)}><ArrowLeft size={15} aria-hidden="true" />{t('game.orientation')}</Button>
        </div>
        {ended && <Button block size="lg" onClick={rematch}>{t('game.rematch')}<ArrowRight size={15} aria-hidden="true" /></Button>}
        <section className="move-ledger">
          <div className="move-ledger__heading"><h2>{t('game.moves')}</h2><span>{moves.length}</span></div>
          {moves.length === 0 ? <p className="muted-note">{t('game.noMoves')}</p> : <ol>
            {moves.slice(-12).map((move, index) => <li key={`${move.uci}-${index}`}><span>{String(Math.max(1, moves.length - 11) + index).padStart(2, '0')}</span><code>{move.color === 'w' ? 'W' : 'B'} · {move.uci}</code></li>)}
          </ol>}
        </section>
        <div className="command-note"><span className="command-note__seal">!</span><p>{t('home.profile')}</p></div>
        <Link className="text-link" to="/learn">{t('setup.tutorial')}<ArrowRight size={14} aria-hidden="true" /></Link>
      </aside>
    </div>
    {routeChoices.length > 0 && <ActionPicker actions={routeChoices} onChoose={playCandidate} onClose={() => setRouteChoices([])} />}
  </section>;
}

function PieceSealOrName({ color, name }: { color: Color; name: string }) {
  return <span className={`player-mark player-mark--${color}`} aria-hidden="true">{name.slice(0, 1)}</span>;
}
