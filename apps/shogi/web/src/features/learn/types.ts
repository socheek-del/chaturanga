import { type L10n, type Lesson as SharedLesson, type LessonStep as SharedStep, type Unit as SharedUnit, resolveLocale } from '@chaturanga/game-shell';
import { useTranslation } from 'react-i18next';
import { PRODUCT } from '../../../product.config';

export type { L10n };

/** A game-end claim a lesson makes, which the engine must agree with (checked in lessons.test.ts). */
export interface EndingExample {
  fen: string;
  moves: string[];
  kind: 'checkmate' | 'stalemate' | 'repetition' | 'perpetual-check' | 'perpetual-chase';
  winner?: 'w' | 'b';
}

export type LessonStep = SharedStep<EndingExample>;
export type Lesson = SharedLesson<EndingExample>;
export type Unit = SharedUnit<EndingExample>;

export function useL10n() {
  const { i18n } = useTranslation();
  const lang = resolveLocale(PRODUCT, i18n.language);
  return (text: L10n) => text[lang]!;
}
