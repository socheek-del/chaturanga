# Dameo product instructions

- Follow the canonical, best-documented 8×8 Dameo rules in `packages/dameo/RULES.md`. Research does not
  establish that this form is statistically more popular than experimental alternatives.
- Keep all product rules, art, lessons, locale content, site configuration, Worker and persistent storage in
  `apps/dameo/` and `packages/dameo/`. Do not edit another game's files.
- The rules package is the sole rules source for the PWA, bots, lessons and server. Keep it pure and
  deterministic; pass all moves and endings through the same `Variant`.
- Every selected rule and digital convention must have an original interactive lesson. User-visible text is
  keyed in the product's English locale. Do not copy MindSports or Wikipedia prose, diagrams or art.
- Use original game art and product branding. Do not imply endorsement by Christian Freeling or MindSports.
  Trademark clearance for public use of the name remains outstanding; do not promote a public route until
  naming, DNS/TLS and HTTPS/WSS checks are resolved.
- Online moves are server-validated. No chat. Keep the site's address in this product's single site setting;
  never hardcode a shared domain.
- Melon is the deployment target via `ssh melon`; use Cloudflare only if a documented Melon limitation
  prevents delivery. Preserve isolated Dameo online storage and test restart plus copied-state restore.
- Reserved local ports: web `5202`, PWA preview `4202`, Worker `8812`; recheck listeners before use.
- Read `docs/PLAN.md` and the research report before changing rules or tutorials.
