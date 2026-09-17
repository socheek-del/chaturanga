import { cn } from '@chaturanga/ui';
import type { PieceType } from '@chaturanga/xiangqi';
import { Check, Crown, Grid3x3, type LucideIcon, Repeat, Sparkles, Star, Swords, Ban } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { PieceSvg } from '../features/board/PieceSvg';
import { ALL_LESSONS, UNITS } from '../features/learn/lessons';
import { type Lesson, useL10n } from '../features/learn/types';
import { useProgress } from '../stores/progress';

/** Every lesson is open; `current` only marks the first one not yet completed. */
type Status = 'completed' | 'current' | 'unlocked';

/** Unit bands alternate ink and seal vermilion: the "Mo" palette (apps/xiangqi/docs/design.md). */
const UNIT_STYLES = ['bg-primary text-on-accent', 'bg-secondary text-on-accent'];

/** A lesson is a square seal on an ink line, not Makruk's diamond or Sittuyin's roundel. */
const SEAL_STYLES: Record<Status, string> = {
  completed: 'border-secondary bg-secondary text-on-accent',
  current: 'border-primary bg-primary text-on-accent ring-4 ring-secondary/40',
  unlocked: 'border-line bg-surface text-primary',
};

const ICONS: Record<string, LucideIcon> = { board: Grid3x3, flying: Swords, mate: Crown, stalemate: Ban, repeat: Repeat };
const PIECE_TYPES = new Set<string>(['k', 'a', 'b', 'n', 'r', 'c', 'p']);

function LessonIcon({ lesson, status }: { lesson: Lesson; status: Status }) {
  if (status === 'completed') return <Check aria-hidden className="h-7 w-7" strokeWidth={3} />;
  if (PIECE_TYPES.has(lesson.icon)) {
    return <PieceSvg piece={{ color: 'w', type: lesson.icon as PieceType, promoted: false }} className="h-10 w-10" />;
  }
  const Icon = ICONS[lesson.icon] ?? Star;
  return <Icon aria-hidden className="h-6 w-6" strokeWidth={2.25} />;
}

export function LearnPage() {
  const { t } = useTranslation();
  const tr = useL10n();
  const lessons = useProgress((s) => s.lessons);
  const xp = useProgress((s) => s.xp);

  const firstOpen = ALL_LESSONS.find((l) => !lessons[l.id]);
  const status = (lesson: Lesson): Status => {
    if (lessons[lesson.id]) return 'completed';
    return lesson === firstOpen ? 'current' : 'unlocked';
  };

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-8">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">{t('learn.title')}</h1>
        <span className="flex items-center gap-1.5 rounded-full bg-secondary-soft px-3 py-1.5 text-base font-semibold text-secondary" title={t('learn.xpLabel')}>
          <Sparkles aria-hidden className="h-5 w-5" />
          <span data-testid="xp">{xp} XP</span>
        </span>
      </header>

      {UNITS.map((unit, u) => (
        <section key={unit.id} className="flex flex-col gap-4">
          <div data-testid="unit-banner" className={cn('motif-mo relative w-full overflow-hidden rounded-2xl p-5 shadow-card', UNIT_STYLES[u % UNIT_STYLES.length])}>
            <p className="text-sm font-medium opacity-85">{t('learn.unit', { number: u + 1 })}</p>
            <h2 className="text-xl font-bold">{tr(unit.title)}</h2>
          </div>
          <ol className="relative flex flex-col gap-2 before:absolute before:bottom-8 before:left-10 before:top-8 before:border-l-2 before:border-primary/30">
            {unit.lessons.map((lesson) => {
              const state = status(lesson);
              const stars = lessons[lesson.id]?.stars ?? 0;
              return (
                <li key={lesson.id} data-lesson={lesson.id} data-status={state === 'current' ? 'unlocked' : state} className="relative">
                  <Link
                    to={`/learn/${lesson.id}`}
                    aria-label={tr(lesson.title)}
                    className="group flex items-center gap-5 rounded-2xl p-3 transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
                  >
                    <span className={cn('grid h-14 w-14 shrink-0 place-items-center rounded-lg border-2 shadow-card transition-transform duration-150 group-hover:scale-105', SEAL_STYLES[state])}>
                      <LessonIcon lesson={lesson} status={state} />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="font-semibold">{tr(lesson.title)}</span>
                      <span className="truncate text-sm text-muted">{tr(lesson.summary)}</span>
                      {stars > 0 && (
                        <span className="flex" aria-label={t('learn.stars', { count: stars })}>
                          {[1, 2, 3].map((i) => (
                            <Star key={i} aria-hidden className={cn('h-4 w-4', i <= stars ? 'fill-secondary text-secondary' : 'text-line')} />
                          ))}
                        </span>
                      )}
                    </span>
                    {state === 'current' && (
                      <span className="shrink-0 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-on-accent">{t('learn.start')}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
