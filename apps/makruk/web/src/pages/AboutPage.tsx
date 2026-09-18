import { BookOpen, Bug, Heart, Languages } from 'lucide-react';
import type { ReactNode } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { buttonClasses, Card } from '@chaturanga/ui';
import { Mascot } from '../features/learn/Mascot';

export const REPO_URL = 'https://github.com/socheek-del/chaturanga';
const AUTHOR = 'socheek-del';

function GitHubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className={className} fill="currentColor">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

function ExternalLink({ href, children, variant = 'outline' }: { href: string; children: ReactNode; variant?: 'primary' | 'outline' }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={buttonClasses({ variant, block: true })}>
      {children}
    </a>
  );
}

/** Project information and ways to contribute on GitHub. */
export function AboutPage() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <h1 className="text-3xl font-extrabold">{t('about.title')}</h1>

      <Card className="flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
        <Mascot pose="happy" className="h-28 w-28 shrink-0" />
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-extrabold text-primary">{t('about.heroTitle')}</h2>
          <p className="text-muted">{t('about.heroBody')}</p>
        </div>
      </Card>

      <Card className="flex flex-col gap-2">
        <h2 className="flex items-center gap-2 text-lg font-extrabold">
          <BookOpen aria-hidden className="h-5 w-5 text-secondary" />
          {t('about.makrukTitle')}
        </h2>
        <p className="text-muted">{t('about.makrukBody')}</p>
      </Card>

      <Card className="flex flex-col gap-3" data-testid="contribute">
        <h2 className="flex items-center gap-2 text-lg font-extrabold">
          <Heart aria-hidden className="h-5 w-5 fill-danger text-danger" />
          {t('about.projectTitle')}
        </h2>
        <p className="text-muted">{t('about.projectBody')}</p>
        <ExternalLink href={REPO_URL} variant="primary">
          <GitHubMark className="h-5 w-5" />
          {t('about.github')}
        </ExternalLink>
        <div className="grid gap-3 sm:grid-cols-3">
          <ExternalLink href={`${REPO_URL}/blob/main/CONTRIBUTING.md`}>
            <Heart aria-hidden className="h-5 w-5" />
            {t('about.contribute')}
          </ExternalLink>
          <ExternalLink href={`${REPO_URL}/issues/new`}>
            <Bug aria-hidden className="h-5 w-5" />
            {t('about.reportBug')}
          </ExternalLink>
          <ExternalLink href={`${REPO_URL}/blob/main/apps/makruk/docs/i18n-review.md`}>
            <Languages aria-hidden className="h-5 w-5" />
            {t('about.translate')}
          </ExternalLink>
        </div>
      </Card>

      <p className="text-center text-sm text-muted">
        <Trans
          i18nKey="about.pieceArt"
          components={{
            author: <a href="https://commons.wikimedia.org/wiki/Category:Makruk_pieces" target="_blank" rel="noopener noreferrer" className="font-bold text-secondary" />,
            licence: <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer" className="font-bold text-secondary" />,
          }}
        />
      </p>

      <p className="text-center text-sm text-muted">
        <a href={`https://github.com/${AUTHOR}`} target="_blank" rel="noopener noreferrer" className="font-extrabold text-secondary">
          {t('about.madeBy', { name: AUTHOR })}
        </a>
        {' · GPL-3.0'}
      </p>
    </div>
  );
}
