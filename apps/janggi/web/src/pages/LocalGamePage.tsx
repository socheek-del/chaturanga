import { toTimeControl } from '@chaturanga/game-shell';
import { TimeControlPicker } from '@chaturanga/game-shell/ui';
import { Button, Card } from '@chaturanga/ui';
import { type Color, setupFen } from '@chaturanga/janggi';
import { useTranslation } from 'react-i18next';
import { GameScreen, undoAllowed } from '../features/game/GameScreen';
import { SetupPicker } from '../features/game/SetupPicker';
import { useLocalSession } from '../stores/localSession';
import { useSettings } from '../stores/settings';

export function LocalGamePage() {
  const phase = useLocalSession((s) => s.phase);
  return phase === 'setup' ? <LocalSetup /> : <LocalGame />;
}

function LocalSetup() {
  const { t } = useTranslation();
  const choice = useSettings((s) => s.timeControl);
  const setupW = useSettings((s) => s.setupW);
  const setupB = useSettings((s) => s.setupB);
  const update = useSettings((s) => s.update);
  const start = useLocalSession((s) => s.start);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-5">
      <h1 className="text-3xl font-bold">{t('modes.local')}</h1>
      <Card className="flex flex-col gap-4">
        <h2 className="text-lg font-bold">{t('play.timeControl')}</h2>
        <TimeControlPicker value={choice} onChange={(timeControl) => update({ timeControl })} />
      </Card>
      <Card className="flex flex-col gap-4">
        <h2 className="text-lg font-bold">{t('setup.title')}</h2>
        <SetupPicker label={t('colors.b')} color="b" value={setupB} onChange={(id) => update({ setupB: id })} />
        <SetupPicker label={t('colors.w')} color="w" value={setupW} onChange={(id) => update({ setupW: id })} />
      </Card>
      <Button size="lg" block onClick={() => start(toTimeControl(choice), setupFen(setupW, setupB))}>
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
  useLocalSession((s) => s.version);

  const orientation: Color = flipped ? 'b' : 'w';

  return (
    <GameScreen
      useSession={useLocalSession}
      title={t('modes.local')}
      orientation={orientation}
      names={{ w: t('colors.w'), b: t('colors.b') }}
      inputEnabled
      canUndo={undoAllowed({ game, result })}
      onUndo={() => useLocalSession.getState().undo()}
      resignColor={game.turn}
      onRematch={() => {
        const { start, timeControl, startFen } = useLocalSession.getState();
        start(timeControl, startFen);
      }}
    />
  );
}
