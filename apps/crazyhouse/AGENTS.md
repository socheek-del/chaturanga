# AGENTS.md: Crazyhouse

Crazyhouse is an independent two-player chess-variant product. Its current rules selection and decisions live in `docs/PLAN.md`, `docs/reports/Crazyhouse rules and rights.md`, and `packages/crazyhouse/RULES.md`.

## Product requirements

- Ship an English PWA with its own design, piece art, locale, site URL, tutorial, and online service. Put all game-specific files under `apps/crazyhouse/` or `packages/crazyhouse/`.
- Keep every user-visible string in locale keys, even though v1 declares English only.
- Provide a bounded bot, play as either color, pass-and-play, local saves and an interactive tutorial.
- Online rooms are private, two-seat, server-authoritative and chat-free. The Worker must validate every action by replaying it through `@chaturanga/crazyhouse`.
- Preserve capture provenance for promoted pieces; they return to pockets as pawns. Use shared board primitives only where they preserve the selected rules.
- Use independently written rules explanations and original product art. Review the rights notes before borrowing any external material.

## Verification

Run the pure rules tests and shared Variant conformance suite, compare rule fixtures and seeded playouts with the configured Fairy-Stockfish `crazyhouse` preset, test bot legality from both seats, validate every tutorial step, and cover local persistence, invite rooms, restart recovery and offline PWA behavior. Run `./init.sh`, `npm run build:crazyhouse`, the local browser suite and PWA suite under the pinned Node. Do not mark `crazyhouse-001` passing before the exact-SHA Melon stage and persistence checks pass. Public DNS/TLS may remain a documented gate while the verified stage stays available.

## Local endpoints

- Web: `127.0.0.1:5195`
- Worker: `127.0.0.1:8795`
- Public hostname setting: `crazyhouse.beanroti.com`
