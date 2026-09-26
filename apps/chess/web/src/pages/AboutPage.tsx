import { buttonClasses, Card } from '@chaturanga/ui';
import { BookOpen, Brush, Bug, Cpu, Heart } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

export const REPO_URL = 'https://github.com/socheek-del/chaturanga';
const AUTHOR = 'socheek-del';
/** Where the traditional piece set comes from; its licence travels with the files (CREDITS.md). */
const PIECE_ART_URL = 'https://commons.wikimedia.org/wiki/Category:SVG_chess_pieces';
const STOCKFISH_URL = 'https://github.com/official-stockfish/Stockfish';
const OPENINGS_URL = 'https://github.com/lichess-org/chess-openings';

function ExternalLink({ href, children, variant = 'outline' }: { href: string; children: ReactNode; variant?: 'primary' | 'outline' }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={buttonClasses({ variant, block: true })}>
      {children}
    </a>
  );
}

/**
 * What chess is, and how to help the project on GitHub (ch-010).
 */
export function AboutPage() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <h1 className="text-3xl font-bold">{t('nav.about')}</h1>

      <Card className="flex flex-col gap-3">
        <p>{t('about.what')}</p>
        <p className="text-muted">{t('about.free')}</p>
      </Card>

      <Card className="flex flex-col gap-2">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <BookOpen aria-hidden className="h-5 w-5 text-secondary" />
          {t('about.whatTitle')}
        </h2>
        <p className="text-muted">{t('about.whatBody')}</p>
      </Card>

      <Card className="flex flex-col gap-2" data-testid="art-credit">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Brush aria-hidden className="h-5 w-5 text-secondary" />
          {t('about.artTitle')}
        </h2>
        <p className="text-muted">{t('about.artBody')}</p>
        <a
          href={PIECE_ART_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-secondary underline underline-offset-4"
        >
          {t('about.artSource')}
        </a>
      </Card>

      <Card className="flex flex-col gap-2" data-testid="engine-credit">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Cpu aria-hidden className="h-5 w-5 text-secondary" />
          {t('about.engineTitle')}
        </h2>
        <p className="text-muted">{t('about.engineBody')}</p>
        <a href={STOCKFISH_URL} target="_blank" rel="noopener noreferrer" className="font-semibold text-secondary underline underline-offset-4">
          {t('about.engineSource')}
        </a>
        <a href={OPENINGS_URL} target="_blank" rel="noopener noreferrer" className="font-semibold text-secondary underline underline-offset-4">
          {t('about.openingsSource')}
        </a>
      </Card>

      <Card className="flex flex-col gap-3" data-testid="contribute">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Heart aria-hidden className="h-5 w-5 text-secondary" />
          {t('about.openSource')}
        </h2>
        <p className="text-muted">{t('about.licence')}</p>
        <ExternalLink href={REPO_URL} variant="primary">
          {t('about.source')}
        </ExternalLink>
        <div className="grid gap-3 sm:grid-cols-2">
          <ExternalLink href={`${REPO_URL}/blob/main/CONTRIBUTING.md`}>
            <Heart aria-hidden className="h-5 w-5" />
            {t('about.contribute')}
          </ExternalLink>
          <ExternalLink href={`${REPO_URL}/issues/new`}>
            <Bug aria-hidden className="h-5 w-5" />
            {t('about.reportBug')}
          </ExternalLink>
        </div>
      </Card>

      <p className="text-center text-sm text-muted">
        <a href={`https://github.com/${AUTHOR}`} target="_blank" rel="noopener noreferrer" className="font-bold text-secondary">
          {t('about.madeBy', { name: AUTHOR })}
        </a>
        {' · GPL-3.0'}
      </p>
    </div>
  );
}
