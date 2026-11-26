import type { Candidate } from '@chaturanga/ko-shogi';
import { squareName } from '@chaturanga/ko-shogi';
import { useTranslation } from 'react-i18next';

interface RouteOption {
  route: string[];
  actions: Candidate[];
}

function routeOf(candidate: Candidate): string[] {
  return [candidate.from, ...candidate.path].map(squareName);
}

function shotTargetsOf(uci: string): string[] {
  return uci.split('=')[0]!.split('-').flatMap((segment) => segment.split('@').slice(1));
}

export function ActionPicker({ actions, onChoose, onClose }: {
  actions: readonly Candidate[];
  onChoose: (candidate: Candidate) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const options = new Map<string, RouteOption>();
  for (const candidate of actions) {
    const route = routeOf(candidate);
    const key = route.join('-');
    const current = options.get(key) ?? { route, actions: [] };
    current.actions.push(candidate);
    options.set(key, current);
  }
  const sortedRoutes = [...options.values()].sort((left, right) => left.route.length - right.route.length || left.route.join('-').localeCompare(right.route.join('-')));

  return <div className="action-picker" role="dialog" aria-modal="true" aria-labelledby="action-picker-title">
    <div className="action-picker__backdrop" onClick={onClose} />
    <section className="action-picker__sheet">
      <div className="action-picker__heading">
        <div><p className="eyebrow">{t('actions.route')}</p><h2 id="action-picker-title">{t('actions.chooseRoute')}</h2></div>
        <button type="button" className="icon-button" aria-label={t('common.close')} onClick={onClose}>×</button>
      </div>
      <p className="action-picker__note">{actions.length > 1 ? t('actions.manyRoutes', { count: actions.length }) : t('actions.continue')}</p>
      <div className="action-picker__list">
        {sortedRoutes.map((option) => <fieldset key={option.route.join('-')} className="route-option">
          <legend>{option.route.join(' → ')}</legend>
          {option.actions.length > 1 && <p>{t('actions.continue')}</p>}
          <div className="route-option__choices">
            {option.actions.map((candidate) => {
              const shots = shotTargetsOf(candidate.uci);
              const promotion = candidate.uci.split('=')[1];
              const promotionName = promotion ? t(`pieces.${promotion}.name`) : null;
              return <button key={candidate.uci} type="button" className="route-choice" onClick={() => onChoose(candidate)}>
                <span className="route-choice__main">
                  {shots.length ? <span>{t('actions.shots')}: {shots.join(' · ')}</span> : <span>{t('actions.noShot')}</span>}
                  {promotionName && <span>{t('actions.promotion', { piece: promotionName })}</span>}
                </span>
                {candidate.captures.length > 0 && <small>{t('actions.captures', { count: candidate.captures.length })}</small>}
                <span aria-hidden="true">↗</span>
              </button>;
            })}
          </div>
        </fieldset>)}
      </div>
      <p className="action-picker__format">{t('actions.format')}</p>
    </section>
  </div>;
}
