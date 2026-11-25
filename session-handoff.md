# Session Handoff

## Active work

Implement the [42-entry rollout](docs/CHESS-LIKE-ROADMAP.md) one product at a time, with an interactive tutorial, bots and applicable multiplayer. Shatar, Fortress, Crazyhouse, Congo, Jeson Mor and Suffragetto remain staged on Melon; their public promotions wait for DNS/TLS and HTTPS/WSS checks.

`suffragetto-001` is implemented and staged at port 19916 in `/home/melon/chaturanga-release.suffragetto.Bz3TYJ`, pinned to `0e46a1ee3bf5fd3f9075e025f387a54a01638123`. Exact-SHA CI run 45638729555 passed. Its seven interactive lessons, six deterministic bot levels, local PWA, private rooms, built-stage browser smoke 5/5, offline PWA 1/1, restart recovery and copied-state restore passed. The only release blocker is that `suffragetto.beanroti.com` has no DNS answer; no Caddy route or catalog entry changed. Keep the stage running.

Active feature: `dameo-001`. Research, engine, six bounded bot levels and the original route-atlas design are complete. Tutorial milestone `84ecf9feeb8e40ed05b7d6fcb8f020e25e830317` is on `main`: `apps/dameo/web` has nine original lessons across three units, board exercises validated by the Variant, English locale, site setting, responsive route-atlas design, local fonts, SVG art, family footer and PWA manifest. Web lesson/locale checks passed 45/45, typecheck and ESLint passed, production PWA build passed, and headless Chromium opened home/lesson, answered a quiz and found no 390px horizontal overflow. Full workspace lint, typecheck and tests passed with loopback enabled. Exact-SHA CI run `45658443801` failed at `npm ci` because the lock omitted nested `apps/dameo/web/node_modules/@vitejs/plugin-react@6.3.0`; its metadata is now copied from the equivalent installed sibling entry, and `npm ci --ignore-scripts --dry-run --offline` passes. Push this small lock correction and verify CI. Then implement pass-and-play, local save/reload, six bot levels for both colors, an actual mutually accepted draw action, and offline install/reload. Add the isolated server-authoritative room Worker and D1, verify online reconnect/restart/restore, then stage on Melon. Public branding still requires trademark review and DNS/TLS/HTTPS/WSS. `./init.sh` could not fetch npm@11 and only Node 25.9 is installed; use `NODE_OPTIONS=--no-experimental-webstorage` for local Node commands.

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
| suffragetto | 0e46a1e | 19916 | `~/chaturanga-release.suffragetto.Bz3TYJ` | CI 45638729555 passed; D1 migration; built PWA/tutorial/room smoke 5/5; offline PWA 1/1; restart and copied-state restore passed; public DNS absent |

Each stage is named `chaturanga-stage-<slug>-<port>` and has its own migrated database. All required public hostnames follow `<slug>.beanroti.com`. The existing certificate covers seven specific names. Available DNS credentials have zone read access. Add the missing records to reach Melon at `185.202.236.248`, obtain TLS on Melon, promote each stage and run public HTTPS and WebSocket smoke before updating the catalog. Keep staged services available while work proceeds.
