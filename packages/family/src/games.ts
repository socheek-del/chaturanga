/** Every language any family site declares. A new site language adds a name for every game here. */
export type FamilyLanguage = 'th' | 'my' | 'zh-Hans' | 'en';

export type GameId = 'makruk' | 'sittuyin' | 'xiangqi';

export interface FamilyGame {
  id: GameId;
  /** The game's name as a speaker of each family language would look for it. */
  names: Readonly<Record<FamilyLanguage, string>>;
}

export const GAMES: readonly FamilyGame[] = [
  {
    id: 'makruk',
    names: { th: 'หมากรุกไทย', my: 'ထိုင်းစစ်တုရင်', 'zh-Hans': '泰国象棋', en: 'Makruk (Thai chess)' },
  },
  {
    id: 'sittuyin',
    names: { th: 'หมากรุกพม่า', my: 'စစ်တုရင်', 'zh-Hans': '缅甸象棋', en: 'Sittuyin (Burmese chess)' },
  },
  {
    id: 'xiangqi',
    names: { th: 'หมากรุกจีน', my: 'တရုတ်စစ်တုရင်', 'zh-Hans': '中国象棋', en: 'Xiangqi (Chinese chess)' },
  },
];
