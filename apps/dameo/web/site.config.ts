/** The default address for Dameo; override only with this product's own setting. */
export const SITE_URL = (process.env.DAMEO_SITE_URL ?? 'https://dameo.beanroti.com').replace(/\/+$/, '');
