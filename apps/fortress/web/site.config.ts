/** The only default site address for Russian Four-Handed Fortress Chess. */
export const SITE_URL = (process.env.FORTRESS_SITE_URL ?? 'https://fortress.beanroti.com').replace(
  /\/+$/,
  '',
);
