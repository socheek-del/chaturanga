/** Leave unset for local and private Melon builds until a public hostname has valid DNS and TLS. */
export const SITE_URL = (process.env.KO_SHOGI_SITE_URL ?? '').replace(/\/+$/, '');
