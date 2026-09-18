import { OnlineLobby } from '@chaturanga/game-shell/ui';
import { useNavigate } from 'react-router';
import { identity } from '../features/online/identity';
import { useSettings } from '../stores/settings';

export function OnlinePage() {
  const navigate = useNavigate();
  const timeControl = useSettings((s) => s.onlineTimeControl);
  const color = useSettings((s) => s.onlineColor);
  const update = useSettings((s) => s.update);

  return (
    <OnlineLobby
      identity={identity}
      timeControl={timeControl}
      onTimeControlChange={(onlineTimeControl) => update({ onlineTimeControl })}
      color={color}
      onColorChange={(onlineColor) => update({ onlineColor })}
      onEnterRoom={(code) => navigate(`/play/online/${code}`)}
    />
  );
}
