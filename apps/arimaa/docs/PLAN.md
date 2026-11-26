# Arimaa — implementation plan

Arimaa is the next ready game in `docs/CHESS-LIKE-ROADMAP.md`. Select the official standard two-player rules, not Fast Rules or a theme variant. Available evidence supports standard Arimaa as the canonical product selection but does not establish any variant as empirically most popular. The source-linked rules/adoption/licensing review is in `docs/reports/Arimaa rules adoption licensing.md` and the matching `research_notes/` folder.

## Product shape

```text
packages/arimaa/       @chaturanga/arimaa — pure Variant, setup and four-step turns
packages/arimaa-ai/    @chaturanga/arimaa-ai — six seeded, bounded bots for both roles
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
- `@chaturanga/arimaa` is implemented as a pure Variant with two-stage chosen setup, stable FEN, complete one-to-four-step turns, atomic push/pull, per-step traps, freeze/thaw, goals, elimination, immobilization and third-repetition loss.
- `@chaturanga/arimaa-ai` supplies six seeded opponent levels. Setup considers the finite placements; midgame levels sample at most 1–256 distinct complete turns and score them through the authoritative Variant, avoiding the 20,652-turn opening list.
- Full `NODE_OPTIONS=--no-experimental-webstorage npm run verify` passed after the current engine and bot changes: lint, every workspace typecheck and all tests. Arimaa focused suites pass 22/22 rules and 4/4 bot checks.
- No product PWA, interactive tutorial, or Worker code exists yet.
- Next: write the original product design brief, then implement the independent PWA with a draft turn editor so players select one to four steps without seeing complete turns as route choices. Continue with interactive tutorial, isolated Worker and private Melon stage on port 19920.
