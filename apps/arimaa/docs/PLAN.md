# Arimaa — implementation plan

Arimaa is the next ready game in `docs/CHESS-LIKE-ROADMAP.md`. Select the official standard two-player rules, not Fast Rules or a theme variant. Available evidence supports standard Arimaa as the canonical product selection but does not establish any variant as empirically most popular. The source-linked rules/adoption/licensing review is in `docs/reports/Arimaa rules adoption licensing.md` and the matching `research_notes/` folder.

## Product shape

```text
packages/arimaa/       @chaturanga/arimaa — pure Variant, setup and four-step turns
packages/arimaa-ai/    @chaturanga/arimaa-ai — bounded bots for both roles
apps/arimaa/web/       independent English PWA, original art, local play, bots and tutorial
apps/arimaa/worker/    isolated server-kit Worker and product-local archive
```

The rules contract in `packages/arimaa/RULES.md` selects the 8×8 board, free two-rank setups, four-step turns, push/pull, freezing, traps and official goal/elimination/immobilization/repetition endings. The engine and UI must model setup, intermediate step choices, atomic push/pull input, trap captures after each step, and the official overlapping-result priority.

## Rights and public-release gates

Arimaa Public License v2025.02, Section 3 is the planned route only while the public product remains free and has no user or advertising revenue. It requires a product announcement in the Arimaa Discord and visible license statements, a `www.arimaa.com` attribution/link, and an end-user rights boundary. Do not use official piece art; create original art and tutorial prose. The official code downloads have their own licenses and do not replace the game license.

No Discord announcement or rights-holder contact has been made. Development and Melon staging can proceed against original assets; public promotion stays gated until the owner confirms the no-revenue condition and authorizes the required announcement. Any ads, fees, sponsorship, or other revenue requires the commercial Section 2 agreement instead. Never send the announcement without explicit owner authorization.

## Current state — 2026-11-26

- Research and the initial source-based rules contract are complete.
- `./init.sh` passed full workspace install, lint, typecheck and tests with `NODE_OPTIONS=--no-experimental-webstorage`; the adjacent standard-chess browser smoke passed 5/5 (one optional offline scenario skipped).
- No Arimaa rules engine, bot, PWA, tutorial, or Worker code exists yet.
- Next implementation slice: exact setup/coordinates and a pure four-step Variant state model, with source-backed fixtures before move-generation breadth.
