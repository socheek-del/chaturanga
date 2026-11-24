/** The default address for this product. Override per environment. */
export const SITE_URL = (process.env.SHATAR_SITE_URL ?? 'https://shatar.beanroti.com').replace(/\/+$/, '');
