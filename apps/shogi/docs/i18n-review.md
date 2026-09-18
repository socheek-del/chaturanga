# Japanese review (sg-011)

Japanese is the default language of the Shogi site, so the Japanese text must read naturally and use the
words Shogi players actually use. This review must be done by a **native Japanese speaker**, ideally someone
who plays Shogi. The engineering team wrote the current Japanese text; it has not been reviewed.

The kanji on the pieces are drawn as images (owner decision D4: 王 玉 飛 角 金 銀 桂 香 歩 and the promoted
faces 龍 馬 全 圭 杏 と), so they are not part of this text review — but the words used for the pieces in
sentences are.

## What to review

| Area | Where | What to check |
|---|---|---|
| App UI | `apps/shogi/web/src/locales/ja.json` | Natural wording, a consistent friendly tone (です・ます), no English left over |
| Lessons | `apps/shogi/web/src/features/learn/lessons.ts` (`ja:` strings) | Correct rule explanations, beginner-friendly wording, standard terms (成り, 打つ, 二歩, 打ち歩詰め, 千日手) |
| Result reasons | `ja.json` → `play.reason.*` | 詰み, 千日手, 連続王手の千日手 and the stalemate wording match how players say them |
| Sides | `ja.json` → `colors.*` | 先手 / 後手 throughout, never 黒 / 白 |
| Bot personas | `ja.json` → `bots.*` | Names (歩 桂 銀 金 角 飛) and descriptions feel fun and respectful |
| Online play | `ja.json` → `online.*` | Clear instructions for rooms, codes (合言葉) and quick match |
| About page | `ja.json` → `about.*` | The short history and rules summary are accurate |
| Install prompt | `apps/shogi/web/vite.config.ts` → `manifest` | App name (将棋) and description |
| Search results | `ja.json` → `seo.*`, and `apps/shogi/web/index.html` | Titles and descriptions read well and are not keyword soup |
| Open Graph image | `apps/shogi/web/scripts/generate-og-image.mjs` | The Japanese on the shared picture (無料で、登録なしで。 / コンピュータ六段階 / 友達とオンライン / 十五のレッスン) |
| Design page | `ja.json` → `design.*` and board names (榧, 新榧, 夜) | Names of the board styles |
| Game names on sibling sites | `packages/family/src/games.ts` | The Japanese names of the other games: タイ将棋, シットゥイン, シャンチー |
| README | `apps/shogi/README.ja.md` | The Japanese README as a whole |

Everything can also be reviewed in the running site: Japanese is the default. Pages: ホーム, 対局
(コンピュータ / オンライン / ふたりで), 学ぶ (all 15 lessons), このサイトについて and 設定.

## Terminology to confirm

| Concept | Current Japanese | Notes |
|---|---|---|
| Shogi | 将棋 | |
| Sente / Gote | 先手 / 後手 | The first player is never called 黒 on this site |
| King | 王将 | The board shows 王 for Sente and 玉 for Gote |
| Rook / Dragon | 飛車 / 竜王 | Board: 飛 / 龍 |
| Bishop / Horse | 角行 / 竜馬 | Board: 角 / 馬 |
| Gold | 金将 | |
| Silver / promoted | 銀将 / 成銀 | Board: 銀 / 全 |
| Knight / promoted | 桂馬 / 成桂 | Board: 桂 / 圭 |
| Lance / promoted | 香車 / 成香 | Board: 香 / 杏 |
| Pawn / promoted | 歩兵 / と金 | Board: 歩 / と |
| Piece in hand | 持ち駒 | |
| Drop | 打つ | |
| Promotion | 成る / 成らず | The prompt says 成りますか？ |
| Enemy camp | 敵陣 | |
| Check / checkmate | 王手 / 詰み | |
| Two pawns on a file | 二歩 | |
| Pawn-drop mate | 打ち歩詰め | |
| Fourfold repetition | 千日手 | |
| Perpetual check | 連続王手の千日手 | The result line says 反則負け |
| Take back | 待った | |
| Resign | 投了 | |
| Room code | 合言葉 | Or should it be 部屋コード? |
| Pass-and-play | ふたりで対局 | |
| Time categories | 超早指し / 早指し / 中速 / じっくり | Do these match what Japanese sites use? |

## How to send corrections

Any of these is welcome:

- open an issue: <https://github.com/socheek-del/chaturanga/issues/new>
- edit `ja.json` or `lessons.ts` and open a pull request
- or simply write the corrections in a message, in the form "screen → current text → suggested text"

## Sign-off

| Reviewer | Date | Scope | Notes |
|---|---|---|---|
| _(waiting for a native Japanese reviewer)_ | | | |
