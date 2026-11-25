# Session Handoff

## Active work

Implement the [42-entry rollout](docs/CHESS-LIKE-ROADMAP.md) one product at a time. Interactive tutorials, bot play and applicable multiplayer are required. Current feature is `shatra-001`, Altai Shatra. Select the current Altai tournament form under the 1983 Shatra Code. The detailed [current rules guide](https://vnbooks.ru/altai-shatra.pdf) gives 14 active and 9 fortress Shatras per side, horizontal-return timing and gate capture rights; the [2015 rules-engine paper](https://earchive.tpu.ru/jspui/bitstream/11683/17016/1/conference_tpu-2015-C04-v2-070.pdf) reports 11 reserves without matching placement. Use the fully specified nine-field fortress setup, recorded in `packages/shatra/RULES.md`. The English Wikipedia article describes a separate chess-piece army. Hiashatar (`hia-001`) is staged and ready; public promotion waits for DNS at `hiashatar.beanroti.com`.

Read `feature_list.json` for acceptance criteria and `claude-progress.md` for the complete log. Node 22.23.1 is available via `/private/tmp/node22/node_modules/.bin` on this machine. `./init.sh` passed at the initial baseline. Repository verification requires loopback sockets for the Worker pools. Keep browser artifacts in a temporary directory when running Playwright alongside ESLint.

## Melon releases

`plat-022` passed with a pinned deployment, migrations, real WebSockets, restart recovery, backup restore and route rollback. All seven pre-existing products have Melon origins. Push verified increments directly to main and use [the release runbook](docs/MELON-RELEASE.md). Use Cloudflare only where a documented Melon limitation prevents delivery.

Three-player Chess is live on Melon port 19901 from fe0b009. Its eleven public browser scenarios passed. The catalog describes the tutorial, bots and three-seat invites. Keep port 19900 as rollback. Preserve the online room state and signing secret when replacing the live container.

## Staged releases pending DNS

| Product slug | Pinned revision | Loopback port | Melon stage directory | Staged browser tests |
| --- | --- | --- | --- | --- |
| shatranj | 9232a07 | 19897 | `~/chaturanga-release.shatranj.AUuZbW` | 6/6 |
| chaturanga | 89604bb | 19902 | `~/chaturanga-release.chaturanga.wanRAh` | 6/6 |
| maharajah | e4e04fb | 19903 | `~/chaturanga-release.maharajah.ezafRG` | 6/6 |
| courier | dc1feb1 | 19904 | `~/chaturanga-release.courier.rsjSBn` | 6/6 |
| acedrex | 5adadf2 | 19905 | `~/chaturanga-release.acedrex.sFoXPN` | 6/6 |
| tamerlane | a48a53d | 19907 | `~/chaturanga-release.tamerlane.i0KJt0` | 7/7 |
| shatar | 0581e7b | 19908 | `~/chaturanga-release.shatar.dkiN4E` | 8/8 |
| hiashatar | 2858c15 | 19909 | `~/chaturanga-release.hiashatar.ea0qfu` | 6/6; restart recovery passed |

Each stage is named `chaturanga-stage-<slug>-<port>` and has its own migrated database. All required public hostnames follow `<slug>.beanroti.com`. The existing certificate covers seven specific names. Available DNS credentials have zone read access. Add the missing records to reach Melon at `185.202.236.248`, obtain TLS on Melon, promote each stage and run public HTTPS and WebSocket smoke before updating the catalog. Keep staged services available while work proceeds.
