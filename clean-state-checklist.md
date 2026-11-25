# Clean State Checklist

- [ ] The standard startup path still works (`./init.sh`).
- [ ] The standard verification path still runs (`npm run verify`).
- [ ] E2E suite still passes if UI or worker code changed (`npm run e2e`).
- [ ] Current progress is recorded in `claude-progress.md`.
- [ ] Feature state in `feature_list.json` reflects what is actually passing versus unverified.
- [ ] Every new user-visible string is present in each language that product declares.
- [ ] No half-finished step is left undocumented.
- [ ] No secrets, `.dev.vars`, or local wrangler state committed.
- [ ] Work is committed on `main` (or a pushed branch) with a descriptive message.
- [ ] The next session can continue without manual repair.
