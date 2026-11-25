# Session Handoff

## Active work

Implement the [42-entry rollout](docs/CHESS-LIKE-ROADMAP.md) one product at a time, with an interactive tutorial, bots and applicable multiplayer. Shatra and Fortress remain staged on Melon with public promotion blocked by missing DNS.

The active feature is `suffragetto-001`. Research selected the surviving WSPU/Sargeant Bros. second-edition two-player rules as the best-documented edition, with no evidence to rank variants by popularity. The report and source/rights notes are under `apps/suffragetto/docs/`; `apps/suffragetto/docs/board-coordinates.md` maps all 289 cells, goals, Arena, holding/staging areas and S/P positions. `packages/suffragetto/src/layout.ts` encodes the map and its five layout tests pass. The rules-core and board-ui helpers now support file `q`; focused tests passed 40/40 and 46/46, and all three package typechecks passed. A full baseline `npm run verify` passed before this increment. Startup `./init.sh` could not fetch npm@11 because registry DNS failed; local verification uses Node 25.9 with loopback access and `NODE_OPTIONS=--no-experimental-webstorage` (the pinned Node 22.23.1 is not installed here). Next implement the pure engine. No Suffragetto move engine or product app exists yet. Jeson Mor is implemented and verified through Melon staging: rules/AI 28/15, web 29, Worker 9, local browser 5/5, offline 1/1, built-stage browser 6/6, exact-SHA CI run 45612186318 for `3a31bf29739ca08024abced86014a35e31d4ea56`, and restart/copied-state restore all passed. Its stage is `127.0.0.1:19915` in `/home/melon/chaturanga-release.jesonmor.s1Jcyr`; keep `chaturanga-stage-jesonmor-19915` running. `jesonmor.beanroti.com` has no A/AAAA record, so public HTTPS/WSS, Caddy and catalog work are blocked; no public route changed.

`fortress-001` is implemented and verified on Melon at port 19911 from `fc5577d3a53e6c90a572457bb24750b3b0e34e52`. CI run 45552897158 passed; the built PWA, illegal-move rejection, four-seat reconnect, restart, copied-state restore and offline behavior all passed. Its feature status is `blocked` only at public DNS/HTTPS/WSS smoke because `fortress.beanroti.com` has no DNS record. Stage directory: `~/chaturanga-release.fortress.Gz3JGZ`.

`crazyhouse-001` is implemented and staged on Melon at port 19912 from `0b160b035447083d390b999aced2d216688abefb`; CI run 45569846694 passed. The isolated migration, built tutorial/bot/PWA/offline smoke, two-seat capture/drop/reconnect, container restart and copied-state restore passed. Stage directory: `~/chaturanga-release.crazyhouse.KzM8xm`. Its feature is blocked only at public HTTPS/WSS and catalog publication because `crazyhouse.beanroti.com` has no DNS answer; keep the stage running.

`congo-001` is blocked only at its public release gate. Patched commit `fdf1325efcd7b3d63c3ac1eb20c86fe6fa28f176` passed exact-SHA CI run `45599461942` and is staged at port 19914 in `~/chaturanga-release.congo.350fpC`; migration, health/homepage, production audit (zero findings), staged browser smoke (5/5) and offline PWA (1/1) passed. The older port 19913 stage in `~/chaturanga-release.congo.yFqc4U` remains for rollback. Melon DNS returns no IPv4/IPv6 address for `congo.beanroti.com`; no Caddy or catalog change was made. Keep port 19914 running. Read `feature_list.json`, `claude-progress.md`, the Jeson Mor report and `docs/CHESS-LIKE-ROADMAP.md`; Node 22.23.1 is at `/private/tmp/node22/node_modules/.bin`.

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
| congo | fdf1325 | 19914 | `~/chaturanga-release.congo.350fpC` | patched production audit clean; tutorial, bot, mobile, invite/move sync/reconnect 5/5; offline PWA 1/1; previous 77cfac9 stage at 19913 retained for rollback |
| jesonmor | 3a31bf2 | 19915 | `~/chaturanga-release.jesonmor.s1Jcyr` | CI 45612186318 passed; D1 migration; built PWA/room/offline smoke 6/6; restart and copied-state restore passed; public DNS absent |

Each stage is named `chaturanga-stage-<slug>-<port>` and has its own migrated database. All required public hostnames follow `<slug>.beanroti.com`. The existing certificate covers seven specific names. Available DNS credentials have zone read access. Add the missing records to reach Melon at `185.202.236.248`, obtain TLS on Melon, promote each stage and run public HTTPS and WebSocket smoke before updating the catalog. Keep staged services available while work proceeds.
