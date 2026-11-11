import type { Card } from '@chaturanga/uno';
import { useTranslation } from 'react-i18next';
import { CardFace } from './CardFace';

const SAMPLES: Card[] = [
  { id: -1, kind: 'number', color: 'red', value: 7 },
  { id: -2, kind: 'number', color: 'blue', value: 3 },
  { id: -3, kind: 'number', color: 'green', value: 5 },
  { id: -4, kind: 'number', color: 'yellow', value: 9 },
];

const ACTIONS: Card[] = [
  { id: -5, kind: 'skip', color: 'green', value: null },
  { id: -6, kind: 'reverse', color: 'blue', value: null },
  { id: -7, kind: 'draw2', color: 'red', value: null },
  { id: -8, kind: 'wild', color: null, value: null },
  { id: -9, kind: 'wild4', color: null, value: null },
];

/** How Card Chess is played, short enough to read before the first game. */
export function RulesSheet() {
  const { t } = useTranslation();
  return (
    <div className="flex max-h-[60dvh] flex-col gap-4 overflow-y-auto pr-1 text-sm">
      <p>{t('cards.rules.intro')}</p>
      <div className="flex justify-center gap-2">
        {SAMPLES.map((card) => (
          <figure key={card.id} className="flex flex-col items-center gap-1">
            <CardFace card={card} size={54} />
            <figcaption className="text-xs text-muted">{t(`cards.short.${card.color}`)}</figcaption>
          </figure>
        ))}
      </div>
      <ol className="flex list-decimal flex-col gap-2 pl-5">
        <li>{t('cards.rules.match')}</li>
        <li>{t('cards.rules.colors')}</li>
        <li>{t('cards.rules.king')}</li>
        <li>{t('cards.rules.stuck')}</li>
        <li>{t('cards.rules.capture')}</li>
        <li>{t('cards.rules.uno')}</li>
        <li>{t('cards.rules.win')}</li>
      </ol>
      <ul className="flex flex-col gap-2">
        {ACTIONS.map((card) => (
          <li key={card.id} className="flex items-center gap-3">
            <CardFace card={card} size={34} className="shrink-0" />
            <span>{t(`cards.rules.action.${card.kind}`)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
