# Session Handoff

## Active work

Implement the [42-entry rollout](docs/CHESS-LIKE-ROADMAP.md) one product at a time, with an interactive tutorial, bots and applicable multiplayer. `shatra-001` is locally verified and staged on Melon at port 19910 from `7907568`; its CI, built-PWA smoke, two-seat restart recovery and copied-state restore passed. Stage directory: `~/chaturanga-release.shatra.Vw0eEp`. Public promotion is blocked because `shatra.beanroti.com` has no DNS record.

Active feature: `fortress-001`. The research gate is complete: implement Petrov's Russian four-handed edition as a labeled digital reconstruction. The rules and product scope are in `packages/fortress/RULES.md` and `apps/fortress/docs/PLAN.md`; next build the pure rules package and prove the 192-cell mask, walls and route examples before adding bots or UI. The original scan remains a research improvement, not a blocker. Public site target: `fortress.beanroti.com`; stage on Melon first.

Read `feature_list.json` for acceptance criteria and `claude-progress.md` for the session log. Node 22.23.1 is available via `/private/tmp/node22/node_modules/.bin`. `./init.sh` completed with `npm_config_offline=true` after the direct registry attempt failed; it used the cached npm@11 package and all verification passed. Repository verification needs loopback access for Worker pools.

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

Each stage is named `chaturanga-stage-<slug>-<port>` and has its own migrated database. All required public hostnames follow `<slug>.beanroti.com`. The existing certificate covers seven specific names. Available DNS credentials have zone read access. Add the missing records to reach Melon at `185.202.236.248`, obtain TLS on Melon, promote each stage and run public HTTPS and WebSocket smoke before updating the catalog. Keep staged services available while work proceeds.
