/** Address setting for the Senterej product; override with this product's own environment variable. */
export const SITE_URL = (process.env.SENTEREJ_SITE_URL ?? 'https://senterej.beanroti.com').replace(/\/+$/, '');
