/** Read only this product's address; leave it unset for local and staged builds without a public domain. */
export const SITE_URL = (process.env.CHU_SHOGI_SITE_URL ?? '').replace(/\/+$/, '');
