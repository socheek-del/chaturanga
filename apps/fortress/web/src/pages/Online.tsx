import { createIdentity } from '@chaturanga/game-shell';
import { RoomCode } from '@chaturanga/protocol';
import { Game } from '@chaturanga/fortress';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { RoomMessage, seats, type RoomView } from '../../../online';
import { Board, parseUci, PromotionPicker, type ParsedMove } from './Board';

const identity = createIdentity('fortress:online:identity');
const auth = (token: string) => ({ authorization: `Bearer ${token}` });

export function requestedRoom(): string | null {
  const parsed = RoomCode.safeParse(new URL(location.href).searchParams.get('room')?.toUpperCase());
  return parsed.success ? parsed.data : null;
}

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
      if (!response.ok) throw new Error(`Could not create room: ${response.status}`);
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
  const exit = () => {
    show(null);
    onExit();
  };

  if (code) return <OnlineRoom key={code} code={code} onExit={exit} />;
  return (
    <main className="online-page">
      <button className="text-action back-link" type="button" onClick={onExit}>
        ← {t('mode.back')}
      </button>
      <p className="eyebrow">{t('online.title')}</p>
      <h1>{t('online.create')}</h1>
      <p className="page-intro">{t('online.intro')}</p>
      <button
        className="button button-primary"
        type="button"
        onClick={() => void create()}
        disabled={creating}
      >
        {t(creating ? 'online.creating' : 'online.create')}
      </button>
      <form className="join-form" onSubmit={join}>
        <label>
          {t('online.roomCode')}
          <input
            value={typed}
            onChange={(event) => setTyped(event.target.value.toUpperCase())}
            maxLength={6}
            autoCapitalize="characters"
            autoComplete="off"
          />
        </label>
        <button className="button button-outline" type="submit">
          {t('online.join')}
        </button>
      </form>
      {error && (
        <p className="inline-error" role="alert">
          {t(error)}
        </p>
      )}
    </main>
  );
}

