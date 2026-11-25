# Evaluator Rubric

Use this rubric after implementation and before final acceptance of a feature.

| Category | Question | Score (0-2) | Notes |
| --- | --- | --- | --- |
| Correctness | Does the implemented behavior match the feature's `user_visible_behavior`? |  |  |
| Rules fidelity | For engine/AI/online work: do results agree with the game's Fairy-Stockfish variant (perft, lock-step games, counting rules) and pass the rules-core Variant conformance suite? |  |  |
| Verification | Did the required checks actually run, with evidence recorded? |  |  |
| Scope discipline | Did the session stay inside the chosen feature scope? |  |  |
| Localization | Are all new strings in every language the product declares (Makruk: Thai default + English; Sittuyin: Burmese default + English)? Does the text render and fit? |  |  |
| UX & design | Does it follow the product's own design system (Makruk: "Wat", `apps/makruk/docs/design.md`), avoid copying other products' trade dress, and work at ~400px width? |  |  |
| Product separation | Does game-specific content stay in that game's folders, with nothing game-specific added to the root or shared packages? |  |  |
| Reliability | Does the result survive restart, reload, or reconnect without repair? |  |  |
| Maintainability | Is the code and documentation clear enough for the next session? |  |  |
| Handoff readiness | Can a fresh session continue work from repo artifacts only? |  |  |

Mark "n/a" for categories that do not apply to the feature.

## Verdict

- Accept
- Revise
- Block

## Required Follow-Up

- Missing evidence:
- Required fixes:
- Next review trigger:

## Fortress Chess review — 2026-11-25

| Category | Score | Notes |
| --- | ---: | --- |
| Correctness | 2 | Four-seat rules, bots, tutorial, local saves and invite rooms work in the staged product. |
| Rules fidelity | 1 | Variant conformance and Markov geometry fixtures pass; the selected historic rules have no Fairy-Stockfish oracle and Petrov's scan was unavailable. |
| Verification | 2 | Full GitHub CI passed; staged browser checks covered bot seats, legality, reconnect, offline, restart and copied-state restore. |
| Scope discipline | 2 | Work stayed within Fortress and the narrow shared conformance timeout option it required. |
| Localization | 2 | English-only product; visible strings are keyed in its declared locale. |
| UX & design | 2 | Original visual identity reviewed at phone and desktop sizes; tutorial completes at both widths. |
| Product separation | 2 | Rules, art, lessons, site and isolated Worker live under Fortress folders. |
| Reliability | 2 | Save/reload, reconnect, container restart and a separate copied-state restore all recovered. |
| Maintainability | 2 | Rules decisions, sources, stage pin and unresolved DNS gate are recorded beside the product and in the handoff. |
| Handoff readiness | 2 | Exact staged SHA, port, directory, CI run and next public release gate are recorded. |

**Verdict:** Accept the staged implementation. Public release remains blocked until `fortress.beanroti.com` resolves and HTTPS/WebSocket smoke passes.

**Required follow-up:** Configure the hostname's DNS, then promote the verified Melon stage, run public smoke and publish the directory entry. Revisit rules fidelity if an inspectable Petrov scan or reference engine becomes available.
