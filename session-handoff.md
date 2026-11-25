# Session Handoff

## Active work

Implement the [42-entry rollout](docs/CHESS-LIKE-ROADMAP.md) one product at a time, with an interactive tutorial, bots and applicable multiplayer. Shatar, Fortress, Crazyhouse, Congo, Jeson Mor and Suffragetto remain staged on Melon; their public promotions wait for DNS/TLS and HTTPS/WSS checks.

`suffragetto-001` is implemented and staged at port 19916 in `/home/melon/chaturanga-release.suffragetto.Bz3TYJ`, pinned to `0e46a1ee3bf5fd3f9075e025f387a54a01638123`. Exact-SHA CI run 45638729555 passed. Its seven interactive lessons, six deterministic bot levels, local PWA, private rooms, built-stage browser smoke 5/5, offline PWA 1/1, restart recovery and copied-state restore passed. The only release blocker is that `suffragetto.beanroti.com` has no DNS answer; no Caddy route or catalog entry changed. Keep the stage running.

`dameo-001` is implemented and staged on Melon at port 19917 in `/home/melon/chaturanga-release.dameo.dTpb5d`, pinned to `6987d5b6a6e67938d27d55d1189c4ce43268bdd3`. Exact-SHA CI run 45668832352 passed. The product has a pure 8×8/18-men Variant, six bounded bots, nine interactive lessons, route-atlas PWA, local saves/offline play and server-authoritative private rooms. Worker tests passed 9/9; full workspace verification and production build passed. Staged migration, health/homepage, tutorial, bot-as-both-colors, private room, legal move sync, reload reconnect, agreement draw, mobile/browser-error smoke passed. A live room recovered on container restart; an isolated copied-state restore recovered the same room and synchronized another legal move. Temporary restore resources are removed; keep the primary stage running.

`dameo.beanroti.com` has no DNS answer, and trademark clearance remains open; public HTTPS/WSS, Caddy and directory publication are blocked. No route/catalog entry changed. The standard form is best-documented, not proven most popular; no compatible Fairy-Stockfish oracle is available. `./init.sh` still cannot fetch npm@11 because registry DNS returned ENOTFOUND; this checkout verified under Node 25.9 with `NODE_OPTIONS=--no-experimental-webstorage`.

`gess-001` has a completed rules/edition/popularity/rights research record. The 1994 Archimedeans rules are the best-documented candidate, not a proven popularity winner. No digital adaptation license or written permission was found; the old text-repost permission is limited to the rules text. Gess is blocked before implementation pending written adaptation permission or an applicable license. No contact was sent. See `apps/gess/docs/PLAN.md` and its report. Keep the exact setup and no-move/repetition questions open until the rights gate clears.

`duell-001` research is complete. The selected roadmap target is Lakeside's 1976 8×9 edition, distinct from 9×9 Tactix. Rules evidence records tumbling dice, exact-landing captures and King/key-square wins, with starting-side, chirality, win-timing and ending gaps. No digital adaptation permission/license was found and the current rights holder is unresolved. Duell is blocked before implementation; see `apps/duell/docs/PLAN.md` and its report. No rights-holder contact was sent.

`ploy-001` research is complete. The candidate is Frank Thibault / 3M's 1970 rules: two-player is the default and four-player individual/partnership are documented. The 9×9-point game has directional pieces and Commander/all-other-units wins. Rotation increment and some seat/outcome details remain unclear. No Ploy-specific title chain or digital permission was found; Hasbro's generic policy does not establish ownership. Ploy is blocked before implementation pending rights clearance; see `apps/ploy/docs/PLAN.md` and the research report. No contact was sent.

`hexagonal-chess-001` research is complete. Gliński's 91-cell form is the best-known selection; McCooey is distinct. The full rules source supports pawn double-step and special stalemate scoring; en passant appears in detailed secondary sources but still needs confirmation in the original book. Modern summaries conflict, and exact setup/draw rules need source checking. No digital license/permission or current rights holder was verified, so implementation is blocked pending clearance. See `apps/hexagonal-chess/docs/PLAN.md` and its report. No contact was sent.

`hnefatafl-001` research is complete. Copenhagen 11×11 is the documented modern tournament standard; shield walls and edge forts distinguish it from Fetlar and historical reconstructions. The primary rules page says all rights reserved and offers no digital license; implementation is blocked under repo rights requirements pending applicable clearance. See `apps/hnefatafl/docs/PLAN.md` and report. No contact was sent.

`rollerball-001` research is complete. The target is Cazaux's 40-square two-ring chess variant, not the unrelated Invicta maze. Evidence covers location-dependent movement, rebounds, pawn restrictions, promotion and endings, but the creator page was inaccessible and date/setup/clockwise-win details need confirmation. No digital license was found; implementation is blocked pending rights clearance and separate name review. See `apps/rollerball/docs/PLAN.md` and the report.

`kruzno-001` research is complete. Wikipedia's main entry is Palko's 2005 base game; the roadmap's linked hex-checkers phrase most likely means separate 12-piece Kruzno Checkers. Adoption evidence is too limited for a popularity claim. No digital adaptation permission or verified current rights chain was found; block implementation. See `apps/kruzno/docs/PLAN.md` and report. No contact was sent.

Rithmomachia (`rithmomachia-001`) is implemented and pinned on Melon at port 19918 from `840ff3defe743726b8ddc6353fa63c3b9b84039d`, CI run 45711966827. The 8×16 engine, six bots, 13 lessons, offline PWA and authoritative online rooms all pass. Stage checks covered mobile/offline/tutorial/bot, room/join/move sync, restart recovery and active copied-state restore. Keep `chaturanga-stage-rithmomachia-19918` running in `/home/melon/chaturanga-release.rithmomachia.7MoXIr`. No route/catalog entry changed: `rithmomachia.beanroti.com` has no A/AAAA record and product name/design review remains open. Full dev audit has five advisories, including high `happy-dom` (test-only); production audit is clean. The build has a 546.23 kB minified entry warning.

Active feature: `chu-shogi-001`, the roadmap's Chu Shogi choice for the next Wave 2 product. Start with rules edition/adoption/rights research; verify the 12×12 setup, lion restrictions, promotions and existing Shogi platform fit before engine code. Read `docs/CHESS-LIKE-ROADMAP.md`, `apps/shogi/AGENTS.md`, `apps/shogi/docs/PLAN.md` and `packages/shogi/RULES.md`. The public routes for earlier games remain DNS/TLS and naming-gated. Dameo remains staged at Melon port 19917; keep it running. Gess, Duell, Ploy, Gliński Hexagonal chess, Copenhagen Hnefatafl, Rollerball and Kruzno remain rights-blocked in their product plans.

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
| rithmomachia | 840ff3d | 19918 | `~/chaturanga-release.rithmomachia.7MoXIr` | CI 45711966827 passed; D1 migration; offline/tutorial/bot/room smoke; restart and active copied-state restore passed; public DNS/name review open |

Each stage is named `chaturanga-stage-<slug>-<port>` and has its own migrated database. All required public hostnames follow `<slug>.beanroti.com`. The existing certificate covers seven specific names. Available DNS credentials have zone read access. Add the missing records to reach Melon at `185.202.236.248`, obtain TLS on Melon, promote each stage and run public HTTPS and WebSocket smoke before updating the catalog. Keep staged services available while work proceeds.
