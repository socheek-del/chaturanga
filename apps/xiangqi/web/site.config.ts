/**
 * Public address of the Xiangqi site — the single place to change when the domain changes.
 *
 * The owner chose this subdomain on 2026-09-18 (xq-008, decision D8); parent domains are temporary.
 * Override without editing: `XIANGQI_SITE_URL=https://example.com npm run build`. The variable is named
 * after the product because sibling sites read this file too, to link here (plat-006, packages/family).
 * When moving domains also update `routes` in apps/xiangqi/worker/wrangler.jsonc.
 */
export const SITE_URL = (process.env.XIANGQI_SITE_URL ?? 'https://cn-chess.beanroti.com').replace(/\/+$/, '');
