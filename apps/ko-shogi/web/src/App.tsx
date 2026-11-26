import { applySeo } from '@chaturanga/game-shell';
import { ArrowLeft, BookOpen, Grid3X3, Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router';
import { PRODUCT } from '../product.config';
import { SITE_URL } from '../site.config';
import { HomePage } from './pages/HomePage';
import { PlaySetup } from './pages/PlaySetup';
import { GamePage } from './pages/GamePage';
import { FieldKeyPage } from './pages/FieldKeyPage';
import { LessonPlayerRoute, TutorialPage } from './pages/TutorialPage';
import { storageKey } from '@chaturanga/game-shell';
import { OnlineLobbyPage, OnlineRoomRoute } from './pages/OnlinePages';

type Theme = 'light' | 'dark';
const THEME_KEY = storageKey(PRODUCT, 'theme');

function initialTheme(): Theme {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch { /* Storage can be unavailable in a private tab. */ }
  return typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function AppFrame() {
  const { t } = useTranslation();
  const location = useLocation();
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const home = location.pathname === '/';
  const title = home ? t('home.title') : location.pathname.startsWith('/game/') ? `${t('brand.name')} · ${t('game.localLabel')}` : `${t('brand.name')} · ${t('brand.edition')}`;

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem(THEME_KEY, theme); } catch { /* The current tab still gets its chosen theme. */ }
  }, [theme]);

  useEffect(() => {
    applySeo(PRODUCT, SITE_URL || __SITE_URL__, { path: location.pathname, index: location.pathname === '/' || location.pathname === '/learn' || location.pathname === '/atlas' }, 'en', title, t('home.intro'));
  }, [location.pathname, t, title]);

  return <div className="atlas-app">
    <header className="site-header">
      <Link to="/" className="wordmark" aria-label={t('nav.home')}>
        <span className="wordmark-seal" aria-hidden="true">K</span>
        <span><strong>{t('brand.name')}</strong><small>{t('brand.tagline')}</small></span>
      </Link>
      <nav className="top-nav" aria-label={t('nav.label')}>
        <Link to="/play">{t('nav.play')}</Link>
        <Link to="/online">{t('modes.online')}</Link>
        <Link to="/learn">{t('nav.learn')}</Link>
        <Link to="/atlas">{t('nav.atlas')}</Link>
      </nav>
      <button className="theme-toggle" type="button" aria-label={t('theme.toggle')} onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
        {theme === 'light' ? <Moon size={16} aria-hidden="true" /> : <Sun size={16} aria-hidden="true" />}
        <span>{t(theme === 'light' ? 'theme.dark' : 'theme.light')}</span>
      </button>
    </header>
    {!home && <div className="crumb-row"><Link to="/"><ArrowLeft size={15} aria-hidden="true" />{t('nav.home')}</Link><span aria-hidden="true">/</span><span>{location.pathname.startsWith('/game/') ? t('nav.play') : location.pathname.startsWith('/atlas') ? t('nav.atlas') : t('nav.learn')}</span></div>}
    <main className="app-main"><Routes>
      <Route index element={<HomePage />} />
      <Route path="play" element={<PlaySetup />} />
      <Route path="game/:mode/:side/:level" element={<GamePage />} />
      <Route path="online" element={<OnlineLobbyPage />} />
      <Route path="online/:code" element={<OnlineRoomRoute />} />
      <Route path="learn" element={<TutorialPage />} />
      <Route path="learn/:id" element={<LessonPlayerRoute />} />
      <Route path="atlas" element={<FieldKeyPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes></main>
    <footer className="site-footer">
      <span>{t('home.footer')}</span>
      <div><Link to="/learn"><BookOpen size={14} aria-hidden="true" />{t('nav.learn')}</Link><Link to="/atlas"><Grid3X3 size={14} aria-hidden="true" />{t('nav.atlas')}</Link></div>
    </footer>
  </div>;
}

export function App() { return <AppFrame />; }
