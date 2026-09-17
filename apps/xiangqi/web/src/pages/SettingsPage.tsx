import { Card, cn, SegmentedControl, Switch } from '@chaturanga/ui';
import { useTranslation } from 'react-i18next';
import { type Language, PRODUCT } from '../../product.config';
import { BoardLines } from '../features/board/BoardLines';
import { PieceSvg } from '../features/board/PieceSvg';
import { BOARD_THEMES, type BoardTheme } from '../features/board/themes';
import { type ColorScheme, useSettings } from '../stores/settings';

/** A small corner of the board: lines on the theme's wood, with one piece on a point. */
function BoardSwatch({ theme }: { theme: BoardTheme }) {
  return (
    <div aria-hidden className="relative aspect-[9/10] w-full overflow-hidden rounded-lg border-2" style={{ background: theme.board, borderColor: theme.line }}>
      <div className="absolute inset-0">
        <BoardLines theme={theme} />
      </div>
      <PieceSvg piece={{ color: 'w', type: 'c', promoted: false }} className="absolute left-[33%] top-[40%] h-[22%] w-[22%]" />
    </div>
  );
}

export function SettingsPage() {
  const { t } = useTranslation();
  const settings = useSettings();
  const { update } = settings;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <h1 className="text-3xl font-bold">{t('nav.settings')}</h1>

      <Card className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">{t('settings.language')}</h2>
        <SegmentedControl<Language>
          label={t('settings.language')}
          value={settings.language}
          onChange={(language) => update({ language })}
          options={PRODUCT.locales.map((code) => ({ value: code, label: PRODUCT.languageNames[code] }))}
        />
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">{t('settings.appearance')}</h2>
        <SegmentedControl<ColorScheme>
          label={t('settings.appearance')}
          value={settings.colorScheme}
          onChange={(colorScheme) => update({ colorScheme })}
          options={[
            { value: 'system', label: t('settings.system') },
            { value: 'light', label: t('settings.light') },
            { value: 'dark', label: t('settings.dark') },
          ]}
        />
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">{t('settings.board')}</h2>
        <div role="radiogroup" aria-label={t('settings.board')} className="grid grid-cols-3 gap-3">
          {BOARD_THEMES.map((theme) => {
            const checked = theme.id === settings.boardTheme;
            return (
              <button
                key={theme.id}
                type="button"
                role="radio"
                aria-checked={checked}
                aria-label={t(`design.board.${theme.id}`)}
                data-board-theme={theme.id}
                onClick={() => update({ boardTheme: theme.id })}
                className={cn('rounded-xl p-1 transition-colors', checked ? 'bg-primary-soft ring-2 ring-primary' : 'hover:bg-surface-2')}
              >
                <BoardSwatch theme={theme} />
                <span className="mt-1 block text-xs font-semibold">{t(`design.board.${theme.id}`)}</span>
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="text-lg font-bold">{t('settings.play')}</h2>
        <label className="flex items-center justify-between gap-3">
          <span className="font-semibold">{t('settings.coordinates')}</span>
          <Switch checked={settings.showCoordinates} onChange={(showCoordinates) => update({ showCoordinates })} label={t('settings.coordinates')} />
        </label>
      </Card>
    </div>
  );
}
