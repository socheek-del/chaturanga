/** Every language any family site declares. A new site language adds a name for every game here. */
export type FamilyLanguage = 'th' | 'my' | 'zh-Hans' | 'ja' | 'en';

export type GameId = 'makruk' | 'sittuyin' | 'xiangqi' | 'shogi';

export interface FamilyGame {
  id: GameId;
  /** The game's name as a speaker of each family language would look for it. */
  names: Readonly<Record<FamilyLanguage, string>>;
}

export const GAMES: readonly FamilyGame[] = [
  {
    id: 'makruk',
    names: { th: 'หมากรุกไทย', my: 'ထိုင်းစစ်တုရင်', 'zh-Hans': '泰国象棋', ja: 'タイ将棋', en: 'Makruk (Thai chess)' },
  },
  {
    id: 'sittuyin',
    names: { th: 'หมากรุกพม่า', my: 'စစ်တုရင်', 'zh-Hans': '缅甸象棋', ja: 'シットゥイン', en: 'Sittuyin (Burmese chess)' },
  },
  {
    id: 'xiangqi',
    names: { th: 'หมากรุกจีน', my: 'တရုတ်စစ်တုရင်', 'zh-Hans': '中国象棋', ja: 'シャンチー', en: 'Xiangqi (Chinese chess)' },
  },
  {
    id: 'shogi',
    names: { th: 'หมากรุกญี่ปุ่น', my: 'ဂျပန်စစ်တုရင်', 'zh-Hans': '日本将棋', ja: '将棋', en: 'Shogi (Japanese chess)' },
  },
];
