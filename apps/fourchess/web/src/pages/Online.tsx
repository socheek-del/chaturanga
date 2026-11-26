import { createIdentity } from '@chaturanga/game-shell';
import { RoomCode } from '@chaturanga/protocol';
import { Game, PLAYERS, type Player } from '@chaturanga/fourchess';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { RoomMessage, seats, type RoomView } from '../../../online';
import { GameBoard } from './GameBoard';
import { parseUci, type ParsedMove } from '@chaturanga/board-ui';

const identity = createIdentity('fourchess:online:identity');
const auth = (token: string) => ({ authorization: `Bearer ${token}` });

export const requestedRoom = (): string | null => {
  const parsed = RoomCode.safeParse(new URL(location.href).searchParams.get('room')?.toUpperCase());
  return parsed.success ? parsed.data : null;
};

function setRoomUrl(code: string | null): void {
  const url = new URL(location.href);
  if (code) url.searchParams.set('room', code);
  else url.searchParams.delete('room');
  history.replaceState(null, '', url);
}

export function Online({ onExit }: { onExit: () => void }) {
  const { t } = useTranslation();
  const [code, setCode] = useState(requestedRoom);
  const [typed, setTyped] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const show = (next: string | null) => {
    setRoomUrl(next);
    setError(null);
    setCode(next);
  };
  const create = async () => {
    setCreating(true);
    setError(null);
    try {
      const { token } = await identity.ensureIdentity();
      const response = await fetch('/api/games', { method: 'POST', headers: auth(token) });
      if (!response.ok) throw new Error('Could not create room');
      show(RoomCode.parse((await response.json()).code));
    } catch {
      setError('online.unavailable');
    } finally {
      setCreating(false);
    }
  };
  const join = (event: FormEvent) => {
    event.preventDefault();
    const parsed = RoomCode.safeParse(typed.trim().toUpperCase());
    if (!parsed.success) setError('online.invalid');
    else show(parsed.data);
  };

  if (code) return <OnlineRoom key={code} code={code} onExit={() => show(null)} />;
  return <main className="setup-page online-lobby">
    <button type="button" className="text-button" onClick={onExit}>{t('navigation.back')}</button>
    <p className="eyebrow">{t('online.eyebrow')}</p>
    <h1>{t('online.title')}</h1>
    <p className="setup-description">{t('online.body')}</p>
    <button type="button" className="button button-primary" onClick={() => void create()} disabled={creating}>
      {t(creating ? 'online.creating' : 'online.create')}
    </button>
    <form className="online-join" onSubmit={join}>
      <label htmlFor="room-code">{t('online.code')}</label>
      <div><input id="room-code" value={typed} onChange={(event) => setTyped(event.target.value.toUpperCase())} maxLength={6} autoCapitalize="characters" />
        <button className="button button-quiet" type="submit">{t('online.join')}</button></div>
    </form>
    {error && <p role="alert" className="online-error">{t(error)}</p>}
  </main>;
}

type Connection = 'connecting' | 'reconnecting' | 'ready' | 'full' | 'notFound';

