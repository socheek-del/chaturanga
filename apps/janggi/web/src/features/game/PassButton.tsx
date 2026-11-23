import type { Game } from '@chaturanga/janggi';
import type { GameSessionStore } from '@chaturanga/game-shell';
import { Button, Modal } from '@chaturanga/ui';
import { SkipForward } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Passing (한수쉼) has no square to tap, so it gets a button. A pass that would end the game on points, because
 * the other side just passed or the generals face each other, asks first.
 */
export function PassButton({ useSession, enabled }: { useSession: GameSessionStore<Game>; enabled: boolean }) {
  const { t } = useTranslation();
  const { game, result, viewPly, version, move } = useSession();
  const [askedAt, setAskedAt] = useState<number | null>(null);
  const last = game.lastMove();
  const pass = enabled && !result && viewPly === null ? game.passMove() : null;
  const facing = game.isBikjang();
  const ends = facing || (!!last && last.from === last.to);
  const { w, b } = game.points();

  const play = () => {
    setAskedAt(null);
    if (pass) move(pass);
  };

  return (
    <>
      <Button variant="outline" data-testid="pass" disabled={!pass} onClick={ends ? () => setAskedAt(version) : play}>
        <SkipForward aria-hidden className="h-5 w-5" />
        {t('play.pass')}
      </Button>
      <Modal open={askedAt === version && !!pass} onClose={() => setAskedAt(null)} title={t('play.passEndsTitle')}>
        <p className="mb-4 text-muted">
          {t(facing ? 'play.passEndsBikjang' : 'play.passEndsDouble', { color: t(`colors.${w > b ? 'w' : 'b'}`), w, b })}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={() => setAskedAt(null)}>
            {t('play.cancel')}
          </Button>
          <Button variant="warning" data-testid="confirm-pass" onClick={play}>
            {t('play.pass')}
          </Button>
        </div>
      </Modal>
    </>
  );
}
