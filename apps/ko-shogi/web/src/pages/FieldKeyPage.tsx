import { PROMOTION_OF } from '@chaturanga/ko-shogi';
import { ArrowLeft, ArrowUpRight, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { PieceSeal } from '../components/PieceSeal';
import { ATLAS_FORMS } from '../lessons/pieceAtlas';

type Filter = 'all' | 'starting' | 'promoted';

export function FieldKeyPage() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const forms = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return ATLAS_FORMS.filter((form) => {
      if (filter === 'starting' && form.promoted) return false;
      if (filter === 'promoted' && !form.promoted) return false;
      if (!needle) return true;
      const strings = [
        t(`pieces.${form.type}.name`),
        t(`pieces.${form.type}.move`),
        form.from ? t(`pieces.${form.from}.name`) : '',
      ];
      return strings.some((value) => value.toLocaleLowerCase().includes(needle));
    });
  }, [filter, query, t]);

  return <section className="atlas-page">
    <div className="page-heading atlas-page__heading">
      <p className="eyebrow"><span className="eyebrow-rule" />{t('atlas.kicker')}</p>
      <div className="atlas-title-row"><div><h1>{t('atlas.title')}</h1><p>{t('atlas.intro')}</p></div><Link className="text-link" to="/play"><ArrowLeft size={15} aria-hidden="true" />{t('atlas.back')}</Link></div>
    </div>
    <div className="atlas-toolbar">
      <label className="atlas-search"><Search size={17} aria-hidden="true" /><span className="sr-only">{t('atlas.search')}</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('atlas.search')} /></label>
      <div className="atlas-filters" role="group" aria-label={t('atlas.filterLabel')}>
        {(['all', 'starting', 'promoted'] as const).map((value) => <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)}>{t(`atlas.filter.${value}`)}</button>)}
      </div>
      <span className="atlas-count">{t('atlas.count', { count: forms.length })}</span>
    </div>
    {forms.length ? <div className="form-grid">
      {forms.map((form, index) => {
        const name = t(`pieces.${form.type}.name`);
        const next = !form.promoted ? PROMOTION_OF[form.type] : undefined;
        return <article key={form.id} className={`form-card${form.promoted ? ' form-card--promoted' : ''}`}>
          <div className="form-card__top"><span className="form-number">{String(index + 1).padStart(2, '0')}</span><span className={`form-tag${form.promoted ? ' form-tag--promoted' : ''}`}>{t(form.promoted ? 'atlas.promoted' : 'atlas.starting')}</span></div>
          <div className="form-card__identity"><PieceSeal piece={{ color: 'w', type: form.type, promoted: form.promoted }} className="form-card__seal" /><div><h2>{name}</h2>{form.from && <p>{t('atlas.promotedFrom', { piece: t(`pieces.${form.from}.name`) })}</p>}</div></div>
          <p className="form-card__movement">{t(`pieces.${form.type}.move`)}</p>
          {next ? <p className="form-card__promotion"><ArrowUpRight size={14} aria-hidden="true" />{t('atlas.promotion', { piece: t(`pieces.${next}.name`) })}</p> : <p className="form-card__promotion is-muted">{t('atlas.noPromotion')}</p>}
        </article>;
      })}
    </div> : <div className="empty-state"><p>{t('atlas.noResults')}</p></div>}
  </section>;
}
