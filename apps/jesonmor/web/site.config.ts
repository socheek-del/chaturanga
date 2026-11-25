/** Jeson Mor address. Override with JESONMOR_SITE_URL when a deployment uses another host. */
export const SITE_URL = (process.env.JESONMOR_SITE_URL ?? 'https://jesonmor.beanroti.com').replace(
  /\/+$/,
  '',
);
