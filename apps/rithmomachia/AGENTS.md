# Rithmomachia product instructions

- Follow the common medieval/Renaissance reconstruction selected in `docs/PLAN.md` and implemented in
  `packages/rithmomachia/RULES.md`. Do not silently add Selenus or Fulke-only rules.
- Keep Rithmomachia rules, bot, lessons, English locale, art, product configuration, Worker and storage in
  `packages/rithmomachia*` and `apps/rithmomachia/`. Do not edit another game's product files.
- The pure Variant is the sole rules source for local play, bots, lessons and online moves. Keep it
  deterministic and environment-free. The Worker must validate each move with this Variant; no chat.
- All gameplay text must be original and keyed in the product's English locale. Keep the Number Cabinet
  visual identity distinct and retain the font license notices.
- The product name and `docs/design.md` remain proposals pending owner review. Do not publish a route or
  add this product to the app directory until name review, DNS/TLS and HTTPS/WSS smoke pass.
- Melon is the deployment target via `ssh melon`; use Cloudflare only if a documented Melon limitation
  prevents delivery. Preserve this Worker’s own D1/DO state and verify restart plus copied-state restore.
- Reserved local ports: web `5206`, PWA preview `4206`, Worker `8816`; check listeners before use.
- Run Node 25 from `.nvmrc`; in this environment set `NODE_OPTIONS=--no-experimental-webstorage`.
  `npm run dev:rithmomachia` starts the web and Worker together; `npm run build:rithmomachia` builds both.
- Read `docs/PLAN.md` and `docs/reports/Rithmomachia rules variants rights.md` before changing the selected
  rules or lessons.
