# Clean State Checklist

- [x] Fortress's exact code revision passed GitHub `npm run verify` and all workspace builds. Crazyhouse startup `npm run verify` also passed locally under Node 22.23.1 when run outside the sandbox so Worker tests could bind loopback ports; `./init.sh` could not sync uncached npm@11 in offline mode.
- [x] Fortress rules tests passed 23/23, bots 4/4, tutorial 2/2 and Worker room/schema checks 4/4; local browser and PWA checks passed before staging.
- [x] The CI-only conformance allowance preserves all five 120-ply seeded games and every attack assertion; Fortress rules tests and both package typechecks passed locally.
- [x] Exact commit `fc5577d3a53e6c90a572457bb24750b3b0e34e52` is staged on Melon at port 19911 in `~/chaturanga-release.fortress.Gz3JGZ`; the migration and health endpoint passed.
- [x] Built-PWA browser checks passed for the complete tutorial, phone layout, local save/reload/takeback, all four bot seats, offline reload, four-seat invite, server-side illegal-move rejection, reconnect, missing room and room fullness.
- [x] The active room recovered after container restart and continued; a copied stopped-state restore recovered all four seats and continued play. Temporary restore resources were removed, and the original stage is healthy.
- [x] Fortress progress, CI evidence, stage pin and release blocker are recorded in `claude-progress.md`, `feature_list.json`, `session-handoff.md` and `apps/fortress/docs/PLAN.md`.
- [x] Every Fortress user-visible string uses its declared English locale; original prose and artwork are used.
- [x] `fortress.beanroti.com` has no DNS address. Public HTTPS/WebSocket smoke, Caddy promotion and catalog publication are recorded as blocked; no public route was changed.
- [x] No secrets, `.dev.vars`, or local Wrangler state were committed.
- [x] Record the Fortress DNS release gate and begin `crazyhouse-001` as the next roadmap product.
- [ ] Commit and push the Crazyhouse selection, rules and rights notes before engine implementation.
- [ ] Keep the Melon Fortress stage running until public DNS, TLS and smoke are available.
