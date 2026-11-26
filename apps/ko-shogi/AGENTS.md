# Ko Shogi product instructions

Ko Shogi is an independent historical reconstruction, not a mode in Shogi or Chu Shogi. Keep rules, art, lessons, locale, PWA, site/service settings, and online storage inside `apps/ko-shogi/` and `packages/ko-shogi/` plus its own AI package.

- The selected v1 profile is “Ko Shogi, reconstructed rules”; use [`packages/ko-shogi/RULES.md`](../../packages/ko-shogi/RULES.md) as its contract. No popularity winner is supported.
- Implement all 34 starting types and 31 promoted types, including shots, route captures, automatic capture promotions, reversible Banner/Drum promotions, burn, suppression, nets and command endings. Do not reduce the game to ordinary shogi movement.
- The rules package is pure and deterministic. It must implement `Variant` from `@chaturanga/rules-core` and `describeVariantConformance`; no DOM, network, timers or implicit randomness.
- Use an original 19×19 intersection board and original piece glyphs. Do not trace or bundle archive images or modern diagrams. Do not use Duolingo’s visual language or imply association affiliation.
- English is the only v1 language; every user-visible string still goes through locale keys. The interactive tutorial is mandatory and teaches every selected rule and digital convention.
- Include six deterministic bounded bots, local saves, pass-and-play, offline installable PWA, and server-authoritative private rooms without chat. The Worker validates every move with this rules package and owns isolated persistence.
- Deploy and stage through `ssh melon`. Worker dev port is 8794 and private Melon loopback stage is 19926. Use Cloudflare only after recording a Melon delivery limitation. Do not publish Caddy routing or an app-directory entry without public DNS/TLS/HTTPS/WSS verification.
- Keep current progress in `feature_list.json`, `claude-progress.md`, this product plan, and `session-handoff.md`. Do not mark the release passing before all required verification and release checks run.
