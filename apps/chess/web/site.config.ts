/**
 * Public address of the chess site — the single place to change when the domain changes.
 *
 * The subdomain was chosen by the owner in ch-008 (decision D8); parent domains are temporary.
 * Override without editing: `CHESS_SITE_URL=https://example.com npm run build`. The variable is named
 * after the product because sibling sites read this file too, to link here (plat-006, packages/family).
 * When moving domains also update `routes` in apps/chess/worker/wrangler.jsonc.
 */
export const SITE_URL = (process.env.CHESS_SITE_URL ?? 'https://chess.beanroti.com').replace(/\/+$/, '');
