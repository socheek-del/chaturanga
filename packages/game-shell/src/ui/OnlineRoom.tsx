import type { GameSnapshot } from '@chaturanga/protocol';
import { activePlayers, type Color, type Variant, type VariantGame } from '@chaturanga/rules-core';
import { Button, Card } from '@chaturanga/ui';
import { Handshake, LoaderCircle, WifiOff } from 'lucide-react';
import QRCode from 'qrcode';
import { type ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { openGameConnection } from '../online/connection';
import type { IdentitySource } from '../online/identity';
import { createOnlineSession, type OnlineSessionStore } from '../online/session';
import type { GameScreenProps } from './GameScreen';
import { useIdentity } from './useIdentity';
import { useNow } from './useNow';

/** The game-screen props an online room decides; the product adds its identity (art, words, sounds). */
export type OnlineScreenProps<G extends VariantGame> = Pick<
  GameScreenProps<G>,
  'useSession' | 'title' | 'orientation' | 'names' | 'inputEnabled' | 'canUndo' | 'onUndo' | 'resignColor' | 'status' | 'actions' | 'onRematch'
>;

export interface OnlineRoomContext<G extends VariantGame> {
  session: OnlineSessionStore<G>;
  snapshot: GameSnapshot;
  you: Color | null;
}

export interface OnlineRoomProps<G extends VariantGame> {
  /** Upper-case room code. Mount one room per code (`key={code}`) so a rematch starts fresh. */
  code: string;
  variant: Variant<G>;
  identity: IdentitySource;
  /** Full address of a room, shown and encoded in the QR code while waiting. */
  roomUrl: (code: string) => string;
  /** Opens another room (a rematch). */
  onEnterRoom: (code: string) => void;
  /** Leaves to the lobby. */
  onLeave: () => void;
  /** Renders the product's game screen. `context` lets a product add its own actions. */
  renderGame: (screen: OnlineScreenProps<G>, context: OnlineRoomContext<G>) => ReactNode;
}

const other = (c: Color): Color => (c === 'w' ? 'b' : 'w');

/** An online room: connects, shows the waiting room until both seats are taken, then the game. */
export function OnlineRoom<G extends VariantGame>({ code, variant, identity: source, roomUrl, onEnterRoom, onLeave, renderGame }: OnlineRoomProps<G>) {
  const { t } = useTranslation();
  const { identity, failed } = useIdentity(source);
  const [session] = useState(() => createOnlineSession(variant));
  const snapshot = session((s) => s.snapshot);

  useEffect(() => {
    if (!identity) return;
    const connection = openGameConnection(code, identity.token, {
      onMessage: (message) => session.getState().receive(message),
      onStatus: (status) => session.getState().setConnection(status),
    });
    session.getState().bindSender(connection.send);
    session.setState({ exitToSetup: onLeave });
    return () => connection.close();
  }, [identity, code, session, onLeave]);

  useEffect(() => {
    if (snapshot?.nextCode) onEnterRoom(snapshot.nextCode);
  }, [snapshot?.nextCode, onEnterRoom]);

  if (failed) {
    return (
      <Card tone="danger" role="alert" className="mx-auto max-w-md font-bold text-danger">
        {t('online.serverError')}
      </Card>
    );
  }
  if (!snapshot) {
    return (
      <p className="flex items-center justify-center gap-2 py-16 text-lg font-bold text-muted">
        <LoaderCircle aria-hidden className="h-6 w-6 animate-spin" />
        {t('online.connecting')}
      </p>
    );
  }
  if (snapshot.status === 'waiting') return <WaitingRoom code={code} link={roomUrl(code)} />;
  return <OnlineGame session={session} snapshot={snapshot} renderGame={renderGame} />;
}

function WaitingRoom({ code, link }: { code: string; link: string }) {
  const { t } = useTranslation();
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(link, { margin: 1, width: 240 }).then((url) => active && setQr(url));
    return () => {
      active = false;
    };
  }, [link]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-5 text-center">
      <h1 className="text-3xl font-extrabold">{t('online.waitingTitle')}</h1>
      <p className="text-muted">{t('online.shareHint')}</p>
      <div
        data-testid="room-code"
        className="rounded-[1.25rem] border border-line bg-surface px-6 py-3 font-mono text-4xl font-bold tracking-[0.3em] shadow-card"
      >
        {code}
      </div>
      <Button variant="secondary" onClick={copy}>
        {copied ? t('online.copied') : t('online.copyLink')}
      </Button>
      <p className="break-all text-sm text-muted" data-testid="room-link">
        {link}
      </p>
      {qr && <img src={qr} alt={t('online.qrAlt')} data-testid="room-qr" className="h-48 w-48 rounded-xl border-2 border-line bg-white p-2" />}
      <p className="flex items-center gap-2 font-bold text-muted">
        <LoaderCircle aria-hidden className="h-5 w-5 animate-spin" />
        {t('online.waitingFor')}
      </p>
    </div>
  );
}

