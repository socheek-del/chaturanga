# Session Handoff

## Active work

Implement the [42-entry rollout](docs/CHESS-LIKE-ROADMAP.md) one product at a time. Interactive tutorials, bot play and applicable multiplayer are required. Current feature is `hia-001`, Hiashatar. Its selected rules, bot, interactive tutorial, PWA and private-room Worker are implemented and locally verified. The next step is to push the checkpoint, stage it on Melon port 19909, and run the production-asset browser suite including offline play and room restart. After stage verification, start Shatra (`M30`) while Hiashatar waits for DNS at `hiashatar.beanroti.com`.

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

Each stage is named `chaturanga-stage-<slug>-<port>` and has its own migrated database. All required public hostnames follow `<slug>.beanroti.com`. The existing certificate covers seven specific names. Available DNS credentials have zone read access. Add the missing records to reach Melon at `185.202.236.248`, obtain TLS on Melon, promote each stage and run public HTTPS and WebSocket smoke before updating the catalog. Keep staged services available while work proceeds.
