# Chu Shogi product instructions

Chu Shogi is an independent product. Its selected v1 profile is **Chu Shogi Renmei competition rules (2019), with the 2004 lion clarifications**. Keep its rules, content, art, locale, PWA, service, and storage inside `apps/chu-shogi/` and `packages/chu-shogi/` (plus its AI package). Never modify the standard Shogi product to add Chu behavior.

## Rules and source boundary

- The 12×12 classical game has 46 pieces per side, no drops, and the 2019/2004 Renmei rules profile.
- Name the edition in the rules page and tutorial. The available evidence supports it as the best-documented current association standard; do not call it the most popular.
- All rules explanations, piece art, diagrams, tutorial text, and branding must be original. Do not reuse Renmei prose or art. The HaChu repository's CC0 declaration applies only to its engine code and does not grant rights to its assets or manuals. This implementation is independently written from cited public rules facts.
- Use “Chu Shogi” descriptively and make no claim of Renmei or other association affiliation. Do not use their logos or trade dress.
- Digital conventions are recorded in `docs/PLAN.md` and `../../packages/chu-shogi/RULES.md`; do not silently alter them.

## Product requirements

- English is the v1 locale. Every visible string goes through locale keys. The tutorial is interactive and its exercises use the authoritative engine.
- Include local/pass-and-play, six bounded bots, saved games, installable offline PWA, and server-authoritative private two-player rooms without chat.
- The Lion, Horned Falcon, and Soaring Eagle require complete-turn multi-leg routes. A route is one atomic engine move, can capture on both legs, and must preserve the route identity in replay, bots, online messages, and UI input.
- Keep each game's state, Worker, and persistent data isolated. Deploy and stage on Melon through `ssh melon`; use Cloudflare only if a documented Melon limitation prevents delivery. Do not publish a public route or directory entry until the DNS/TLS/HTTPS/WSS gate is verified.

## Verification

Use the selected `chu-shogi-001` feature in `feature_list.json`. Record setup/movement/promotion/Lion/endgame fixtures, conformance, bot ladder, tutorial coverage, PWA/offline behavior, online legality/recovery, exact-SHA CI, Melon stage checks, and public release gates before marking any work complete.

