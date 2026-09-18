import { resolveLocale } from '@chaturanga/game-shell';
import { MoreGames, useFocusModeProvider } from '@chaturanga/game-shell/ui';
import { cn } from '@chaturanga/ui';
import { ArrowLeft, GraduationCap, Info, type LucideIcon, Settings, Swords } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink, Outlet } from 'react-router';
import { PRODUCT } from '../../product.config';
import { ThemeController } from './ThemeController';

const NAV: ReadonlyArray<{ to: string; key: string; icon: LucideIcon; end?: boolean }> = [
  { to: '/', key: 'nav.play', icon: Swords, end: true },
  { to: '/learn', key: 'nav.learn', icon: GraduationCap },
  { to: '/about', key: 'nav.about', icon: Info },
  { to: '/settings', key: 'nav.settings', icon: Settings },
];

export function AppShell() {
  const { t, i18n } = useTranslation();
  // Games get the whole phone screen: no bottom nav, a back link instead (polish-003).
  const { focus, FocusProvider } = useFocusModeProvider();
  return (
    <div className="min-h-dvh bg-canvas text-ink md:flex">
      <ThemeController />
      <nav
        aria-label={t('nav.label')}
        className={cn(
          'fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-surface/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur md:sticky md:top-0 md:h-dvh md:w-64 md:flex-col md:gap-1 md:border-t-0 md:border-r md:bg-canvas md:px-4 md:py-6',
          focus && 'max-md:hidden',
        )}
      >
        <Link to="/" className="mb-5 hidden items-center gap-2.5 px-3 text-2xl font-bold text-primary md:flex">
          <span aria-hidden className="seal h-7 w-7 text-sm font-bold">
            {t('app.seal')}
          </span>
          {t('app.name')}
        </Link>
        {NAV.map(({ to, key, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 text-xs font-semibold transition-colors md:flex-none md:flex-row md:gap-3 md:px-3 md:py-2.5 md:text-sm',
                isActive ? 'text-primary md:bg-primary-soft' : 'text-muted hover:text-ink md:hover:bg-surface-2',
              )
            }
          >
            <Icon aria-hidden className="h-6 w-6" strokeWidth={2.25} />
            <span>{t(key)}</span>
          </NavLink>
        ))}
      </nav>
      <main
        data-focus={focus ?? undefined}
        className={cn('mx-auto w-full max-w-5xl px-4 pb-28 pt-6 md:pb-10', focus && 'max-md:px-3 max-md:pb-0 max-md:pt-0')}
      >
        {focus === 'game' && (
          <div className="flex h-11 items-center md:hidden">
            <Link
              to="/"
              data-testid="focus-back"
              className="-ml-1 flex h-10 items-center gap-1.5 rounded-full px-2 text-sm font-semibold text-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
            >
              <ArrowLeft aria-hidden className="h-5 w-5" />
              {t('nav.back')}
            </Link>
          </div>
        )}
        <FocusProvider>
          <Outlet />
        </FocusProvider>
        {!focus && <MoreGames sites={__FAMILY__} locale={resolveLocale(PRODUCT, i18n.language)} variant="footer" />}
      </main>
    </div>
  );
}
