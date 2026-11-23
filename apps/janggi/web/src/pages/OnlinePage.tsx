import { OnlineLobby } from '@chaturanga/game-shell/ui';
import { setupFen } from '@chaturanga/janggi';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { SetupPicker } from '../features/game/SetupPicker';
import { identity } from '../features/online/identity';
import { useSettings } from '../stores/settings';

export function OnlinePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const timeControl = useSettings((s) => s.onlineTimeControl);
  const color = useSettings((s) => s.onlineColor);
  const setupW = useSettings((s) => s.setupW);
  const setupB = useSettings((s) => s.setupB);
  const update = useSettings((s) => s.update);

  return (
    <OnlineLobby
      identity={identity}
      timeControl={timeControl}
      onTimeControlChange={(onlineTimeControl) => update({ onlineTimeControl })}
      color={color}
      onColorChange={(onlineColor) => update({ onlineColor })}
      startFen={setupFen(setupW, setupB)}
      roomOptions={
        <>
          <SetupPicker label={t('setup.of', { color: t('colors.w') })} color="w" value={setupW} onChange={(id) => update({ setupW: id })} />
          <SetupPicker label={t('setup.of', { color: t('colors.b') })} color="b" value={setupB} onChange={(id) => update({ setupB: id })} />
        </>
      }
      onEnterRoom={(code) => navigate(`/play/online/${code}`)}
    />
  );
}
