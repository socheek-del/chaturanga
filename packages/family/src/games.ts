/** Every language any family site declares. A new site language adds a name for every game here. */
export type FamilyLanguage = 'th' | 'my' | 'zh-Hans' | 'ja' | 'ko' | 'en';

export type GameId = 'makruk' | 'sittuyin' | 'xiangqi' | 'shogi' | 'chess' | 'janggi' | 'threechess';

export interface FamilyGame {
  id: GameId;
  /** The game's name as a speaker of each family language would look for it. */
  names: Readonly<Record<FamilyLanguage, string>>;
}

export const GAMES: readonly FamilyGame[] = [
  {
    id: 'makruk',
    names: { th: 'หมากรุกไทย', my: 'ထိုင်းစစ်တုရင်', 'zh-Hans': '泰国象棋', ja: 'タイ将棋', ko: '막룩 (태국 장기)', en: 'Makruk (Thai chess)' },
  },
  {
    id: 'sittuyin',
    names: { th: 'หมากรุกพม่า', my: 'စစ်တုရင်', 'zh-Hans': '缅甸象棋', ja: 'シットゥイン', ko: '싯투인 (미얀마 장기)', en: 'Sittuyin (Burmese chess)' },
  },
  {
    id: 'xiangqi',
    names: { th: 'หมากรุกจีน', my: 'တရုတ်စစ်တုရင်', 'zh-Hans': '中国象棋', ja: 'シャンチー', ko: '샹치 (중국 장기)', en: 'Xiangqi (Chinese chess)' },
  },
  {
    id: 'shogi',
    names: { th: 'หมากรุกญี่ปุ่น', my: 'ဂျပန်စစ်တုရင်', 'zh-Hans': '日本将棋', ja: '将棋', ko: '쇼기 (일본 장기)', en: 'Shogi (Japanese chess)' },
  },
  {
    id: 'chess',
    names: { th: 'หมากรุกสากล', my: 'နိုင်ငံတကာစစ်တုရင်', 'zh-Hans': '国际象棋', ja: 'チェス', ko: '체스', en: 'Chess' },
  },
  {
    id: 'janggi',
    names: { th: 'หมากรุกเกาหลี', my: 'ကိုရီးယားစစ်တုရင်', 'zh-Hans': '朝鲜象棋', ja: 'チャンギ', ko: '장기', en: 'Janggi (Korean chess)' },
  },
  {
    id: 'threechess',
    names: { th: 'หมากรุกสามคน', my: 'စစ်တုရင် သုံးယောက်', 'zh-Hans': '三人国际象棋', ja: '三人チェス', ko: '삼인 체스', en: 'Three-player chess' },
  },
];