function OnlineRoom({ code, onExit }: { code: string; onExit: () => void }) {
  const { t } = useTranslation();
  const socketRef = useRef<WebSocket | null>(null);
  const [view, setView] = useState<RoomView | null>(null);
  const [connection, setConnection] = useState<Connection>('connecting');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    let closed = false;
    let retry: number | undefined;
    let attempt = 0;
    const reconnect = () => {
      if (closed) return;
      setConnection('reconnecting');
      retry = window.setTimeout(() => void connect(), Math.min(5000, 500 * (2 ** attempt++)));
    };
    const connect = async () => {
      try {
        const { token } = await identity.ensureIdentity();
        if (closed) return;
        const response = await fetch(`/api/games/${code}`, { headers: auth(token) });
        if (closed) return;
        if (response.status === 404) return setConnection('notFound');
        if (response.status === 409) return setConnection('full');
        if (!response.ok) throw new Error('Could not look up room');
        const url = new URL(`/ws/game/${code}`, location.href);
        url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
        url.searchParams.set('token', token);
        const socket = new WebSocket(url);
        socketRef.current = socket;
        socket.onmessage = (event) => {
          if (closed) return;
          try {
            const parsed = RoomMessage.safeParse(JSON.parse(String(event.data)));
            if (!parsed.success) return;
            if (parsed.data.type === 'state') {
              attempt = 0;
              setConnection('ready');
              setView(parsed.data);
              setError(null);
              setSelected(null);
            } else setError(`online.errors.${parsed.data.error}`);
          } catch {
            setError('online.unavailable');
          }
        };
        socket.onclose = () => {
          if (socketRef.current === socket) socketRef.current = null;
          reconnect();
        };
        socket.onerror = () => socket.close();
      } catch {
        reconnect();
      }
    };
    void connect();
    return () => {
      closed = true;
      window.clearTimeout(retry);
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [code]);

  const game = useMemo(() => view ? new Game(view.fen) : null, [view]);
  const ply = view?.moves.length ?? 0;
  const waiting = !view || seats.some((seat) => view.presence[seat] === 'empty');
  const canPlay = connection === 'ready' && !waiting && !!game && !game.isGameOver() && game.turn === view?.you;
  const canResign = connection === 'ready' && !waiting && !!game && !game.isGameOver() && !!view && game.isActive(view.you);
  const legalMoves = canPlay ? game.legalUci().map((uci) => parseUci(uci, 14)).filter((move): move is ParsedMove => move !== null) : [];
  const status = game?.status();
  const turnLabel = status?.kind === 'points'
    ? t('game.onlineFinished', { players: status.winners.map((winner) => t(`players.${winner}`)).join(' · ') || t('game.drawLine') })
    : waiting ? t('online.waiting')
      : game?.inCheck() ? t('game.check', { player: t(`players.${game.turn}`) })
        : t('game.turn', { player: t(`players.${game?.turn}`) });

  const send = (intent: { type: 'move'; uci: string; ply: number } | { type: 'resign'; ply: number }) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) socketRef.current.send(JSON.stringify(intent));
  };
  const onMove = (uci: string) => {
    if (!canPlay) return;
    send({ type: 'move', uci, ply });
    setSelected(null);
  };
  const onSquareClick = (square: number) => {
    if (!canPlay || !game) return;
    const chosen = selected === null ? [] : legalMoves.filter((move) => move.kind === 'move' && move.from === selected && move.to === square);
    if (chosen[0]?.kind === 'move') {
      onMove(chosen[0].uci);
      return;
    }
    const piece = game.pieceAt(square);
    setSelected(piece?.color === game.turn && game.isActive(game.turn) ? square : null);
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      setCopied(true);
    } catch {
      setError('online.copyFailed');
    }
  };

  return <main className="game-page online-page">
    <div className="game-heading"><div><p className="eyebrow">{t('online.eyebrow')}</p><h1>{t('online.room', { code })}</h1></div>
      <button className="text-button" type="button" onClick={onExit}>{t('online.back')}</button></div>
    {connection !== 'ready' && connection !== 'full' && connection !== 'notFound' && <p role="status" className="connection-notice">{t(`online.${connection}`)}</p>}
    {error && <p role="alert" className="online-error">{t(error)}</p>}
    <div className="online-invite">
      <div><strong>{t('online.inviteTitle')}</strong><small>{t('online.inviteBody')}</small></div>
      <button type="button" className="button button-quiet" onClick={() => void copy()}>{t(copied ? 'online.copied' : 'online.copy')}</button>
    </div>
    <div className="player-orbit online-seats" aria-label={t('online.seats')}>
      {PLAYERS.map((player) => <OnlinePlayer key={player} player={player} view={view} />)}
    </div>
    {view && game && <>
      <p className="turn-banner online-turn" aria-live="polite">{turnLabel}</p>
      <div className="play-layout">
        <section className="board-column" aria-label={t('game.boardLabel')}>
          <GameBoard game={game} selected={selected} legalMoves={legalMoves} canPlay={canPlay} onSquareClick={onSquareClick} onMove={onMove} />
          <p className="board-hint">{canPlay ? t('game.moveHint') : waiting ? t('online.waiting') : t('online.waitingTurn', { player: t(`players.${game.turn}`) })}</p>
        </section>
        <aside className="game-rail">
          <section className="rail-card score-panel"><div className="rail-heading"><div><p className="eyebrow">{t('game.table')}</p><h2>{t('game.scores')}</h2></div></div>
            {PLAYERS.map((player) => <div key={player} className={`score-row seat-${player}`}><span className="seat-dot" /><span>{t(`players.${player}`)}</span><strong>{game.score(player)}</strong></div>)}
          </section>
          <section className="rail-card move-panel"><div className="rail-heading"><div><p className="eyebrow">{t('game.historyEyebrow')}</p><h2>{t('game.history')}</h2></div><span className="round-chip">{view.moves.length}</span></div>
            {view.moves.length ? <ol className="move-history">{view.moves.slice(-18).map((move, index) => <li key={`${ply}-${index}`}><code>{move}</code></li>)}</ol> : <p className="empty-history">{t('game.noMoves')}</p>}
          </section>
          {status?.kind === 'points' && <section className="result-card"><span className="result-rosette" aria-hidden="true">✦</span><p className="eyebrow">{t('game.endTitle')}</p>
            <strong>{status.winners.length ? t('game.winnerLine', { players: status.winners.map((winner) => t(`players.${winner}`)).join(' · ') }) : t('game.drawLine')}</strong>
            <p>{t(`game.reason.${status.reason}`)}</p></section>}
          <button className="button button-quiet" type="button" disabled={!canResign} onClick={() => send({ type: 'resign', ply })}>{t('game.resign')}</button>
        </aside>
      </div>
    </>}
    {connection === 'full' && <p role="alert">{t('online.full')}</p>}
    {connection === 'notFound' && <p role="alert">{t('online.notFound')}</p>}
  </main>;
}

function OnlinePlayer({ player, view }: { player: Player; view: RoomView | null }) {
  const { t } = useTranslation();
  const presence = view?.presence[player] ?? 'empty';
  return <article className={`player-card seat-${player}`} data-online-seat={player}>
    <span className="seat-dot" />
    <div className="player-name"><strong>{t(`players.${player}`)}{view?.you === player ? ` · ${t('players.you')}` : ''}</strong>
      <small>{t(`online.${presence}`)}</small></div>
    <span className="player-state">{view?.you === player ? t('players.you') : t(`online.${presence}`)}</span>
  </article>;
}
