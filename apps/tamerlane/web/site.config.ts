/** The default address for this product. Override per environment. */
export const SITE_URL = (process.env.TAMERLANE_SITE_URL ?? 'https://tamerlane.beanroti.com').replace(/\/+$/, '');
