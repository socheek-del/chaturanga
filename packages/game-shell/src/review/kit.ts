import type { SanResolver, VariantGame } from '@chaturanga/rules-core';
import type { ReviewRules } from './analysis';
import type { AnalysisStore } from './analysisStore';
import type { UciEngine } from './engine';
import type { HistoryStore } from './history';
import type { OpeningBook } from './openings';
import type { BotName } from './savedGame';

/**
 * Everything a product supplies so the shared Games and Review screens work for its game (plat-017): its
 * rules and material, where its games and analyses are stored, how to start its engine, and how its PGN
 * reads and writes.
 */
export interface ReviewKit<G extends VariantGame = VariantGame> {
  rules: ReviewRules<G>;
  history: HistoryStore;
  analysis: AnalysisStore;
  /** A fresh engine, ready to be configured for this game; the screen terminates it when done. */
  createEngine: () => UciEngine;
  /** The product's opening book, loaded on demand; left out when the game has none (no Book label). */
  loadBook?: () => Promise<OpeningBook>;
  pgn: {
    botName: BotName;
    /** Tags every exported game carries, e.g. `{ Variant: 'makruk' }`. */
    tags?: Readonly<Record<string, string>>;
    /** Reads SAN more loosely than the variant writes it; the default matches the variant's own SAN. */
    resolve?: SanResolver<G>;
  };
}