function OnlineRoom({ code, onExit }: { code: string; onExit: () => void }) {
  const { t } = useTranslation();
  const socketRef = useRef<WebSocket | null>(null);
  const [view, setView] = useState<RoomView | null>(null);
  const [connection, setConnection] = useState<'connecting' | 'ready' | 'reconnecting' | 'full' | 'notFound'>(
    'connecting',
  );
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [selection, select] = useState<{ square: number; ply: number } | null>(null);
  const [reserve, setReserve] = useState<ParsedMove['placement'] | null>(null);
  const [promotion, setPromotion] = useState<{ moves: ParsedMove[]; ply: number } | null>(null);

  useEffect(() => {
    let closed = false;
    let retry: number | undefined;
    let attempt = 0;
    const reconnect = () => {
      if (closed) return;
      setConnection('reconnecting');
      retry = window.setTimeout(() => void connect(), Math.min(5000, 500 * 2 ** attempt++));
    };
    const connect = async () => {
      try {
        const { token } = await identity.ensureIdentity();
        if (closed) return;
        const response = await fetch(`/api/games/${code}`, { headers: auth(token) });
        if (closed) return;
        if (response.status === 404) return setConnection('notFound');
        if (response.status === 409) return setConnection('full');
        if (!response.ok) throw new Error('Room lookup failed');
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
            } else setError(`online.errors.${parsed.data.error}`);
          } catch {
            setError('online.unavailable');
          }
        };
        socket.onclose = () => {
          if (socketRef.current === socket) socketRef.current = null;
          reconnect();
        };
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

  const game = useMemo(() => (view ? new Game(view.fen) : null), [view]);
  const ply = view?.moves.length ?? 0;
  const selected = selection?.ply === ply ? selection.square : null;
  const selectedPromotion = promotion?.ply === ply ? promotion.moves : [];
  const waiting = !view || seats.some((seat) => view.presence[seat] === 'empty');
  const canPlay =
    connection === 'ready' && !waiting && !!game && !game.isGameOver() && game.turn === view?.you;
  const legal = canPlay
    ? game!
        .legalUci()
        .map(parseUci)
        .filter((move): move is ParsedMove => move !== null)
    : [];
  const destinations =
    selected === null
      ? reserve
        ? legal.filter((move) => move.placement === reserve)
        : []
      : legal.filter((move) => move.from === selected);

  useEffect(() => {
    select(null);
    setReserve(null);
    setPromotion(null);
  }, [ply]);

  const sendMove = (move: ParsedMove) => {
    select(null);
    setReserve(null);
    setPromotion(null);
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'move', uci: move.uci, ply }));
    }
  };
  const onSquareClick = (square: number) => {
    if (!canPlay || selectedPromotion.length) return;
    const options = destinations.filter((move) => move.to === square);
    if (options.length > 1) setPromotion({ moves: options, ply });
    else if (options[0]) sendMove(options[0]);
    else if (!reserve && legal.some((move) => move.from === square)) select({ square, ply });
    else select(null);
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      setCopied(true);
    } catch {
      setError('online.copyFailed');
    }
  };
  let turn = t('online.waiting');
  if (view && game && !seats.some((seat) => view.presence[seat] === 'empty')) {
    if (game.isGameOver()) {
      const status = game.status();
      turn =
        status.kind === 'checkmate'
          ? t('game.resultTeam', {
              team: t(`players.team${status.winner === 'r' || status.winner === 'w' ? 0 : 1}`),
            })
          : t('game.draw');
    } else
      turn = t(game.turn === view.you ? 'game.yourTurn' : 'game.turn', { player: t(`players.${game.turn}`) });
  }

  return (
    <main className="online-room-page">
      <header className="online-room-heading">
        <div>
          <p className="eyebrow">{t('online.room', { code })}</p>
          <h1>{t('online.seats')}</h1>
        </div>
        <button className="text-action" type="button" onClick={onExit}>
          {t('online.back')}
        </button>
      </header>
      {connection !== 'ready' && (
        <p className="connection-state" role="status">
          {t(`online.${connection}`)}
        </p>
      )}
      {error && (
        <p className="inline-error" role="alert">
          {t(error)}
        </p>
      )}
      {view && game && (
        <>
          <div className="invite-row">
            <label>
              {t('online.invite')}
              <input value={location.href} readOnly onFocus={(event) => event.currentTarget.select()} />
            </label>
            <button className="button button-outline" type="button" onClick={() => void copy()}>
              {t(copied ? 'online.copied' : 'online.copy')}
            </button>
          </div>
          <div className="room-seats" aria-label={t('online.seats')}>
            {seats.map((seat) => (
              <div
                key={seat}
                className={`seat-card seat-${seat} ${game.turn === seat && !game.isGameOver() ? 'is-active' : ''}`}
              >
                <span className={`seat-mark seat-${seat}`}>
                  <span>{seat.toUpperCase()}</span>
                </span>
                <div>
                  <strong>
                    {t(`players.${seat}`)}
                    {seat === view.you ? ` · ${t('online.you')}` : ''}
                  </strong>
                  <small>{t(`online.presence.${view.presence[seat]}`)}</small>
                </div>
              </div>
            ))}
          </div>
          <p className="turn-banner" aria-live="polite">
            {turn}
          </p>
          {game.isSetupPhase() && canPlay && (
            <div className="reserve-tray online-reserve" aria-label={t('game.reservePieces')}>
              {(['b', 'n', 'r'] as const)
                .filter((type) => game.hand(game.turn).includes(type))
                .map((type) => (
                  <button
                    type="button"
                    key={type}
                    className={`reserve-token seat-${game.turn} ${reserve === type ? 'is-selected' : ''}`}
                    onClick={() => {
                      setReserve(type);
                      select(null);
                    }}
                  >
                    <span>{type.toUpperCase()}</span>
                    {t(`pieces.${type}`)}
                  </button>
                ))}
            </div>
          )}
          <Board
            game={game}
            selected={selected}
            destinations={destinations}
            lastMove={view.moves.length ? parseUci(view.moves.at(-1)!) : null}
            onSquareClick={canPlay ? onSquareClick : undefined}
          >
            {selectedPromotion.length > 0 && (
              <PromotionPicker
                player={game.turn}
                moves={selectedPromotion}
                onMove={sendMove}
                onCancel={() => setPromotion(null)}
              />
            )}
          </Board>
          <p className="board-hint">
            {canPlay
              ? game.isSetupPhase()
                ? t('game.selectReserve')
                : t('game.selectPiece')
              : t('online.waiting')}
          </p>
          {view.moves.length > 0 && (
            <ol className="online-move-list" aria-label={t('game.logLabel')}>
              {view.moves.slice(-12).map((move, index) => (
                <li key={`${ply}-${index}`}>{move}</li>
              ))}
            </ol>
          )}
        </>
      )}
    </main>
  );
}
