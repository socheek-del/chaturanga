import { createIdentity } from '@chaturanga/game-shell';
import { RoomCode } from '@chaturanga/protocol';
import { Game } from '@chaturanga/threechess';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { RoomMessage, seats, type RoomView } from '../../../online';
import { HexBoard, PromotionPicker, parseUci, type ParsedMove } from './HexBoard';

const identity = createIdentity('threechess:online:identity');
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

export function Online() {
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
  return <main className="tutorial-layout">
    <h1>{t('online.title')}</h1>
    <p className="tutorial-prompt">{t('online.intro')}</p>
    <button type="button" className="primary-button compact" onClick={() => void create()} disabled={creating}>
      {t(creating ? 'online.creating' : 'online.create')}
    </button>
    <form className="online-form" onSubmit={join}>
      <label>{t('online.roomCode')}<input value={typed} onChange={(event) => setTyped(event.target.value)} maxLength={6} autoCapitalize="characters" /></label>
      <button className="quiet-button" type="submit">{t('online.join')}</button>
    </form>
    {error && <p role="alert">{t(error)}</p>}
  </main>;
}

function OnlineRoom({ code, onExit }: { code: string; onExit: () => void }) {
  const { t } = useTranslation();
  const socketRef = useRef<WebSocket | null>(null);
  const [view, setView] = useState<RoomView | null>(null);
  const [connection, setConnection] = useState<'connecting' | 'ready' | 'reconnecting' | 'full' | 'notFound'>('connecting');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [selection, select] = useState<{ square: number; ply: number } | null>(null);
  const [promotion, setPromotion] = useState<{ moves: ParsedMove[]; ply: number } | null>(null);

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

  const game = useMemo(() => view ? new Game(view.fen) : null, [view]);
  const ply = view?.moves.length ?? 0;
  const selected = selection?.ply === ply ? selection.square : null;
  const promotions = promotion?.ply === ply ? promotion.moves : [];
  const waiting = !view || seats.some((seat) => view.presence[seat] === 'empty');
  const canPlay = connection === 'ready' && !waiting && !!game && !game.isGameOver() && game.turn === view?.you;
  const legal = canPlay ? game.legalUci().map((uci) => parseUci(uci)!) : [];
  const destinations = legal.filter((move) => move.from === selected);
  const lastMove = view?.moves.at(-1);

  const sendMove = (move: ParsedMove) => {
    select(null);
    setPromotion(null);
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'move', uci: move.uci, ply }));
    }
  };
  const onSquareClick = (square: number) => {
    if (promotions.length) return;
    const options = destinations.filter((move) => move.to === square);
    if (options.length > 1) setPromotion({ moves: options, ply });
    else if (options[0]) sendMove(options[0]);
    else select(legal.some((move) => move.from === square) ? { square, ply } : null);
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      setCopied(true);
    } catch {
      setError('online.copyFailed');
    }
  };
  const status = game?.status();
  const turn = status?.kind === 'checkmate' ? t('game.winner', { player: t(`players.${status.winner}`) })
    : status?.kind === 'stalemate' ? t('game.draw')
      : waiting ? t('online.waiting')
        : t('game.turn', { player: t(`players.${game?.turn}`) });

  return <main className="tutorial-layout online-room">
    <header className="tutorial-header"><h1>{t('online.room', { code })}</h1>
      <button type="button" className="tutorial-link" onClick={onExit}>{t('online.back')}</button>
    </header>
    {connection !== 'ready' && <p role="status">{t(`online.${connection}`)}</p>}
    {error && <p role="alert">{t(error)}</p>}
    {view && game && <>
      <div className="online-form">
        <label>{t('online.invite')}<input value={location.href} readOnly onFocus={(event) => event.currentTarget.select()} /></label>
        <button type="button" className="quiet-button" onClick={() => void copy()}>{t(copied ? 'online.copied' : 'online.copy')}</button>
      </div>
      <div className="online-seats" aria-label={t('online.seats')}>
        {seats.map((seat) => <div className="player-card" key={seat} data-online-seat={seat}>
          <strong>{t(`players.${seat}`)}{seat === view.you && ` · ${t('online.you')}`}</strong>
          <small>{t(`online.presence.${view.presence[seat]}`)}</small>
        </div>)}
      </div>
      <p className="turn-pill" aria-live="polite">{turn}</p>
      <HexBoard game={game} selected={selected} destinations={destinations}
        lastMove={lastMove ? parseUci(lastMove) : null} onSquareClick={canPlay ? onSquareClick : undefined}>
        {promotions.length > 0 && <PromotionPicker player={game.turn} moves={promotions}
          onMove={sendMove} onCancel={() => setPromotion(null)} />}
      </HexBoard>
      {ply > 0 && <ol className="online-moves" aria-label={t('game.moves')}>
        {view.moves.slice(-12).map((move, index) => <li key={`${ply}-${index}`}>{move}</li>)}
      </ol>}
    </>}
  </main>;
}
