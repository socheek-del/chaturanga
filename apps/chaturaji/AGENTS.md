# Chaturaji product notes

- Product web app: `web/`; isolated online Worker and D1 archive: `worker/`.
- This is the source-based historical dice reconstruction pinned in `../../packages/chaturaji/RULES.md`; do not describe it as the most popular Chaturaji form.
- The product is English-only in v1. All user-facing text is in `web/src/locales/en.json`; the interactive tutorial is required.
- The first player controls Red, Green, Yellow and Black seats as applicable. Online play has four private seats, server-generated recorded dice, server-side move validation, reconnect, no clocks and no chat.
- Address is read only from `web/site.config.ts` (`CHATURAJI_SITE_URL`). The current default is `https://chaturaji.beanroti.com`.
- Deploy on Melon via `ssh melon` after an exact-SHA CI pass. Stage on loopback port 19922. Do not add a public route or directory entry until DNS/TLS/HTTPS/WSS smoke succeeds. Cloudflare is fallback only for a documented Melon limitation.
- Keep rules-specific facts in `../../packages/chaturaji/RULES.md`; research and product decisions stay in `docs/`.

Release state (2026-11-26): commit `cf328621aab6bcdd2575c7abd0be147cc8f8546a` passed exact-SHA CI run `45800394175` and is privately staged on Melon at `/home/melon/chaturanga-release.chaturaji.yoXEwM`, port 19922. The isolated `DB/0001_games.sql` migration, built PWA, tutorial, bots, four-seat rooms, restart recovery and copied-state restore passed. Keep this stage running. Melon's resolver has no answer for `chaturaji.beanroti.com`; public routing and directory publication remain blocked, with no Caddy/catalog changes.
