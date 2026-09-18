/**
 * Public address of the Shogi site — the single place to change when the domain changes.
 *
 * The subdomain follows the family's pattern (sg-008, decision D8); parent domains are temporary.
 * Override without editing: `SHOGI_SITE_URL=https://example.com npm run build`. The variable is named
 * after the product because sibling sites read this file too, to link here (plat-006, packages/family).
 * When moving domains also update `routes` in apps/shogi/worker/wrangler.jsonc.
 */
export const SITE_URL = (process.env.SHOGI_SITE_URL ?? 'https://jp-chess.beanroti.com').replace(/\/+$/, '');
