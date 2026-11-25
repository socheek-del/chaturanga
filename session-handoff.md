# Session Handoff

## Active work

Implement the [42-entry rollout](docs/CHESS-LIKE-ROADMAP.md) one product at a time, with an interactive tutorial, bots and applicable multiplayer. Shatra and Fortress remain staged on Melon with public promotion blocked by missing DNS.

The active feature is `suffragetto-001`. The source-backed second-edition rules, rights boundary and board map are under `apps/suffragetto/docs/`. `packages/suffragetto` has a pure 17×17 Variant with exchange actions and replay/undo (36 focused checks); shared board-ui/game-shell/protocol checks passed 47/93/6 and full workspace `npm run verify` passed. `packages/suffragetto-ai` has six deterministic bounded personas; its 17 checks, typecheck, lint and two seeded 32-ply strength smoke games passed. Engine commit `7f82b77` is pushed to main and exact-SHA CI run 45629891192 passed. Next build the standalone English PWA with an interactive tutorial that teaches every rule, responsive original board/art, bot play, save/reload and offline install; then add the private Worker/D1. `./init.sh` cannot fetch npm@11 due registry DNS failure; only Node 25.9 is installed, with `NODE_OPTIONS=--no-experimental-webstorage` used for verification. Keep Melon staging product-local; public routes wait for DNS/TLS and HTTPS/WSS checks. Jeson Mor remains staged at `127.0.0.1:19915` in `/home/melon/chaturanga-release.jesonmor.s1Jcyr`; `jesonmor.beanroti.com` still has no A/AAAA record.

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
