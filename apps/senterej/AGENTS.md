# Senterej product notes

Senterej is a historical Ethiopian/Eritrean chess game reconstructed from public-domain primary material and
later scholarship. Use the source decisions in `docs/PLAN.md` and the executable contract in
`packages/senterej/RULES.md`. Its Werera opening lets either player act repeatedly until the first capture;
this is why platform action authorization is not always the side-to-move. Keep all app copy and art original.

## Release state (2026-11-26)

- Exact-SHA CI run `45846364938` passed commit `64ec507cb5b8ad2325594024bc67c0d3a117b0b3`.
- Private Melon stage: `chaturanga-stage-senterej-19924`, loopback port `19924`, release directory
  `/home/melon/chaturanga-release.senterej.umZ25h`. The earlier stage on `19923` remains for rollback.
- Migration, health, homepage, built-app browser smoke (4/4), offline PWA smoke (1/1), room restart and
  copied-state recovery with post-restore move sync passed. Temporary restore resources were removed; the
  primary stage is healthy.
- Melon's resolver returned no DNS address for the configured hostname. Do not add a public Caddy route or
  app-directory entry until public DNS/TLS/HTTPS/WSS checks can pass. The Field of Ochre identity proposal
  awaits owner review.
