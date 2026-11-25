# Session Handoff

## Active work

Implement the [42-entry rollout](docs/CHESS-LIKE-ROADMAP.md) one product at a time, with an interactive tutorial, bots and applicable multiplayer. Shatra and Fortress remain staged on Melon with public promotion blocked by missing DNS.

`fortress-001` is implemented and verified on Melon at port 19911 from `fc5577d3a53e6c90a572457bb24750b3b0e34e52`. CI run 45552897158 passed; the built PWA, illegal-move rejection, four-seat reconnect, restart, copied-state restore and offline behavior all passed. Its feature status is `blocked` only at public DNS/HTTPS/WSS smoke because `fortress.beanroti.com` has no DNS record. Stage directory: `~/chaturanga-release.fortress.Gz3JGZ`.

`crazyhouse-001` is implemented and staged on Melon at port 19912 from `0b160b035447083d390b999aced2d216688abefb`; CI run 45569846694 passed. The isolated migration, built tutorial/bot/PWA/offline smoke, two-seat capture/drop/reconnect, container restart and copied-state restore passed. Stage directory: `~/chaturanga-release.crazyhouse.KzM8xm`. Its feature is blocked only at public HTTPS/WSS and catalog publication because `crazyhouse.beanroti.com` has no DNS answer; keep the stage running.

`congo-001` is in progress through a dependency-audit follow-up. Runtime commit `77cfac9949333c2f075e84c0f2ec185601366e3d` passed CI run `45590944839` and is staged at port 19913 in `~/chaturanga-release.congo.yFqc4U`; tutorials/bots/rooms, offline PWA, restart and copied-state restore passed. The stage still uses the old lock (Hono 4.13.7/Zod 4.6.4). The refreshed lock resolves Hono 4.13.22/Zod 4.6.7 with a clean production audit; full local verify, build and browser/offline checks pass. Next commit this patch, confirm exact-SHA CI, and re-stage on Melon at port 19914 before marking Congo blocked only at DNS/TLS. `congo.beanroti.com` has no DNS answer; no Caddy or catalog change was made. Jeson Mor is next after this release checkpoint. Read `feature_list.json` and `claude-progress.md`; Node 22.23.1 is at `/private/tmp/node22/node_modules/.bin` and Worker browser tests need loopback access.

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
| shatra | 7907568 | 19910 | `~/chaturanga-release.shatra.Vw0eEp` | 6/6; restart recovery and copied-state restore passed |
| fortress | fc5577d | 19911 | `~/chaturanga-release.fortress.Gz3JGZ` | PWA, four-seat legality/reconnect, restart and copied-state restore passed |
| crazyhouse | 0b160b0 | 19912 | `~/chaturanga-release.crazyhouse.KzM8xm` | tutorial, bot, offline PWA, invite capture/drop/reconnect, restart and copied-state restore passed |
| congo | 77cfac9 | 19913 | `~/chaturanga-release.congo.yFqc4U` | tutorial, bot, mobile, invite/move sync/reconnect, offline PWA, restart and copied-state restore passed |

Each stage is named `chaturanga-stage-<slug>-<port>` and has its own migrated database. All required public hostnames follow `<slug>.beanroti.com`. The existing certificate covers seven specific names. Available DNS credentials have zone read access. Add the missing records to reach Melon at `185.202.236.248`, obtain TLS on Melon, promote each stage and run public HTTPS and WebSocket smoke before updating the catalog. Keep staged services available while work proceeds.
