import { FeedbackLink, MoreGames, type SiblingSite, useFocusModeProvider } from '@chaturanga/game-shell/ui';
import { Game } from '@chaturanga/maharajah';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, Route, Routes } from 'react-router';
import { PRODUCT } from '../product.config';
import { renderPiece } from './board';
import { ComputerRoute, Lobby, LocalPlay, Room } from './game';
import { Tutorial, tutorialKey } from './tutorial';

declare const __FAMILY__: readonly SiblingSite[];

const start = new Game();
const squares = Array.from({ length: 64 }, (_, i) => 56 - 8 * (i >> 3) + (i & 7));

function Home() {
  const { t } = useTranslation();
  return <section className="home">
    <div className="home-copy">
      <h1>{t('home.title')}</h1>
      <p>{t('home.intro')}</p>
      <div className="home-actions">
        <Link className="primary-link" to="/tutorial">{t('home.learn')}</Link>
        {localStorage.getItem(tutorialKey) && <span className="completion">{t('home.installed')}</span>}
        <Link to="/computer">{t('home.single')} <span aria-hidden>↗</span></Link>
        <Link to="/local">{t('home.local')} <span aria-hidden>↗</span></Link>
        <Link to="/online">{t('home.online')} <span aria-hidden>↗</span></Link>
      </div>
    </div>
    <div className="home-board" aria-hidden>
      <div className="home-grid">{squares.map((sq) => {
        const piece = start.pieceAt(sq);
        return <div key={sq} data-tone={((sq & 7) + (sq >> 3)) % 2}>{piece && renderPiece(piece, '')}</div>;
      })}</div>
    </div>
  </section>;
}

function SidePicker() {
  const { t } = useTranslation();
  return <section className="prepare">
    <h1>{t('home.choose')}</h1>
    <div className="choices"><Link to="/computer/w">{t('home.maharajah')}</Link><Link to="/computer/b">{t('home.sepoys')}</Link></div>
  </section>;
}

export function App() {
  const { t } = useTranslation();
  const { focus, FocusProvider } = useFocusModeProvider();
  return <div className={`app${focus ? ' focused' : ''}`}>
    <header className="mast"><Link to="/" aria-label={t('home.back')}><span aria-hidden>✦</span> {t('home.title')}</Link></header>
    <main>
      {focus === 'game' && <Link className="mobile-back" to="/">{t('home.back')}</Link>}
      <FocusProvider>
        <Routes>
          <Route index element={<Home />} />
          <Route path="/tutorial" element={<Tutorial />} />
          <Route path="/local" element={<LocalPlay />} />
          <Route path="/computer" element={<SidePicker />} />
          <Route path="/computer/:side" element={<ComputerRoute />} />
          <Route path="/online" element={<Lobby />} />
          <Route path="/online/:code" element={<Room />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </FocusProvider>
      {!focus && <div className="site-footer"><MoreGames sites={__FAMILY__} locale={PRODUCT.defaultLocale} variant="footer" /><FeedbackLink product={PRODUCT.id} /></div>}
    </main>
  </div>;
}
