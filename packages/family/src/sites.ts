/**
 * Where each family site lives, read from that game's own config at build time.
 *
 * Node-only: a site's vite.config.ts imports this file by relative path (Vite bundles relative imports of
 * a config but not workspace packages) and injects the result as `__FAMILY__`. Browser code never imports
 * it, because `site.config.ts` reads `process.env`.
 */
import { PRODUCT as MAKRUK } from '../../../apps/makruk/web/product.config';
import { SITE_URL as MAKRUK_URL } from '../../../apps/makruk/web/site.config';
import { PRODUCT as SITTUYIN } from '../../../apps/sittuyin/web/product.config';
import { SITE_URL as SITTUYIN_URL } from '../../../apps/sittuyin/web/site.config';
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
};

/** Every declared language of every family site, for checking that each game has a name in it. */
export const SITE_LANGUAGES: readonly string[] = [...new Set(Object.values(SITES).flatMap((site) => site.locales))];

/** The sibling games a site links to: every family game except itself. */
export function familyLinks(current: GameId): FamilyLink[] {
  return GAMES.filter((game) => game.id !== current).map((game) => ({ id: game.id, names: game.names, ...SITES[game.id] }));
}
