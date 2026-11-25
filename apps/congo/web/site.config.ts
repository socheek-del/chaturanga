/** Congo address. Override with CONGO_SITE_URL when a deployment uses another host. */
export const SITE_URL = (process.env.CONGO_SITE_URL ?? 'https://congo.beanroti.com').replace(
  /\/+$/,
  '',
);
