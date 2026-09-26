import type { OnlineSessionStore } from '@chaturanga/game-shell';
import { onlineGameId, OnlineRoom, type OnlineScreenProps, useRecordOnlineGame } from '@chaturanga/game-shell/ui';
import { chess, type Game } from '@chaturanga/chess';
import { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router';
import { GameScreen } from '../features/game/GameScreen';
import { identity } from '../features/online/identity';
import { useGameHistory } from '../stores/history';

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
      variant={chess}
      identity={identity}
      roomUrl={(room) => `${location.origin}${roomPath(room)}`}
      onEnterRoom={onEnterRoom}
      onLeave={onLeave}
      renderGame={(screen, { session }) => <RecordedGame screen={screen} session={session} code={upper} />}
    />
  );
}

/** The online game screen, saving the game to this device's history as it is played (ch-014). */
function RecordedGame({
  screen,
  session,
  code,
}: {
  screen: OnlineScreenProps<Game>;
  session: OnlineSessionStore<Game>;
  code: string;
}) {
  useRecordOnlineGame(useGameHistory, session, code);
  const you = session((s) => s.you);
  return <GameScreen {...screen} reviewId={you ? onlineGameId(code) : null} />;
}
