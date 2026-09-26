import { type Color, FenError } from '@chaturanga/makruk';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { Button, Card, SegmentedControl } from '@chaturanga/ui';
import { TimeControlPicker } from '@chaturanga/game-shell/ui';
import { GameScreen, undoAllowed } from '../features/game/GameScreen';
import { toTimeControl } from '../features/game/timeControls';
import { useGameHistory } from '../stores/history';
import { useLocalSession } from '../stores/localSession';
import { type PassAndPlayView, useSettings } from '../stores/settings';

export function LocalGamePage() {
  const phase = useLocalSession((s) => s.phase);
  const [params] = useSearchParams();
  const fen = params.get('fen');

  useEffect(() => {
    // A position link opens its setup — unless the saved game already started from that position
    // (then this is just a reload of that game).
    const session = useLocalSession.getState();
    if (fen && session.phase === 'playing' && session.startFen !== fen) session.exitToSetup();
  }, [fen]);

  return phase === 'setup' ? <LocalSetup /> : <LocalGame />;
}

function LocalSetup() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const fen = params.get('fen') ?? undefined;
  const choice = useSettings((s) => s.timeControl);
  const view = useSettings((s) => s.passAndPlayView);
  const update = useSettings((s) => s.update);
  const start = useLocalSession((s) => s.start);
  const [error, setError] = useState(false);

  const onStart = () => {
    try {
      start(toTimeControl(choice), fen);
    } catch (err) {
      if (err instanceof FenError) setError(true);
      else throw err;
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-5">
      <h1 className="text-3xl font-extrabold">{t('modes.local')}</h1>
      <Card className="flex flex-col gap-4">
        <h2 className="text-lg font-extrabold">{t('play.timeControl')}</h2>
        <TimeControlPicker value={choice} onChange={(timeControl) => update({ timeControl })} />
      </Card>
      <Card className="flex flex-col gap-3">
        <h2 className="text-lg font-extrabold">{t('play.view')}</h2>
        <SegmentedControl<PassAndPlayView>
          label={t('play.view')}
          value={view}
          onChange={(passAndPlayView) => update({ passAndPlayView })}
          options={[
            { value: 'fixed', label: t('play.viewFixed') },
            { value: 'rotate', label: t('play.viewRotate') },
            { value: 'tabletop', label: t('play.viewTabletop') },
          ]}
        />
      </Card>
      {fen && <p className="text-sm text-muted">{t('play.customPosition')}</p>}
      {error && (
        <p role="alert" className="font-bold text-danger">
          {t('play.invalidFen')}
        </p>
      )}
      <Button size="lg" block onClick={onStart}>
        {t('play.start')}
      </Button>
    </div>
  );
}

function LocalGame() {
  const { t } = useTranslation();
  const game = useLocalSession((s) => s.game);
  const result = useLocalSession((s) => s.result);
  const flipped = useLocalSession((s) => s.flipped);
  const reviewId = useGameHistory((s) => s.current.local);
  useLocalSession((s) => s.version);
  const view = useSettings((st) => st.passAndPlayView);

  const base: Color = view === 'rotate' ? game.turn : 'w';
  const orientation: Color = flipped ? (base === 'w' ? 'b' : 'w') : base;

  return (
    <GameScreen
      useSession={useLocalSession}
      title={t('modes.local')}
      orientation={orientation}
      names={{ w: t('play.white'), b: t('play.black') }}
      inputEnabled
      rotateTopBar={view === 'tabletop'}
      canUndo={undoAllowed({ game, result })}
      onUndo={() => useLocalSession.getState().undo()}
      resignColor={game.turn}
      reviewId={reviewId}
      onRematch={() => {
        const { start, timeControl, startFen } = useLocalSession.getState();
        start(timeControl, startFen);
      }}
    />
  );
}
