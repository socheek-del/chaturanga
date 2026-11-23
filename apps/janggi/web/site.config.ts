/**
 * Public address of the Janggi site — the single place to change when the domain changes.
 *
 * The subdomain follows the family pattern (jg-008); parent domains are temporary.
 * Override without editing: `JANGGI_SITE_URL=https://example.com npm run build`. The variable is named
 * after the product because sibling sites read this file too, to link here (plat-006, packages/family).
 * When moving domains also update `routes` in apps/janggi/worker/wrangler.jsonc.
 */
export const SITE_URL = (process.env.JANGGI_SITE_URL ?? 'https://kr-chess.beanroti.com').replace(/\/+$/, '');
