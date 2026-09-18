<div align="center">

[English](README.md) · **日本語** · [Chaturanga](../../README.md) の一つ

<img src="docs/media/mobile.png" alt="将棋 · Shogi — ホーム、レッスン、暗い表示の対局" width="100%" />

# 将棋 · Shogi

**将棋を無料でオンライン対局。登録不要、日本語と英語。**

[![いますぐ指す](https://img.shields.io/badge/%E2%96%B6%20%E3%81%84%E3%81%BE%E3%81%99%E3%81%90%E6%8C%87%E3%81%99-%E3%83%96%E3%83%A9%E3%82%A6%E3%82%B6%E3%81%A7%E7%84%A1%E6%96%99-1f3d5c?style=for-the-badge)][play]

[![CI](https://github.com/socheek-del/chaturanga/actions/workflows/ci.yml/badge.svg)](https://github.com/socheek-del/chaturanga/actions/workflows/ci.yml)
[![License: GPL-3.0](https://img.shields.io/badge/license-GPL--3.0-2a2419)](../../LICENSE)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-b98d47)](../../CONTRIBUTING.md)

[**対局する**][play] · [できること](#できること) · [将棋とは](#将棋とは) · [手元で動かす](#手元で動かす) · [参加する](#参加する)

</div>

---

将棋は日本の伝統的な盤上遊戯で、チェスの仲間のなかで**取った駒が戻ってくる**唯一の遊戯です。取った駒は自分の
持ち駒になり、空いているほとんどの升に打てます。だから駒は盤から消えず、攻めも終わりません。このサイトは、
その将棋をどの端末でも指せるようにしたものです。**一から学び**、**コンピュータと練習し**、**友達とオンラインで**、
あるいはひとつの端末でふたりで。広告も登録もなく、コードはすべて公開されています。

## できること

<table>
  <tr>
    <td width="50%" valign="top">
      <h3>🤖 コンピュータと対局</h3>
      <img src="docs/media/play-computer.gif" alt="コンピュータとの対局とヒント" width="100%" />
      <p>駒の名前がついた六人の相手。<b>歩</b>から<b>飛</b>まで、どれも一つ下より強いことを対戦で確かめています。
      ヒントと待ったも使えます。</p>
    </td>
    <td width="50%" valign="top">
      <h3>🌐 友達とオンライン</h3>
      <img src="docs/media/online.gif" alt="ふたりが同じ対局をそれぞれの端末で" width="100%" />
      <p><b>3+2 · 5+0 · 10+0</b> ですぐに相手を探すか、部屋を作って合言葉かリンクを送ってください。
      サーバーも同じルールエンジンで一手ずつ確かめるので、千日手の判断もずれません。</p>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <h3>📚 一から学ぶ</h3>
      <img src="docs/media/lesson.gif" alt="金将のレッスン" width="45%" align="left" />
      <p>十五のレッスン。盤と駒、成り、持ち駒、二歩と打ち歩詰め、王手と詰み、千日手、そして寄せまで。
      答えはすべてルールエンジンが確かめます。どのレッスンからでも始められます。</p>
    </td>
    <td width="50%" valign="top">
      <h3>🪵 このサイトの見た目</h3>
      <img src="docs/media/mobile.png" alt="ホーム、レッスン、暗い表示の対局" width="100%" />
      <p>「榧」：榧の盤と和紙、押すところは藍、朱は成り駒のためだけに。駒の文字はフォントではなく輪郭線で
      描いているので、日本語フォントを読み込みません。盤は三種類、暗い表示にも対応します。</p>
    </td>
  </tr>
</table>

- **ふたりで対局**：ひとつの端末を交代で。盤は手番の側に合わせて向きが変わります。
- **本当の将棋の決まり**：持ち駒、成り（任意と強制）、二歩、打ち歩詰め、千日手と連続王手の反則負け。
  [Fairy-Stockfish](https://github.com/fairy-stockfish/Fairy-Stockfish) と一手ずつ突き合わせて確かめています
  （意図して異なる一点は [`RULES.md`](../../packages/shogi/RULES.md) に書いてあります）。
- **持ち時間**：よく使う設定から選ぶか、時計なしで。
- **入れればオフラインでも**：レッスン、ふたり対局、コンピュータは接続なしで動きます。
- **再読み込みで消えません**：対局は指すたびに保存されます。
- **日本語と英語**：いつでも切り替えられ、その選択は端末に残ります。

## 将棋とは

将棋は九×九の盤で指します。駒はどちらの色も同じ形で、向いている方の持ち物です。だから取った駒は持ち主が
変わります。先手から指します。

| 駒 | 文字 | 動き | 成ると |
|---|---|---|---|
| **王将** | 王 / 玉 | どこへでも一升 | — |
| **飛車** | 飛 | 縦横にどこまでも | **竜王** 龍：飛車に加えて斜め一升 |
| **角行** | 角 | 斜めにどこまでも | **竜馬** 馬：角に加えて縦横一升 |
| **金将** | 金 | 斜め後ろ以外に一升 | — |
| **銀将** | 銀 | 前と斜め四方に一升 | 全（金と同じ） |
| **桂馬** | 桂 | 二つ前の左右へ跳ぶ | 圭（金と同じ） |
| **香車** | 香 | まっすぐ前へどこまでも | 杏（金と同じ） |
| **歩兵** | 歩 | 一升前へ。取り方も同じ | と（金と同じ） |

はじめての人が驚くのは三つです。**持ち駒**：盤の駒を動かす代わりに、取った駒を打てます。**成り**：敵陣の
三段では成るか成らないかを選べます（動けなくなる升に進むときだけ必ず成ります）。そして**歩**だけの決まり：
同じ筋に二枚打てず（二歩）、打って詰ますこともできません（打ち歩詰め）。

## 手元で動かす

```bash
git clone https://github.com/socheek-del/chaturanga.git
cd chaturanga
nvm use            # Node 22
./init.sh          # 依存関係を入れて、すべての確認を走らせます
npm run dev:shogi  # web は http://localhost:5177、API とオンラインは :8790
```

## 参加する

どんな大きさの貢献も歓迎します。不具合の報告、決まりの訂正、レッスンの追加、翻訳、絵、コード。
まず [**CONTRIBUTING.md**](../../CONTRIBUTING.md) をご覧ください。

- 🐛 [不具合や要望を送る](https://github.com/socheek-del/chaturanga/issues/new)
- 🇯🇵 日本語の見直しに協力してくださる方は [`docs/i18n-review.md`](docs/i18n-review.md) へ
- ♟️ 将棋に詳しい方は、レッスンと [`RULES.md`](../../packages/shogi/RULES.md) をご確認ください

## ライセンス

[GPL-3.0-or-later](../../LICENSE) © Chaturanga contributors. 駒の絵はこのプロジェクトのために作られ、同じ
ライセンスです。駒の文字は [Noto Serif JP](https://fonts.google.com/noto/specimen/Noto+Serif+JP)（SIL Open
Font License 1.1、本文は [`web/src/features/board/OFL.txt`](web/src/features/board/OFL.txt)）から作った輪郭線です。

<!-- 公開アドレスはここにだけ書きます。 -->
[play]: https://jp-chess.beanroti.com
