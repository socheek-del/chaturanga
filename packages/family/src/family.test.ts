import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { PRODUCT as JANGGI } from '../../../apps/janggi/web/product.config';
import { SITE_URL as JANGGI_URL } from '../../../apps/janggi/web/site.config';
import { PRODUCT as MAKRUK } from '../../../apps/makruk/web/product.config';
import { SITE_URL as MAKRUK_URL } from '../../../apps/makruk/web/site.config';
import { PRODUCT as SITTUYIN } from '../../../apps/sittuyin/web/product.config';
import { SITE_URL as SITTUYIN_URL } from '../../../apps/sittuyin/web/site.config';
import { PRODUCT as SENTEREJ } from '../../../apps/senterej/web/product.config';
import { SITE_URL as SENTEREJ_URL } from '../../../apps/senterej/web/site.config';
import { PRODUCT as XIANGQI } from '../../../apps/xiangqi/web/product.config';
import { SITE_URL as XIANGQI_URL } from '../../../apps/xiangqi/web/site.config';
import { GAMES } from './games';
import { familyLinks, SITE_LANGUAGES, SITES } from './sites';

describe('family (plat-006, plat-010)', () => {
  it('collects every language any family site declares, and names every game in each of them', () => {
    const declared = new Set(Object.values(SITES).flatMap((site) => site.locales));
    expect([...SITE_LANGUAGES].sort()).toEqual([...declared].sort());
    for (const game of GAMES) {
      for (const language of SITE_LANGUAGES) {
        expect((game.names as Record<string, string>)[language]?.trim(), `${game.id} in ${language}`).toBeTruthy();
      }
    }
  });

  it('has a site for every game and a game for every site', () => {
    expect(Object.keys(SITES).sort()).toEqual(GAMES.map((game) => game.id).sort());
  });

  it('publishes only products whose destinations are live', () => {
    expect(GAMES.filter((game) => game.published).map((game) => game.id)).toEqual([
      'makruk', 'sittuyin', 'xiangqi', 'shogi', 'chess', 'janggi', 'threechess',
    ]);
    for (const game of GAMES.filter((candidate) => !candidate.published)) {
      expect(familyLinks('makruk').some((link) => link.id === game.id)).toBe(false);
    }
  });

  it('reads each site from its own product.config and site.config', () => {
    // One line per game: the only part of this file a new game adds to.
    expect(SITES.makruk).toEqual({ url: MAKRUK_URL, locales: MAKRUK.locales, defaultLocale: MAKRUK.defaultLocale });
    expect(SITES.sittuyin).toEqual({ url: SITTUYIN_URL, locales: SITTUYIN.locales, defaultLocale: SITTUYIN.defaultLocale });
    expect(SITES.xiangqi).toEqual({ url: XIANGQI_URL, locales: XIANGQI.locales, defaultLocale: XIANGQI.defaultLocale });
    expect(SITES.janggi).toEqual({ url: JANGGI_URL, locales: JANGGI.locales, defaultLocale: JANGGI.defaultLocale });
    expect(SITES.senterej).toEqual({ url: SENTEREJ_URL, locales: SENTEREJ.locales, defaultLocale: SENTEREJ.defaultLocale });
  });

  it('links to every released sibling and never to itself', () => {
    for (const game of GAMES) {
      const links = familyLinks(game.id);
      expect(links.map((link) => link.id).sort()).toEqual(
        GAMES.filter((other) => other.published && other.id !== game.id)
          .map((other) => other.id)
          .sort(),
      );
      for (const link of links) {
        const sibling = GAMES.find((other) => other.id === link.id)!;
        expect(link).toEqual({ id: sibling.id, names: sibling.names, ...SITES[sibling.id] });
      }
    }
  });

  it('never hardcodes an address', () => {
    const dir = import.meta.dirname;
    for (const file of readdirSync(dir).filter((name) => !name.endsWith('.test.ts'))) {
      expect(readFileSync(path.join(dir, file), 'utf8'), file).not.toMatch(/https?:\/\//);
    }
  });
});
