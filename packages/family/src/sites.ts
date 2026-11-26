/**
 * Where each family site lives, read from that game's own config at build time.
 *
 * Node-only: a site's vite.config.ts imports this file by relative path (Vite bundles relative imports of
 * a config but not workspace packages) and injects the result as `__FAMILY__`. Browser code never imports
 * it, because `site.config.ts` reads `process.env`.
 */
import { PRODUCT as CHESS } from '../../../apps/chess/web/product.config';
import { SITE_URL as CHESS_URL } from '../../../apps/chess/web/site.config';
import { PRODUCT as JANGGI } from '../../../apps/janggi/web/product.config';
import { SITE_URL as JANGGI_URL } from '../../../apps/janggi/web/site.config';
import { PRODUCT as THREECHESS } from '../../../apps/threechess/web/product.config';
import { SITE_URL as THREECHESS_URL } from '../../../apps/threechess/web/site.config';
import { PRODUCT as MAKRUK } from '../../../apps/makruk/web/product.config';
import { SITE_URL as MAKRUK_URL } from '../../../apps/makruk/web/site.config';
import { PRODUCT as SHOGI } from '../../../apps/shogi/web/product.config';
import { SITE_URL as SHOGI_URL } from '../../../apps/shogi/web/site.config';
import { PRODUCT as SITTUYIN } from '../../../apps/sittuyin/web/product.config';
import { SITE_URL as SITTUYIN_URL } from '../../../apps/sittuyin/web/site.config';
import { PRODUCT as XIANGQI } from '../../../apps/xiangqi/web/product.config';
import { SITE_URL as XIANGQI_URL } from '../../../apps/xiangqi/web/site.config';
import { PRODUCT as HIASHATAR } from '../../../apps/hiashatar/web/product.config';
import { SITE_URL as HIASHATAR_URL } from '../../../apps/hiashatar/web/site.config';
import { PRODUCT as FOURCHESS } from '../../../apps/fourchess/web/product.config';
import { SITE_URL as FOURCHESS_URL } from '../../../apps/fourchess/web/site.config';
import { PRODUCT as CHATURAJI } from '../../../apps/chaturaji/web/product.config';
import { SITE_URL as CHATURAJI_URL } from '../../../apps/chaturaji/web/site.config';
import { PRODUCT as SENTEREJ } from '../../../apps/senterej/web/product.config';
import { SITE_URL as SENTEREJ_URL } from '../../../apps/senterej/web/site.config';
import { PRODUCT as INFINITE_CHESS } from '../../../apps/infinite-chess/web/product.config';
import { SITE_URL as INFINITE_CHESS_URL } from '../../../apps/infinite-chess/web/site.config';
import { type GameId, GAMES } from './games';

/** A link from one site to a sibling, with what the linking site needs to pick the right language. */
export interface FamilyLink {
  id: GameId;
  names: Readonly<Record<string, string>>;
  /** The sibling's address, without a trailing slash. */
  url: string;
  locales: readonly string[];
  defaultLocale: string;
}

/** Each game's own site settings, read from its product.config and site.config. */
export const SITES: Readonly<Record<GameId, { url: string; locales: readonly string[]; defaultLocale: string }>> = {
  makruk: { url: MAKRUK_URL, locales: MAKRUK.locales, defaultLocale: MAKRUK.defaultLocale },
  sittuyin: { url: SITTUYIN_URL, locales: SITTUYIN.locales, defaultLocale: SITTUYIN.defaultLocale },
  xiangqi: { url: XIANGQI_URL, locales: XIANGQI.locales, defaultLocale: XIANGQI.defaultLocale },
  shogi: { url: SHOGI_URL, locales: SHOGI.locales, defaultLocale: SHOGI.defaultLocale },
  chess: { url: CHESS_URL, locales: CHESS.locales, defaultLocale: CHESS.defaultLocale },
  janggi: { url: JANGGI_URL, locales: JANGGI.locales, defaultLocale: JANGGI.defaultLocale },
  threechess: { url: THREECHESS_URL, locales: THREECHESS.locales, defaultLocale: THREECHESS.defaultLocale },
  hiashatar: { url: HIASHATAR_URL, locales: HIASHATAR.locales, defaultLocale: HIASHATAR.defaultLocale },
  fourchess: { url: FOURCHESS_URL, locales: FOURCHESS.locales, defaultLocale: FOURCHESS.defaultLocale },
  chaturaji: { url: CHATURAJI_URL, locales: CHATURAJI.locales, defaultLocale: CHATURAJI.defaultLocale },
  senterej: { url: SENTEREJ_URL, locales: SENTEREJ.locales, defaultLocale: SENTEREJ.defaultLocale },
  'infinite-chess': { url: INFINITE_CHESS_URL, locales: INFINITE_CHESS.locales, defaultLocale: INFINITE_CHESS.defaultLocale },
};

/** Every declared language of every family site, for checking that each game has a name in it. */
export const SITE_LANGUAGES: readonly string[] = [...new Set(Object.values(SITES).flatMap((site) => site.locales))];

/** The sibling games a site links to: every family game except itself. */
export function familyLinks(current: string): FamilyLink[] {
  return GAMES.filter((game) => game.published && game.id !== current).map(({ id, names }) => ({ id, names, ...SITES[id] }));
}
