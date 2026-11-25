import { FeedbackLink, MoreGames, type SiblingSite, useFocusModeProvider } from '@chaturanga/game-shell/ui';
import { FILES, RANKS, Game, fieldOf, isFortress, isGate, isPlayable } from '@chaturanga/shatra';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, Route, Routes } from 'react-router';
import { PRODUCT } from '../product.config';
import { renderPiece } from './board';
import { ComputerRoute, Lobby, LocalPlay, Room } from './game';
import { Tutorial, tutorialKey } from './tutorial';

declare const __FAMILY__: readonly SiblingSite[];

const start = new Game();
const squares = Array.from({ length: FILES * RANKS }, (_, i) => (RANKS - 1 - Math.floor(i / FILES)) * FILES + i % FILES);

function Home() {
  const { t } = useTranslation();
  return <section className="home">
    <div className="home-copy">
      <p className="eyebrow">{t('home.edition')}</p>
      <h1>{t('home.title')}</h1>
      <p className="intro">{t('home.intro')}</p>
      <div className="home-actions">
        <Link className="primary-link" to="/tutorial"><span>{t('home.learn')}</span><span aria-hidden>↗</span></Link>
        {localStorage.getItem(tutorialKey) && <span className="completion">{t('home.installed')}</span>}
        <Link to="/computer">{t('home.single')} <span aria-hidden>↗</span></Link>
        <Link to="/local">{t('home.local')} <span aria-hidden>↗</span></Link>
        <Link to="/online">{t('home.online')} <span aria-hidden>↗</span></Link>
      </div>
      <p className="field-note"><span className="field-mark" aria-hidden>62</span>{t('home.fieldNote')}</p>
    </div>
    <div className="atlas" aria-label={t('board.label')}>
      <div className="atlas-caption"><span>{t('home.north')}</span><span>{t('home.map')}</span></div>
      <div className="home-board" aria-hidden>
        <div className="home-grid">{squares.map((sq) => {
          if (!isPlayable(sq)) return <div key={sq} className="board-hole" />;
          const field = fieldOf(sq)!;
          const region = isGate(sq) ? 'gate' : isFortress(sq) ? 'fortress' : 'plain';
          const piece = start.pieceAt(sq);
          return <div key={sq} data-region={region} data-field={field}>{piece && renderPiece(piece, '')}</div>;
        })}</div>
      </div>
      <div className="atlas-caption lower"><span>{t('home.south')}</span><span>{t('home.startPosition')}</span></div>
    </div>
  </section>;
}

function SidePicker() {
  const { t } = useTranslation();
  return <section className="prepare">
    <p className="eyebrow">{t('home.single')}</p>
    <h1>{t('home.choose')}</h1>
    <div className="choices"><Link to="/computer/w">{t('colors.w')}</Link><Link to="/computer/b">{t('colors.b')}</Link></div>
  </section>;
}

export function App() {
  const { t } = useTranslation();
  const { focus, FocusProvider } = useFocusModeProvider();
  return <div className={`app${focus ? ' focused' : ''}`}>
    <header className="mast"><Link to="/" aria-label={t('home.back')}><span aria-hidden className="brand-mark">᛫</span><span>{t('home.title')}</span></Link><span className="mast-caption">{t('home.edition')}</span></header>
    <main>
      {focus === 'game' && <Link className="mobile-back" to="/">← {t('home.back')}</Link>}
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
