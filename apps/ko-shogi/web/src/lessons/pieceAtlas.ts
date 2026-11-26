import { BASE_PIECE_TYPES, PROMOTION_OF, type PieceType } from '@chaturanga/ko-shogi';

export interface AtlasForm { id: string; type: PieceType; promoted: boolean; from?: PieceType }

export const PIECE_SEALS = {
  general: 'GE', clerk: 'CL', 'staff-officer': 'SO', 'aide-de-camp': 'AC', sumo: 'SW', aide: 'AI', staff: 'ST',
  'chief-of-staff': 'CS', engineer: 'EG', 'taoist-priest': 'TP', 'spiritual-monk': 'SM', 'advance-guard': 'AG',
  'middle-troop': 'MT', drum: 'DR', banner: 'BA', sentry: 'SE', millenary: 'MI', quartermaster: 'QM', centuria: 'CE',
  'rear-guard': 'RG', 'frankish-cannon': 'FC', elephant: 'EL', longbow: 'LB', crossbow: 'XB', cannon: 'CA',
  cavalryman: 'CM', cavalry: 'CV', pawn: 'PA', 'patrol-unit': 'PU', shield: 'SH', 'shield-unit': 'HU', chariot: 'CH',
  'chariot-unit': 'CU', vanguard: 'VA', 'master-at-arms': 'MA', 'banner-and-drum': 'BD', 'town-brigade': 'TB',
  'village-brigade': 'VB', 'vice-commander': 'VC', 'poison-flame': 'PF', 'five-li-fog': 'FF', 'immaculate-light': 'IL',
  'skyward-net': 'SN', governor: 'GO', thunderclap: 'TC', 'flag-waver': 'FW', 'dragon-ascending': 'DA',
  'tiger-wing': 'TW', 'war-hawk': 'WK', 'earthward-net': 'EW', 'chariot-of-the-gods': 'CG',
  'longbow-cavalryman': 'LC', 'crossbow-cavalryman': 'XC', 'gun-carriage': 'GC', 'winged-horse': 'WG',
  commissar: 'CO', 'heavenly-fortress': 'HF',
} satisfies Readonly<Record<PieceType, string>>;

export const PIECE_ORDER: readonly PieceType[] = [
  'general', 'clerk', 'staff-officer', 'aide-de-camp', 'sumo', 'aide', 'staff', 'chief-of-staff', 'engineer',
  'taoist-priest', 'spiritual-monk', 'advance-guard', 'middle-troop', 'drum', 'banner', 'sentry', 'millenary',
  'quartermaster', 'centuria', 'rear-guard', 'frankish-cannon', 'elephant', 'longbow', 'crossbow', 'cannon',
  'cavalryman', 'cavalry', 'pawn', 'patrol-unit', 'shield', 'shield-unit', 'chariot', 'chariot-unit', 'vanguard',
  'master-at-arms', 'banner-and-drum', 'town-brigade', 'village-brigade', 'vice-commander', 'poison-flame',
  'five-li-fog', 'immaculate-light', 'skyward-net', 'governor', 'thunderclap', 'flag-waver', 'dragon-ascending',
  'tiger-wing', 'war-hawk', 'earthward-net', 'chariot-of-the-gods', 'longbow-cavalryman', 'crossbow-cavalryman',
  'gun-carriage', 'winged-horse', 'commissar', 'heavenly-fortress',
];

export const STARTING_FORM_COUNT = 34;

export const ATLAS_FORMS: readonly AtlasForm[] = [
  ...BASE_PIECE_TYPES.map((type) => ({ id: `base:${type}`, type, promoted: false })),
  ...Object.entries(PROMOTION_OF).map(([from, type]) => ({
    id: `promotion:${from}:${type}`,
    type: type!,
    promoted: true,
    from: from as PieceType,
  })),
];

export const RULE_COVERAGE = {
  opening: 'opening',
  orientation: 'orientation',
  movement: 'movement',
  compoundRoutes: 'compound-routes',
  moveBeforeShot: 'move-before-shot',
  shotRangeAndImmunity: 'shot-range-immunity',
  cannonScreen: 'cannon-screen',
  optionalCampPromotion: 'camp-promotion',
  automaticCapturePromotion: 'capture-promotion',
  bannerDrumAndPriests: 'banner-drum-priests',
  poisonFlame: 'poison-flame',
  fogSuppression: 'fog-suppression',
  immaculateLight: 'immaculate-light',
  nets: 'nets',
  command: 'command-objective',
  noMoveLoss: 'no-move-loss',
  drawAndPerpetualCheck: 'repetition-perpetual-check',
  illegalMoveHandling: 'illegal-move-handling',
} as const;
