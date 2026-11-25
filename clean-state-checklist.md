# Clean State Checklist

- [x] `./init.sh` completed with the pinned Node and cached npm@11 in offline mode; lint, typecheck and the full test suite passed.
- [x] The standard verification path still runs (`npm run verify`); local and GitHub CI verification passed.
- [x] E2E suite still passes if UI or worker code changed (`npm run e2e`); 6/6 passed against the Melon stage.
- [x] Current progress is recorded in `claude-progress.md`.
- [x] Feature state in `feature_list.json` reflects what is actually passing versus blocked on public DNS.
- [x] Every new user-visible string is present in each language that product declares (Shatra is English-only).
- [x] No half-finished step is left undocumented; public hostname DNS is recorded as the blocker.
- [x] No secrets, `.dev.vars`, or local wrangler state committed.
- [x] Work is committed on `main` with descriptive messages.
- [x] The next session can continue without manual repair.