function OnlineGame<G extends VariantGame>({
  session,
  snapshot,
  renderGame,
}: {
  session: OnlineSessionStore<G>;
  snapshot: GameSnapshot;
  renderGame: OnlineRoomProps<G>['renderGame'];
}) {
  const { t } = useTranslation();
  const game = session((s) => s.game);
  const you = session((s) => s.you);
  const flipped = session((s) => s.flipped);
  const connection = session((s) => s.connection);
  const result = session((s) => s.result);
  const receivedAt = session((s) => s.receivedAt);
  session((s) => s.version);
  const now = useNow(snapshot.disconnect ? 500 : null);
  const graceSeconds = snapshot.disconnect
    ? Math.max(0, Math.ceil((snapshot.disconnect.at - snapshot.serverTime - (now - receivedAt)) / 1000))
    : 0;

  const base: Color = you ?? 'w';
  const orientation: Color = flipped ? other(base) : base;
  const opponent = you ? other(you) : null;
  // No accounts: players are "You" and "Opponent"; spectators see the colours.
  const nameOf = (color: Color) => {
    if (!you) return t(`colors.${color}`);
    return color === you ? t('computer.you') : t('online.opponent');
  };
  const send = session.getState().send;

  const status = (
    <>
      {!you && (
        <Card tone="secondary" className="py-2 text-center text-sm font-bold">
          {t('online.spectating')}
        </Card>
      )}
      {connection !== 'open' && (
        <Card tone="warning" data-testid="connection-status" className="flex items-center gap-2 py-2 text-sm font-bold">
          <WifiOff aria-hidden className="h-4 w-4" />
          {t('online.reconnecting')}
        </Card>
      )}
      {snapshot.disconnect && snapshot.disconnect.color !== you && !result && (
        <Card tone="warning" data-testid="opponent-disconnected" className="py-2 text-sm font-bold">
          {t('online.opponentDisconnected', { seconds: graceSeconds })}
        </Card>
      )}
      {snapshot.drawOfferBy && snapshot.drawOfferBy === opponent && !result && (
        <Card tone="secondary" data-testid="draw-offer" className="flex flex-col gap-2">
          <p className="font-extrabold">{t('online.drawOfferReceived')}</p>
          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" onClick={() => send({ type: 'acceptDraw' })}>
              {t('online.accept')}
            </Button>
            <Button size="sm" variant="outline" onClick={() => send({ type: 'declineDraw' })}>
              {t('online.decline')}
            </Button>
          </div>
        </Card>
      )}
      {snapshot.drawOfferBy && snapshot.drawOfferBy === you && !result && (
        <p data-testid="draw-offered" className="text-center text-sm font-bold text-muted">
          {t('online.drawOffered')}
        </p>
      )}
      {result && snapshot.rematchOfferBy === opponent && (
        <Card tone="primary" data-testid="rematch-offer" className="text-sm font-bold">
          {t('online.rematchReceived')}
        </Card>
      )}
      {result && snapshot.rematchOfferBy === you && (
        <p data-testid="rematch-offered" className="text-center text-sm font-bold text-muted">
          {t('online.rematchOffered')}
        </p>
      )}
    </>
  );

  return renderGame(
    {
      useSession: session,
      title: t('modes.online'),
      orientation,
      names: { w: nameOf('w'), b: nameOf('b') },
      inputEnabled: !!you && activePlayers(game).includes(you) && connection === 'open',
      canUndo: false,
      onUndo: () => {},
      resignColor: you ?? 'w',
      status,
      actions:
        you && !result ? (
          <Button variant="outline" onClick={() => send({ type: 'offerDraw' })} disabled={snapshot.drawOfferBy !== null}>
            <Handshake aria-hidden className="h-5 w-5" />
            {t('online.offerDraw')}
          </Button>
        ) : null,
      onRematch: () => send({ type: 'rematch' }),
    },
    { session, snapshot, you },
  );
}
