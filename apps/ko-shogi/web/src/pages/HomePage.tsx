import { Board } from '@chaturanga/board-ui';
import { Bot, BookOpen, ChevronRight, Compass, Grid3X3, Users, Wifi } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';
import { Game, koShogi } from '@chaturanga/ko-shogi';
import { useBoardIdentity } from '../board';
import { readSavedSession, gameRoute } from '../stores/sessions';

export function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const board = useBoardIdentity();
  const game = new Game(koShogi.startFen);
  const saved = readSavedSession();

  return <div className="home-page">
    <section className="home-hero">
      <div className="hero-copy">
        <p className="eyebrow"><span className="eyebrow-rule" />{t('home.kicker')}</p>
        <h1>{t('home.title')}</h1>
        <p className="hero-intro">{t('home.intro')}</p>
        <div className="hero-actions">
          <Link className="button button--primary" to="/play"><Bot size={17} aria-hidden="true" />{t('home.playBot')}<ChevronRight size={16} aria-hidden="true" /></Link>
          <Link className="button button--quiet" to="/play?mode=local"><Users size={17} aria-hidden="true" />{t('home.passPlay')}<ChevronRight size={16} aria-hidden="true" /></Link>
          <Link className="button button--quiet" to="/online"><Wifi size={17} aria-hidden="true" />{t('home.online')}<ChevronRight size={16} aria-hidden="true" /></Link>
          <Link className="button button--quiet" to="/learn"><BookOpen size={17} aria-hidden="true" />{t('home.tutorial')}<ChevronRight size={16} aria-hidden="true" /></Link>
        </div>
        {saved && <button className="resume-link" type="button" onClick={() => navigate(gameRoute(saved))}>{t('home.resume')}<ChevronRight size={15} aria-hidden="true" /></button>}
        <div className="hero-facts">
          <div><strong>90</strong><span>{t('home.statsPieces')}</span></div>
          <div><strong>34</strong><span>{t('home.statsForms')}</span></div>
          <div><strong>361</strong><span>{t('home.statsSize')}</span></div>
        </div>
      </div>
      <div className="field-figure">
        <div className="figure-topline"><span>{t('brand.edition')}</span><span>19 / 19</span></div>
        <div className="figure-board-frame">
          <Board {...board} files={19} ranks={19} pieces={game.pieces()} showCoordinates={false} className="field-preview" />
          <svg className="figure-route" viewBox="0 0 19 19" aria-hidden="true"><path d="M5.5 13.5L6.5 12.5L8.5 10.5" /><circle cx="5.5" cy="13.5" r=".35" /><circle cx="6.5" cy="12.5" r=".35" /><circle cx="8.5" cy="10.5" r=".35" /></svg>
        </div>
        <div className="figure-caption"><span>{t('home.profile')}</span><Compass size={15} aria-hidden="true" /></div>
      </div>
    </section>
    <section className="home-footnotes" aria-label={t('home.sourceNote')}>
      <p><span className="note-index">01</span><span>{t('home.sourceNote')}</span></p>
      <Link to="/atlas"><Grid3X3 size={16} aria-hidden="true" />{t('home.fieldKey')}</Link>
      <p className="edition-note">{t('home.profile')}</p>
    </section>
  </div>;
}
