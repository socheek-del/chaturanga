import { Button, Card, SegmentedControl } from '@chaturanga/ui';
import type { Card as UnoCard } from '@chaturanga/uno';
import { Cpu, Users } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CardFace } from '../features/cards/CardFace';
import { CardTable } from '../features/cards/CardTable';
import { RulesSheet } from '../features/cards/RulesSheet';
import type { Side } from '../features/cards/rules';
import { type CardMode, useCardChess } from '../features/cards/store';

/** Card Chess (cards-001): chess moves decided by Uno-rules cards. */
export function CardChessPage() {
  const playing = useCardChess((s) => s.game !== null);
  return playing ? <CardTable /> : <CardSetup />;
}

const HERO: UnoCard[] = [
  { id: -1, kind: 'number', color: 'yellow', value: 4 },
  { id: -2, kind: 'skip', color: 'green', value: null },
  { id: -3, kind: 'wild', color: null, value: null },
  { id: -4, kind: 'draw2', color: 'red', value: null },
  { id: -5, kind: 'number', color: 'blue', value: 7 },
];

function CardSetup() {
  const { t } = useTranslation();
  const config = useCardChess((s) => s.config);
  const start = useCardChess((s) => s.start);
  const [mode, setMode] = useState<CardMode>(config.mode);
  const [level, setLevel] = useState(String(config.level));
  const [side, setSide] = useState<Side | 'random'>(config.side);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-5">
      <header className="cc-hero relative overflow-hidden rounded-3xl bg-[#1d2a32] px-6 pb-6 pt-40 text-white shadow-card">
        <div aria-hidden className="absolute inset-x-0 top-4 flex justify-center">
          {HERO.map((card, i) => (
            <div
              key={card.id}
              className="cc-hero-card -mx-3"
              style={{ ['--angle' as string]: `${(i - 2) * 11}deg`, ['--lift' as string]: `${Math.abs(i - 2) * 9}px`, animationDelay: `${i * 90}ms` }}
            >
              <CardFace card={card} size={62} className="shadow-xl" />
            </div>
          ))}
        </div>
        <h1 className="relative text-3xl font-black">{t('cards.title')}</h1>
        <p className="relative mt-1 opacity-90">{t('cards.tagline')}</p>
      </header>

      <Card className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              ['computer', Cpu, 'cards.modeComputer'],
              ['local', Users, 'cards.modeLocal'],
            ] as const
          ).map(([value, Icon, key]) => (
            <button
              key={value}
              type="button"
              aria-pressed={mode === value}
              onClick={() => setMode(value)}
              className={
                'flex flex-col items-center gap-2 rounded-2xl border-2 p-4 font-bold transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 ' +
                (mode === value ? 'border-primary bg-primary-soft text-primary' : 'border-line text-muted hover:border-subtle')
              }
            >
              <Icon aria-hidden className="h-7 w-7" />
              {t(key)}
            </button>
          ))}
        </div>
        {mode === 'computer' && (
          <>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-bold">{t('cards.level')}</span>
              <SegmentedControl
                label={t('cards.level')}
                value={level}
                onChange={setLevel}
                options={['1', '2', '3'].map((value) => ({ value, label: t(`cards.bot.${value}`) }))}
              />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-bold">{t('cards.side')}</span>
              <SegmentedControl
                label={t('cards.side')}
                value={side}
                onChange={setSide}
                options={[
                  { value: 'w', label: t('colors.w') },
                  { value: 'b', label: t('colors.b') },
                  { value: 'random', label: t('cards.random') },
                ]}
              />
            </div>
          </>
        )}
      </Card>

      <Button
        size="lg"
        block
        onClick={() =>
          start({
            mode,
            level: Number(level),
            side: side === 'random' ? (Math.random() < 0.5 ? 'w' : 'b') : side,
          })
        }
      >
        {t('cards.deal')}
      </Button>

      <Card>
        <h2 className="mb-3 text-lg font-bold">{t('cards.rules.title')}</h2>
        <RulesSheet />
      </Card>
    </div>
  );
}
