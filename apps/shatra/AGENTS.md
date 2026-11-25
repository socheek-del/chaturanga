# Altai Shatra product

- The selected tournament rules are pinned in `packages/shatra/RULES.md`.
- The product is English-only and uses its own theme, board map, lessons, PWA, Worker and isolated online storage.
- Web dev server: 5210; Worker: 8810.
- Run `npm run e2e -w apps/shatra/web`; `SHATRA_E2E_URL` points Playwright at a built stage.
- `SHATRA_SITE_URL` overrides the address. Deploy via `docs/MELON-RELEASE.md` and `ssh melon`; do not use Cloudflare unless a documented Melon limitation blocks delivery.
- Online moves are validated by `@chaturanga/shatra` in this product's Worker. The invite-room service and persistent state are isolated from other games.
