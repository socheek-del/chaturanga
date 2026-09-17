# Chinese translation review (xq-011)

Simplified Chinese is the default language of the Xiangqi site, so the Chinese text must read naturally and
use the terms Xiangqi players use. This review must be done by a **native Chinese speaker**, ideally someone
who plays Xiangqi. The engineering team wrote the current Chinese text; it has not been reviewed.

The interface is **Simplified Chinese** (`zh-Hans`). The piece characters on the board are the traditional
forms, drawn as images (owner decision D4: 帥仕相俥傌炮兵 for Red, 將士象車馬砲卒 for Black), so they are not
part of this text review. The words used for the pieces in sentences, however, are.

## What to review

| Area | Where | What to check |
|---|---|---|
| App UI | `apps/xiangqi/web/src/locales/zh-Hans.json` | Natural wording, a consistent friendly tone, no English leftovers |
| Lessons | `apps/xiangqi/web/src/features/learn/lessons.ts` (`'zh-Hans':` strings) | Correct rule explanations, beginner-friendly wording, standard terms (蹩马腿, 塞象眼, 炮架) |
| Result reasons | `zh-Hans.json` → `play.reason.*` | 困毙, 长将, 长捉 and the 50-move wording match how players say them |
| Bot personas | `zh-Hans.json` → `bots.*` | Names (兵 士 相 傌 炮 俥) and descriptions feel fun and respectful |
| Online play | `zh-Hans.json` → `online.*` | Clear instructions for rooms, codes and quick match |
| About page | `zh-Hans.json` → `about.*` | The short history and rules summary are accurate |
| Install prompt | `apps/xiangqi/web/vite.config.ts` → `manifest` | App name (象棋) and description |
| Design page | `zh-Hans.json` → `design.*` and board theme names (枫木, 宣纸, 墨夜) | Names of the board styles |
| Search results | not written yet (xq-010: SEO tags, Open Graph image text) | Add to this sheet when they exist |
| Game names on sibling sites | not written yet (xq-009: `packages/family/src/games.ts`, including Chinese names for Makruk and Sittuyin) | Add to this sheet when they exist |

Everything can also be reviewed in the running site. Until it is deployed, run it locally with
`npm run dev:xiangqi`; Chinese is the default. Pages: Home, Play (computer, online, pass-and-play), Learn
(all lessons), About and Settings.

## Terminology to confirm

| Concept | Current Chinese | Notes |
|---|---|---|
| Xiangqi | 象棋 | |
| Red / Black | 红方 / 黑方 | |
| General | 帅 / 将 | Sentences use the simplified forms; the board shows 帥 / 將 |
| Advisor | 仕 / 士 | |
| Elephant | 相 / 象 | |
| Horse | 马 | Board shows 傌 / 馬 |
| Chariot | 车 | Board shows 俥 / 車 |
| Cannon | 炮 | Board shows 炮 / 砲 |
| Soldier | 兵 / 卒 | |
| Palace | 九宫 | |
| River | 河界（楚河、汉界） | |
| Point (intersection) | 交叉点 / 点 | |
| Check / Checkmate | 将军 / 将死 | |
| Stalemate (loses) | 困毙 | Reason text: 困毙：无子可走判负 |
| Perpetual check / chase | 长将 / 长捉 | Reason text: 长将判负 / 长捉判负 |
| Flying general rule | 将帅不能对面 | |
| Hobbled horse / blocked elephant eye / cannon screen | 蹩马腿 / 塞象眼 / 炮架 | |
| Take back | 悔棋 | |
| Resign / offer a draw | 认输 / 提和 | |
| Bullet / Blitz / Rapid / Classical | 超快棋 / 快棋 / 中速棋 / 慢棋 | |
| Two players, one device | 双人同屏 | |

## How to submit changes

Edit the Chinese strings directly (keys must stay the same: `npm test -w apps/xiangqi/web` fails if a key is
missing or empty in either language), or list corrections in the table below and an engineer will apply them.

| Key or location | Current | Suggested | Reason |
|---|---|---|---|
| | | | |

## Sign-off

| Reviewer | Native Chinese speaker | Plays Xiangqi | Date | Result |
|---|---|---|---|---|
| | | | | |
