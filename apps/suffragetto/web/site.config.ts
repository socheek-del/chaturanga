/** Suffragetto address. Override with SUFFRAGETTO_SITE_URL when a deployment uses another host. */
export const SITE_URL = (process.env.SUFFRAGETTO_SITE_URL ?? 'https://suffragetto.beanroti.com').replace(
  /\/+$/,
  '',
);
