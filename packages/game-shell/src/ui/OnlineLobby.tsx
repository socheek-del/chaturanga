import { RoomCode } from '@chaturanga/protocol';
import { Button, Card, SegmentedControl } from '@chaturanga/ui';
import { LoaderCircle } from 'lucide-react';
import { type FormEvent, type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createRoom, fetchRoom } from '../online/api';
import type { IdentitySource } from '../online/identity';
import { type TimeControlChoice, toTimeControl } from '../timeControls';
import { QuickMatch } from './QuickMatch';
import { TimeControlPicker } from './TimeControlPicker';
import { useIdentity } from './useIdentity';

export type OnlineColorChoice = 'w' | 'b' | 'random';

export interface OnlineLobbyProps {
  identity: IdentitySource;
  timeControl: TimeControlChoice;
  onTimeControlChange: (choice: TimeControlChoice) => void;
  color: OnlineColorChoice;
  onColorChange: (color: OnlineColorChoice) => void;
  /** Opens a room; the product owns its routes. */
  onEnterRoom: (code: string) => void;
  /** Start position of a created room, for a variant with `startFens`. */
  startFen?: string;
  /** The product's own choices for a created room, such as opening arrangements. */
  roomOptions?: ReactNode;
}

/** The online lobby: quick match, create a private room, join one by code. No chat anywhere. */
export function OnlineLobby({ identity: source, timeControl, onTimeControlChange, color, onColorChange, onEnterRoom, startFen, roomOptions }: OnlineLobbyProps) {
  const { t } = useTranslation();
  const { identity, failed } = useIdentity(source);
  const [code, setCode] = useState('');
  const [joinError, setJoinError] = useState<'invalid' | 'notFound' | null>(null);
  const [busy, setBusy] = useState<'create' | 'join' | null>(null);
  const [serverError, setServerError] = useState(false);

  const create = async () => {
    if (!identity) return;
    setBusy('create');
    setServerError(false);
    try {
      onEnterRoom(await createRoom(identity.token, { timeControl: toTimeControl(timeControl), color, rated: false, startFen }));
    } catch {
      setServerError(true);
    } finally {
      setBusy(null);
    }
  };

  const join = async (event: FormEvent) => {
    event.preventDefault();
    const normalized = code.trim().toUpperCase();
    if (!RoomCode.safeParse(normalized).success) return setJoinError('invalid');
    setBusy('join');
    setJoinError(null);
    try {
      const room = await fetchRoom(normalized);
      if (!room) setJoinError('notFound');
      else onEnterRoom(normalized);
    } catch {
      setServerError(true);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-5">
      <h1 className="text-3xl font-extrabold">{t('modes.online')}</h1>

      {(failed || serverError) && (
        <Card tone="danger" role="alert" className="font-bold text-danger">
          {t('online.serverError')}
        </Card>
      )}

      <QuickMatch identity={identity} onMatched={onEnterRoom} />

      <Card className="flex flex-col gap-4">
        <h2 className="text-lg font-extrabold">{t('online.createTitle')}</h2>
        <TimeControlPicker value={timeControl} onChange={onTimeControlChange} />
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-extrabold text-muted">{t('online.color')}</h3>
          <SegmentedControl<OnlineColorChoice>
            label={t('online.color')}
            value={color}
            onChange={onColorChange}
            options={[
              { value: 'w', label: t('computer.sideWhite') },
              { value: 'b', label: t('computer.sideBlack') },
              { value: 'random', label: t('computer.sideRandom') },
            ]}
          />
        </div>
        {roomOptions}
        <Button size="lg" block onClick={create} disabled={!identity || busy !== null}>
          {busy === 'create' && <LoaderCircle aria-hidden className="h-5 w-5 animate-spin" />}
          {t('online.create')}
        </Button>
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="text-lg font-extrabold">{t('online.joinTitle')}</h2>
        <form onSubmit={join} className="flex flex-col gap-3 sm:flex-row">
          <input
            aria-label={t('online.codeLabel')}
            placeholder="ABC234"
            value={code}
            maxLength={6}
            autoCapitalize="characters"
            autoComplete="off"
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setJoinError(null);
            }}
            className="h-12 flex-1 rounded-2xl border-2 border-line bg-surface px-4 text-center font-mono text-2xl font-extrabold uppercase tracking-[0.3em] text-ink"
          />
          <Button type="submit" size="lg" variant="secondary" disabled={!identity || busy !== null}>
            {t('online.join')}
          </Button>
        </form>
        {joinError && (
          <p role="alert" className="font-bold text-danger">
            {t(joinError === 'invalid' ? 'online.invalidCode' : 'online.notFound')}
          </p>
        )}
      </Card>
    </div>
  );
}
