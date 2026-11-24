import { createGameSession, createIdentity, storageKey, type TimeControlChoice } from '@chaturanga/game-shell';
import { GameScreen, OnlineLobby, OnlineRoom, undoAllowed, type GameScreenProps } from '@chaturanga/game-shell/ui';
import type { Color } from '@chaturanga/rules-core';
import { acedrex, type Game } from '@chaturanga/acedrex';
import { Button } from '@chaturanga/ui';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate, useParams } from 'react-router';
import { PRODUCT } from '../product.config';
import { useBoardIdentity } from './board';

const local = createGameSession(acedrex, storageKey(PRODUCT, 'local'));
const computer = {
  w: createGameSession(acedrex, storageKey(PRODUCT, 'computer.w')),
  b: createGameSession(acedrex, storageKey(PRODUCT, 'computer.b')),
};
const identity = createIdentity(storageKey(PRODUCT, 'identity'));
const values = { p: 1, r: 5, l: 3, u: 7, g: 2.5, c: 3.5, a: 8, k: 0 };
type Identity = 'variant' | 'theme' | 'showCoordinates' | 'renderPiece' | 'boardLabel' | 'describeSquare' | 'pieceValues' | 'boardUnderlay';

export function AcedrexGame(props: Omit<GameScreenProps<Game>, Identity>) {
  const board = useBoardIdentity();
  return <GameScreen {...props} {...board} pieceValues={values} variant={acedrex} />;
}

export function ComputerRoute() {
  const { side } = useParams();
  if (side !== 'w' && side !== 'b') return <Navigate to="/computer" replace />;
  return <LocalPlay key={side} human={side} />;
}

export function LocalPlay({ human }: { human?: Color } = {}) {
  const { t } = useTranslation();
  const useSession = human ? computer[human] : local;
  const phase = useSession((s) => s.phase);
  const game = useSession((s) => s.game);
  const version = useSession((s) => s.version);
  const result = useSession((s) => s.result);
  const flipped = useSession((s) => s.flipped);
  const viewPly = useSession((s) => s.viewPly);
  const title = t(human ? 'modes.single' : 'modes.local');
  const thinking = !!human && phase === 'playing' && !result && viewPly === null && game.turn !== human;

  useEffect(() => {
    if (!thinking) return;
    const state = useSession.getState();
    const moves = state.game.moves().map((record) => record.uci);
    const fallback = state.game.legalUci()[0];
    const worker = new Worker(new URL('./bot.worker.ts', import.meta.url), { type: 'module' });
    const play = (move: string | null) => {
      const current = useSession.getState();
      if (current.version !== version || current.viewPly !== null) return;
      if (move && current.move(move)) return;
      if (fallback) current.move(fallback);
    };
    worker.onmessage = (event: MessageEvent<string | null>) => play(event.data);
    worker.onerror = () => play(null);
    worker.postMessage({ startFen: state.startFen, moves });
    const timeout = window.setTimeout(() => play(null), 1500);
    return () => { window.clearTimeout(timeout); worker.terminate(); };
  }, [thinking, useSession, version]);

  const start = () => useSession.getState().start(null);
  if (phase === 'setup') {
    return <section className="prepare"><h1>{title}</h1><Button size="lg" onClick={start}>{t('play.start')}</Button></section>;
  }

  const bottom = human ?? 'w';
  const other = bottom === 'w' ? 'b' : 'w';
  const undo = () => {
    const session = useSession.getState();
    session.undo();
    if (human && session.game.turn !== human) session.undo();
  };

  return <AcedrexGame
    useSession={useSession}
    title={title}
    orientation={flipped ? other : bottom}
    names={human
      ? { w: t(human === 'w' ? 'computer.you' : 'home.bot'), b: t(human === 'b' ? 'computer.you' : 'home.bot') }
      : { w: t('colors.w'), b: t('colors.b') }}
    inputEnabled={!human || game.turn === human}
    canUndo={undoAllowed({ game, result }) && (!human || game.moves().some((record) => record.color === human))}
    onUndo={undo}
    onRematch={start}
    resignColor={human ?? game.turn}
    status={thinking ? t('home.thinking') : undefined}
  />;
}

export function Lobby() {
  const navigate = useNavigate();
  const [timeControl, setTimeControl] = useState<TimeControlChoice>({ kind: 'none' });
  const [color, setColor] = useState<'w' | 'b' | 'random'>('random');
  return <OnlineLobby
    identity={identity} timeControl={timeControl} onTimeControlChange={setTimeControl}
    color={color} onColorChange={setColor} onEnterRoom={(code) => navigate(`/online/${code}`)}
  />;
}

export function Room() {
  const navigate = useNavigate();
  const { code = '' } = useParams();
  const enter = useCallback((room: string) => navigate(`/online/${room}`), [navigate]);
  const leave = useCallback(() => navigate('/online'), [navigate]);
  return <OnlineRoom
    key={code} code={code.toUpperCase()} variant={acedrex} identity={identity}
    roomUrl={(room) => `${location.origin}/online/${room}`} onEnterRoom={enter} onLeave={leave}
    renderGame={(props) => <AcedrexGame {...props} />}
  />;
}
