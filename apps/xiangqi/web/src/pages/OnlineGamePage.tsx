import { OnlineRoom } from '@chaturanga/game-shell/ui';
import { xiangqi } from '@chaturanga/xiangqi';
import { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router';
import { GameScreen } from '../features/game/GameScreen';
import { identity } from '../features/online/identity';

const roomPath = (code: string) => `/play/online/${code}`;

/** One room per code, so a rematch starts with a fresh connection and session. No chat of any kind. */
export function OnlineGameRoute() {
  const { code = '' } = useParams();
  const navigate = useNavigate();
  const onLeave = useCallback(() => navigate('/play/online'), [navigate]);
  const onEnterRoom = useCallback((next: string) => navigate(roomPath(next)), [navigate]);
  const upper = code.toUpperCase();

  return (
    <OnlineRoom
      key={upper}
      code={upper}
      variant={xiangqi}
      identity={identity}
      roomUrl={(room) => `${location.origin}${roomPath(room)}`}
      onEnterRoom={onEnterRoom}
      onLeave={onLeave}
      renderGame={(screen) => <GameScreen {...screen} />}
    />
  );
}
