import { describeLessons } from '@chaturanga/game-shell/testing';
import { chuShogiVariant, PIECE_TYPES } from '@chaturanga/chu-shogi';
import { describe, expect, it } from 'vitest';
import { PRODUCT } from '../../product.config';
import { ALL_LESSONS, ATLAS_COVERAGE, RULE_LESSONS } from './lessons';
import { PROMOTION_GUIDE, RANK_GUIDE } from './pieceAtlas';

describeLessons(PRODUCT, chuShogiVariant, ALL_LESSONS);

describe('Chu Shogi tutorial and atlas coverage', () => {
  it('teaches every selected rule area', () => {
    for (const [topic, lessonId] of Object.entries(RULE_LESSONS)) {
      expect(ALL_LESSONS.some((lesson) => lesson.id === lessonId), topic).toBe(true);
    }
  });

  it('lists all 29 movement ranks and 18 promotions', () => {
    expect(RANK_GUIDE).toHaveLength(29);
    expect(PROMOTION_GUIDE).toHaveLength(18);
    expect(ATLAS_COVERAGE).toMatchObject({ distinctRanks: 29, promotionChanges: 18, startingPieceTypes: PIECE_TYPES.length });
    expect(new Set(RANK_GUIDE.map(({ id }) => id)).size).toBe(29);
    for (const type of PIECE_TYPES) expect(RANK_GUIDE.some((rank) => rank.type === type && !rank.promoted), type).toBe(true);
    for (const promotion of PROMOTION_GUIDE) {
      expect(PIECE_TYPES, promotion.from).toContain(promotion.from);
      expect(RANK_GUIDE.some((rank) => rank.id === promotion.to || (rank.type === promotion.to && !rank.promoted)), promotion.to).toBe(true);
    }
  });
});
