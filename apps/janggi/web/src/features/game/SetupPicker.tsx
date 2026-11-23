import { type Color, type PieceType, SETUP_IDS, type SetupId, SETUPS } from '@chaturanga/janggi';
import { cn } from '@chaturanga/ui';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../stores/settings';
import { PieceSvg } from '../board/PieceSvg';

/** Chooses an opening arrangement (차림): the order of a side's horses and elephants, from its own left. */
export function SetupPicker({ label, color, value, onChange }: { label: string; color: Color; value: SetupId; onChange: (id: SetupId) => void }) {
  const { t } = useTranslation();
  const pieceSet = useSettings((s) => s.pieceSet);
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-extrabold text-muted">{label}</h3>
      <div role="radiogroup" aria-label={label} className="grid grid-cols-2 gap-2">
        {SETUP_IDS.map((id) => {
          const checked = id === value;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={checked}
              aria-label={t(`setup.${id}`)}
              data-setup={`${color}-${id}`}
              onClick={() => onChange(id)}
              className={cn(
                'flex flex-col items-center gap-1 rounded-xl border p-2 transition-colors',
                checked ? 'border-primary bg-primary-soft ring-1 ring-primary' : 'border-line bg-surface hover:bg-surface-2',
              )}
            >
              <span className="flex gap-0.5">
                {[...SETUPS[id]].map((type, i) => (
                  <PieceSvg key={i} piece={{ color, type: type as PieceType, promoted: false }} set={pieceSet} className="h-8 w-8" />
                ))}
              </span>
              <span className="text-xs font-semibold">{t(`setup.${id}`)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
