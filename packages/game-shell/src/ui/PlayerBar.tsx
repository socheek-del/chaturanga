import type { Color, Piece } from '@chaturanga/rules-core';
import { cn } from '@chaturanga/ui';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { formatAdvantage, formatClock } from './format';

export interface PlayerBarProps {
  color: Color;
  name: string;
  captured: readonly Piece[];
  advantage: number;
  timeMs: number | null;
  active: boolean;
  rotated?: boolean;
  renderPiece: (piece: Piece, className: string) => ReactNode;
  /** Piece type shown as the player's avatar; the king in every variant so far. */
  avatarType?: string;
}

export function PlayerBar({ color, name, captured, advantage, timeMs, active, rotated, renderPiece, avatarType = 'k' }: PlayerBarProps) {
  const { t } = useTranslation();
  const low = timeMs !== null && timeMs < 10_000;
  const advantageLabel = formatAdvantage(advantage);
  return (
    <div
      data-testid={`player-${color}`}
      data-active={active || undefined}
      data-rotated={rotated || undefined}
      className={cn('flex items-center gap-3 rounded-xl px-1 py-1', rotated && 'rotate-180')}
    >
      <span
        className={cn(
          'grid h-10 w-10 shrink-0 place-items-center rounded-xl border-2',
          active ? 'border-primary bg-primary-soft' : 'border-line bg-surface-2',
        )}
      >
        {renderPiece({ color, type: avatarType, promoted: false }, 'h-8 w-8')}
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-extrabold">{name}</span>
        <span className="flex h-5 items-center" aria-label={t('play.captured')}>
          {captured.map((piece, i) => (
            // `contents` keeps the wrapper out of the layout, so the art overlaps exactly as before.
            <span key={i} className="contents">
              {renderPiece(piece, '-mr-1.5 h-5 w-5')}
            </span>
          ))}
          {advantageLabel && <span className="ml-2.5 text-xs font-extrabold text-muted">{advantageLabel}</span>}
        </span>
      </div>
      {timeMs !== null && (
        <div
          role="timer"
          data-testid={`clock-${color}`}
          aria-label={t('play.clockOf', { color: t(`colors.${color}`) })}
          className={cn(
            'min-w-[5.5rem] rounded-xl px-3 py-1.5 text-right text-2xl font-extrabold tabular-nums',
            active ? (low ? 'bg-danger text-white' : 'bg-ink text-canvas') : 'bg-surface-2 text-muted',
          )}
        >
          {formatClock(timeMs)}
        </div>
      )}
    </div>
  );
}
