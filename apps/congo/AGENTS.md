# Congo product notes

- Selected variant: Demian Freeling's 1982 two-player 7×7 Congo chess variant. See `docs/PLAN.md`, `docs/reports/Congo rules and rights.md` and `packages/congo/RULES.md`.
- `packages/congo` is the single rules source for local play, bots, lessons, online validation and replay. Follow its `RULES.md`; do not silently alter the selected edition or digital conventions.
- Lion capture is the only capture win; there is no check/checkmate. A side with no legal move loses. Two Lions alone draw when neither can capture immediately.
- A non-Crocodile that ends a move in the river must leave it on its next own turn or drown. The Lion cannot enter the river; the Crocodile is immune.
- Monkey multi-captures are optional sequences. Captured pieces stay as blockers until the route ends; the same piece cannot be captured twice; visited squares may repeat.
- English is the only declared product language. Every visible string still goes through i18n keys. Ship an interactive tutorial covering river timing, multi-capture and the Lion's special capture.
- Use original animal art, board graphics, rules prose and tutorial wording. Do not copy MindSports or other implementations.
- Keep site address, service, assets, lessons and persistent storage product-local. Deploy on Melon; add the family-directory entry only after public smoke succeeds.
- No online chat. The Worker validates every move using `@chaturanga/congo`.
