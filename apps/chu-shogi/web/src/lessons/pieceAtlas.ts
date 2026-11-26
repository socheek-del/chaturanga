import type { PieceType } from '@chaturanga/chu-shogi';

export interface RankGuide {
  id: string;
  abbreviation: string;
  type: PieceType;
  promoted: boolean;
  nameKey: string;
  movementKey: string;
}

/** The 29 distinct movement ranks used by this rules profile. Some promotions become an existing rank. */
export const RANK_GUIDE: readonly RankGuide[] = [
  { id: 'king', abbreviation: 'KI', type: 'king', promoted: false, nameKey: 'king', movementKey: 'king' },
  { id: 'lion', abbreviation: 'LI', type: 'lion', promoted: false, nameKey: 'lion', movementKey: 'lion' },
  { id: 'free-king', abbreviation: 'FK', type: 'free-king', promoted: false, nameKey: 'freeKing', movementKey: 'freeKing' },
  { id: 'drunk-elephant', abbreviation: 'DE', type: 'drunk-elephant', promoted: false, nameKey: 'drunkElephant', movementKey: 'drunkElephant' },
  { id: 'kirin', abbreviation: 'KR', type: 'kirin', promoted: false, nameKey: 'kirin', movementKey: 'kirin' },
  { id: 'phoenix', abbreviation: 'PH', type: 'phoenix', promoted: false, nameKey: 'phoenix', movementKey: 'phoenix' },
  { id: 'rook', abbreviation: 'RO', type: 'rook', promoted: false, nameKey: 'rook', movementKey: 'rook' },
  { id: 'bishop', abbreviation: 'BI', type: 'bishop', promoted: false, nameKey: 'bishop', movementKey: 'bishop' },
  { id: 'dragon-king', abbreviation: 'DK', type: 'dragon-king', promoted: false, nameKey: 'dragonKing', movementKey: 'dragonKing' },
  { id: 'dragon-horse', abbreviation: 'DH', type: 'dragon-horse', promoted: false, nameKey: 'dragonHorse', movementKey: 'dragonHorse' },
  { id: 'vertical-mover', abbreviation: 'VM', type: 'vertical-mover', promoted: false, nameKey: 'verticalMover', movementKey: 'verticalMover' },
  { id: 'side-mover', abbreviation: 'SM', type: 'side-mover', promoted: false, nameKey: 'sideMover', movementKey: 'sideMover' },
  { id: 'reverse-chariot', abbreviation: 'RC', type: 'reverse-chariot', promoted: false, nameKey: 'reverseChariot', movementKey: 'reverseChariot' },
  { id: 'lance', abbreviation: 'LA', type: 'lance', promoted: false, nameKey: 'lance', movementKey: 'lance' },
  { id: 'blind-tiger', abbreviation: 'BT', type: 'blind-tiger', promoted: false, nameKey: 'blindTiger', movementKey: 'blindTiger' },
  { id: 'ferocious-leopard', abbreviation: 'FL', type: 'ferocious-leopard', promoted: false, nameKey: 'ferociousLeopard', movementKey: 'ferociousLeopard' },
  { id: 'gold-general', abbreviation: 'GG', type: 'gold-general', promoted: false, nameKey: 'goldGeneral', movementKey: 'goldGeneral' },
  { id: 'silver-general', abbreviation: 'SG', type: 'silver-general', promoted: false, nameKey: 'silverGeneral', movementKey: 'silverGeneral' },
  { id: 'copper-general', abbreviation: 'CG', type: 'copper-general', promoted: false, nameKey: 'copperGeneral', movementKey: 'copperGeneral' },
  { id: 'go-between', abbreviation: 'GB', type: 'go-between', promoted: false, nameKey: 'goBetween', movementKey: 'goBetween' },
  { id: 'pawn', abbreviation: 'PA', type: 'pawn', promoted: false, nameKey: 'pawn', movementKey: 'pawn' },
  { id: 'prince', abbreviation: 'PR', type: 'drunk-elephant', promoted: true, nameKey: 'prince', movementKey: 'king' },
  { id: 'soaring-eagle', abbreviation: 'SE', type: 'dragon-king', promoted: true, nameKey: 'soaringEagle', movementKey: 'soaringEagle' },
  { id: 'horned-falcon', abbreviation: 'HF', type: 'dragon-horse', promoted: true, nameKey: 'hornedFalcon', movementKey: 'hornedFalcon' },
  { id: 'flying-ox', abbreviation: 'FO', type: 'vertical-mover', promoted: true, nameKey: 'flyingOx', movementKey: 'flyingOx' },
  { id: 'free-boar', abbreviation: 'FB', type: 'side-mover', promoted: true, nameKey: 'freeBoar', movementKey: 'freeBoar' },
  { id: 'whale', abbreviation: 'WL', type: 'reverse-chariot', promoted: true, nameKey: 'whale', movementKey: 'whale' },
  { id: 'white-horse', abbreviation: 'WH', type: 'lance', promoted: true, nameKey: 'whiteHorse', movementKey: 'whiteHorse' },
  { id: 'flying-stag', abbreviation: 'FS', type: 'blind-tiger', promoted: true, nameKey: 'flyingStag', movementKey: 'flyingStag' },
];

/** Every promotable base rank and the movement rank its promoted face becomes. */
export const PROMOTION_GUIDE: ReadonlyArray<{ from: PieceType; to: string }> = [
  { from: 'drunk-elephant', to: 'prince' },
  { from: 'kirin', to: 'lion' },
  { from: 'phoenix', to: 'free-king' },
  { from: 'rook', to: 'dragon-king' },
  { from: 'bishop', to: 'dragon-horse' },
  { from: 'dragon-king', to: 'soaring-eagle' },
  { from: 'dragon-horse', to: 'horned-falcon' },
  { from: 'vertical-mover', to: 'flying-ox' },
  { from: 'side-mover', to: 'free-boar' },
  { from: 'reverse-chariot', to: 'whale' },
  { from: 'lance', to: 'white-horse' },
  { from: 'blind-tiger', to: 'flying-stag' },
  { from: 'ferocious-leopard', to: 'bishop' },
  { from: 'gold-general', to: 'rook' },
  { from: 'silver-general', to: 'vertical-mover' },
  { from: 'copper-general', to: 'side-mover' },
  { from: 'go-between', to: 'drunk-elephant' },
  { from: 'pawn', to: 'gold-general' },
];

const byKey = new Map(RANK_GUIDE.map((rank) => [`${rank.type}:${rank.promoted}`, rank]));

export function rankForPiece(type: string, promoted: boolean): RankGuide | undefined {
  return byKey.get(`${type}:${promoted}`);
}
