import type { Game } from '@chaturanga/janggi';
import { cn } from '@chaturanga/ui';
import { useTranslation } from 'react-i18next';
import { PIECE_INK } from '../board/PieceSvg';

/** Both sides' points, which settle an undecided game, and whether the generals face each other. */
export function PointsLine({ game }: { game: Game }) {
  const { t } = useTranslation();
  const { w, b } = game.points();
  const facing = game.isBikjang();
  return (
    // One line of constant height, so the board beside it never changes size on a phone.
    <p
      data-testid="points"
      data-bikjang={facing || undefined}
      className={cn('flex h-8 items-center justify-center gap-3 rounded-xl text-sm font-bold tabular-nums', facing ? 'bg-warning text-on-warning' : 'bg-surface-2')}
    >
      {(['w', 'b'] as const).map((color) => (
        <span key={color} className="flex items-center gap-1.5">
          <span aria-hidden className="h-3 w-3 rounded-full" style={{ background: PIECE_INK[color] }} />
          {t('play.points', { color: t(`colors.${color}`), points: color === 'w' ? w : b })}
        </span>
      ))}
      {facing && <span role="status">{t('play.bikjang')}</span>}
    </p>
  );
}
