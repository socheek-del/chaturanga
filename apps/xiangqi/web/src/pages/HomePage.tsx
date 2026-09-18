import { resolveLocale } from '@chaturanga/game-shell';
import { MoreGames } from '@chaturanga/game-shell/ui';
import { Badge, Card } from '@chaturanga/ui';
import { Cpu, Globe, GraduationCap, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { PRODUCT } from '../../product.config';

const MODES = [
  { to: '/play/computer', key: 'modes.single', desc: 'home.singleDesc', icon: Cpu },
  { to: '/play/online', key: 'modes.online', desc: 'home.onlineDesc', icon: Globe },
  { to: '/play/local', key: 'modes.local', desc: 'home.localDesc', icon: Users },
  { to: '/learn', key: 'home.learn', desc: 'home.learnDesc', icon: GraduationCap },
];

export function HomePage() {
  const { t, i18n } = useTranslation();
  return (
    <div className="flex flex-col gap-6">
      <header className="motif-mo relative overflow-hidden rounded-2xl bg-primary p-6 text-on-accent">
        <h1 className="text-3xl font-bold">{t('app.name')}</h1>
        <p className="mt-1 max-w-lg opacity-90">{t('home.tagline')}</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {MODES.map(({ to, key, desc, icon: Icon }) => (
          <Link key={to} to={to}>
            <Card interactive className="flex h-full items-center gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary">
                <Icon aria-hidden className="h-7 w-7" />
              </span>
              <span className="flex flex-col">
                <span className="text-lg font-bold">{t(key)}</span>
                <span className="text-sm text-muted">{t(desc)}</span>
              </span>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold">{t('home.aboutGame')}</h2>
          <Badge tone="secondary">{t('home.traditional')}</Badge>
        </div>
        <p className="text-muted">{t('home.intro')}</p>
      </Card>

      <MoreGames sites={__FAMILY__} locale={resolveLocale(PRODUCT, i18n.language)} />
    </div>
  );
}
