import { resolveLocale } from '@chaturanga/game-shell';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router';
import { PRODUCT } from '../../../product.config';
import { applySeo, pageSeo } from './seo';

/** Keeps the document title, description, canonical URL and hreflang links in sync with the page and language. */
export function SeoController() {
  const { pathname } = useLocation();
  const { t, i18n } = useTranslation();
  const language = resolveLocale(PRODUCT, i18n.language);

  useEffect(() => {
    const seo = pageSeo(pathname);
    applySeo(seo, language, t(`seo.${seo.page}.title`), t(`seo.${seo.page}.description`));
  }, [pathname, language, t]);

  return null;
}
