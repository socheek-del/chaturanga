import { Button } from '@chaturanga/ui';
import { BOTS, botById } from '@chaturanga/ko-shogi-ai';
import type { Color } from '@chaturanga/rules-core';
import { ArrowRight, Bot, Users } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';
import { PieceSeal } from '../components/PieceSeal';
import { newSession, saveSession, gameRoute, readSavedSession, type GameMode } from '../stores/sessions';

export function PlaySetup() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<GameMode>(new URLSearchParams(location.search).get('mode') === 'local' ? 'local' : 'bot');
  const [humanColor, setHumanColor] = useState<Color>('w');
  const [level, setLevel] = useState(3);
  const selectedBot = botById(level);
  const saved = readSavedSession();
  const start = () => {
    const session = newSession(mode, humanColor, level);
    saveSession(session);
    navigate(gameRoute(session));
  };

  return <section className="setup-page">
    <div className="page-heading">
      <p className="eyebrow"><span className="eyebrow-rule" />{t('setup.kicker')}</p>
      <h1>{t('setup.title')}</h1>
      <p>{t('setup.intro')}</p>
    </div>
    <div className="setup-layout">
      <div className="setup-main">
        <section className="setup-section">
          <h2>{t('setup.mode')}</h2>
          <div className="mode-grid">
            <button type="button" aria-pressed={mode === 'bot'} className={`mode-card${mode === 'bot' ? ' is-selected' : ''}`} onClick={() => setMode('bot')}>
              <Bot size={19} aria-hidden="true" /><span><strong>{t('setup.bot')}</strong><small>{t('setup.botDetail')}</small></span>
            </button>
            <button type="button" aria-pressed={mode === 'local'} className={`mode-card${mode === 'local' ? ' is-selected' : ''}`} onClick={() => setMode('local')}>
              <Users size={19} aria-hidden="true" /><span><strong>{t('setup.local')}</strong><small>{t('setup.localDetail')}</small></span>
            </button>
          </div>
        </section>
        {mode === 'bot' && <section className="setup-section">
          <div className="setup-section__heading"><h2>{t('setup.level')}</h2><span>{t('setup.levelCount', { count: BOTS.length })}</span></div>
          <div className="level-grid" role="group" aria-label={t('setup.level')}>
            {BOTS.map((bot) => <button key={bot.id} type="button" aria-pressed={level === bot.id} className={`level-card${level === bot.id ? ' is-selected' : ''}`} onClick={() => setLevel(bot.id)}>
              <span className="level-card__number">0{bot.id}</span><strong>{t(`bots.${bot.key}.name`)}</strong>
            </button>)}
          </div>
          <p className="level-description">{t(`bots.${selectedBot.key}.description`)}</p>
        </section>}
        {mode === 'bot' && <section className="setup-section">
          <h2>{t('setup.side')}</h2>
          <div className="side-grid" role="group" aria-label={t('setup.side')}>
            {(['w', 'b'] as const).map((color) => <button key={color} type="button" aria-pressed={humanColor === color} className={`side-card${humanColor === color ? ' is-selected' : ''}`} onClick={() => setHumanColor(color)}>
              <PieceSeal piece={{ color, type: 'general', promoted: false }} />{t(`colors.${color}`)}
            </button>)}
          </div>
        </section>}
        {mode === 'local' && <div className="setup-note"><Users size={17} aria-hidden="true" /><p>{t('setup.localNote')}</p></div>}
        <Button size="lg" className="setup-start" onClick={start}>{t('setup.start')}<ArrowRight size={17} aria-hidden="true" /></Button>
      </div>
      <aside className="setup-side-note">
        <span className="note-stamp">19</span>
        <p className="eyebrow">{t('brand.edition')}</p>
        <h2>{t('setup.tutorial')}</h2>
        <p>{t('home.profile')}</p>
        {saved && <button className="resume-link" type="button" onClick={() => navigate(gameRoute(saved))}>{t('home.resume')}<ArrowRight size={15} aria-hidden="true" /></button>}
      </aside>
    </div>
  </section>;
}
