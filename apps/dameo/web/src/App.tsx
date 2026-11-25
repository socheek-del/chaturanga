import { FeedbackLink, MoreGames, type SiblingSite, useFocusModeProvider } from '@chaturanga/game-shell/ui';
import { Game, START_FEN } from '@chaturanga/dameo';
import { ArrowLeft, ArrowUpRight, BookOpen, Compass, Route } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, Route as RouteView, Routes, useParams } from 'react-router';
import { PRODUCT } from '../product.config';
import { DISPLAY_SQUARES } from './board';
import { PieceArt } from './components/PieceArt';
import { ALL_LESSONS, UNITS } from './lessons/lessons';
import { DameoTutorial, lessonStarsKey, tutorialStarsKey } from './tutorial';

declare const __FAMILY__: readonly SiblingSite[];

const hero = new Game(START_FEN);

function Home() {
  const { t } = useTranslation();
  const completed = localStorage.getItem(tutorialStarsKey);
  return (
    <section className="atlas-home">
      <div className="atlas-copy">
        <p className="atlas-kicker"><span className="kicker-rule" />{t('home.edition')}</p>
        <h1>{t('home.title')}</h1>
        <p className="atlas-intro">{t('home.intro')}</p>
        <div className="atlas-actions">
          <Link className="atlas-primary" to="/tutorial"><BookOpen size={17} aria-hidden />{t('home.startLearning')}<ArrowUpRight size={16} aria-hidden /></Link>
          <Link className="atlas-secondary" to="/learn">{t('home.allLessons')} <span aria-hidden>→</span></Link>
          {completed && <p className="completion-note">{t('home.lastResult', { stars: completed })}</p>}
        </div>
        <div className="signature-line"><Route size={17} aria-hidden /><span>{t('home.signature')}</span></div>
      </div>
      <div className="atlas-figure" aria-hidden="true">
        <div className="figure-heading"><span>{t('home.diagram')}</span><span>{t('home.coordinates')}</span></div>
        <div className="hero-board">
          {DISPLAY_SQUARES.map((sq) => {
            const piece = hero.pieceAt(sq);
            return <div className="hero-cell" data-tone={((sq % 8) + Math.floor(sq / 8)) % 2} key={sq}>{piece && <PieceArt piece={piece} />}</div>;
          })}
          <svg className="route-trace" viewBox="0 0 8 8" preserveAspectRatio="none">
            <path d="M2.5 5.5 3.5 4.5 4.5 3.5 5.5 2.5" />
            <circle cx="2.5" cy="5.5" r=".13" /><circle cx="5.5" cy="2.5" r=".13" />
          </svg>
        </div>
        <div className="figure-caption"><span>{t('home.boardNote')}</span><span>64 / 64</span></div>
      </div>
      <div className="atlas-index"><span>{t('home.indexLabel')}</span><span>01</span><span>II</span><span>XVIII</span></div>
    </section>
  );
}

function Learn() {
  const { t } = useTranslation();
  return (
    <section className="lesson-index">
      <div className="page-heading">
        <Link className="back-link" to="/" aria-label={t('nav.home')}><ArrowLeft size={16} aria-hidden />{t('nav.home')}</Link>
        <p className="atlas-kicker"><span className="kicker-rule" />{t('learn.kicker')}</p>
        <h1>{t('learn.title')}</h1>
        <p>{t('learn.intro')}</p>
      </div>
      <div className="unit-list">
        {UNITS.map((unit, unitIndex) => (
          <section className="lesson-unit" key={unit.id}>
            <div className="unit-heading"><span>{String(unitIndex + 1).padStart(2, '0')}</span><h2>{unit.title.en}</h2><i /></div>
            <div className="lesson-rows">
              {unit.lessons.map((lesson, lessonIndex) => {
                const stars = localStorage.getItem(lessonStarsKey(lesson.id));
                return <Link className="lesson-row" to={`/lesson/${lesson.id}`} key={lesson.id}>
                  <span className="lesson-index-number">{String(lessonIndex + 1).padStart(2, '0')}</span>
                  <span className="lesson-symbol" aria-hidden>{lesson.icon}</span>
                  <span className="lesson-description"><strong>{lesson.title.en}</strong><small>{lesson.summary.en}</small></span>
                  <span className="lesson-result">{stars ? t('learn.stars', { count: stars }) : t('learn.begin')}<ArrowUpRight size={15} aria-hidden /></span>
                </Link>;
              })}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}

function LessonRoute() {
  const { id } = useParams();
  const lesson = ALL_LESSONS.find((candidate) => candidate.id === id);
  return lesson ? <DameoTutorial lesson={lesson} /> : <Navigate to="/learn" replace />;
}

export function App() {
  const { t } = useTranslation();
  const { focus, FocusProvider } = useFocusModeProvider();
  return (
    <div className={`dameo-app${focus ? ' is-focused' : ''}`}>
      <header className="site-masthead">
        <Link className="brand" to="/" aria-label={t('nav.home')}>
          <span className="brand-seal" aria-hidden><Compass size={21} strokeWidth={1.5} /></span>
          <span><strong>{t('home.title')}</strong><small>{t('home.brandNote')}</small></span>
        </Link>
        {focus ? <Link className="back-link" to="/learn"><ArrowLeft size={16} aria-hidden />{t('nav.leave')}</Link> :
          <nav className="top-nav" aria-label={t('nav.label')}><Link to="/learn">{t('nav.lessons')}</Link><Link to="/tutorial">{t('nav.start')}</Link></nav>}
      </header>
      <main>
        <FocusProvider>
          <Routes>
            <RouteView index element={<Home />} />
            <RouteView path="learn" element={<Learn />} />
            <RouteView path="tutorial" element={<Navigate to={`/lesson/${ALL_LESSONS[0]!.id}`} replace />} />
            <RouteView path="lesson/:id" element={<LessonRoute />} />
            <RouteView path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </FocusProvider>
      </main>
      {!focus && <footer className="site-footer"><MoreGames sites={__FAMILY__} locale={PRODUCT.defaultLocale} variant="footer" /><FeedbackLink product={PRODUCT.id} /></footer>}
    </div>
  );
}
