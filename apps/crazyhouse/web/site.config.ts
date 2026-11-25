/** Crazyhouse address. Override with CRAZYHOUSE_SITE_URL when a deployment uses another host. */
export const SITE_URL = (process.env.CRAZYHOUSE_SITE_URL ?? 'https://crazyhouse.beanroti.com').replace(
  /\/+$/,
  '',
);
