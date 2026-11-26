# Chaturaji implementation plan

## Target and source limits

Implement the historically attested four-player dice reconstruction described by Al-Biruni around 1030, cross-checked against H. J. R. Murray's 1913 source comparison. The available evidence does not prove a most-popular version. The later diceless game is a separate variant and is not part of v1.

The source-led rules review and rights boundary are in [`reports/Chaturaji rules and adoption.md`](reports/Chaturaji%20rules%20and%20adoption.md); source notes are in `research_notes/`. Do not reuse modern rules prose, diagrams, product branding or assets. The UI, tutorial, art and code will be original.

## Rules contract

The selected digital reconstruction is pinned in [`packages/chaturaji/RULES.md`](../../../packages/chaturaji/RULES.md). It records the four rotated corner formations, clockwise order, two dice/actions, piece mapping, score-based end, promotion, Boat triumph and *sinhasana* control. Murray explicitly notes that several procedures are not recoverable with certainty; each is labeled as a digital convention rather than a proven historical fact.


## Product shape

- Independent English PWA, local saves, four-seat pass-and-play and a human against bots in any seat.
- Pure `@chaturanga/chaturaji` Variant and seeded `@chaturaji-ai` or equivalent package following the existing family architecture.
- Dice rolls are generated from injected seeds, recorded as `ROLLxy` replay actions, and generated fresh by the server each turn; rules code must not call ambient randomness.
- Interactive tutorial teaches seating, roll mapping, legal moves, capture scoring, promotion, the chosen special rules and game endings.
- Product-local worker, site configuration, PWA manifest, original art/design, private four-seat rooms, isolated archive/storage and no chat.
- Worker validates both recorded rolls and resulting moves. Each room and archive are isolated from sibling products.

## Verification and deployment

Use fixture tests for the four-corner layout, die mapping, each movement type, optional/pass behavior, scoring, special rules, seeded repeatability, replay/undo and terminal outcomes; run shared Variant conformance. Verify bots for all four seats, tutorial content, PWA/offline behavior, server-side roll/move validation, reconnect, restart and copied-state restore.

Run full repository verification, product build and exact-SHA CI. Stage the verified commit on Melon via `ssh melon`, then run built-stage browser and recovery smoke. Do not change Caddy or `apps/beanroti/web/public/apps.json` without DNS/TLS and public HTTPS/WSS success. Cloudflare remains fallback only for a documented Melon limitation.

## State (2026-11-26)

Rules/adoption/rights review and the complete playable reconstruction contract are recorded. The pure `@chaturanga/chaturaji` Variant and deterministic four-seat bots are implemented. The independent English PWA now has bot play, four-seat pass-and-play, seeded local replay, score and dice panels, and a 13-step interactive tutorial with an engine-validated board move. A four-seat private-room Worker now validates player actions, injects and records server dice, restores stable seats, and archives completed games in its own D1.

Verified so far: `NODE_OPTIONS=--no-experimental-webstorage ./init.sh` passed clean installation, repository lint, all workspace typechecks and tests under local Node 25.9 (the shell has no nvm; CI uses pinned Node 22.23.1). The Chaturaji production PWA/Worker build passed; Wrangler printed a local log-file permission warning, then completed its dry-run with exit code 0 and the expected Durable Object, D1 and asset bindings. Rules suite 16/16, AI suite 4/4, web tutorial tests 2/2, room-state tests 3/3, rules-core 46/46 and protocol 7/7 pass. Browser e2e passes 4/4, including all four online seats and reconnect. Built PWA checks pass 2/2 for installability and offline tutorial, pass-and-play and bots; desktop and mobile visual review reports zero page errors. Next: commit/push directly to main, verify exact-SHA CI, then stage on Melon with migration and restart/copied-state recovery. Check public DNS/TLS before public promotion.
