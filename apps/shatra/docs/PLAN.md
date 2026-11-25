# Shatra product plan

## Product shape

- **Ruleset:** the current Altai tournament form under the 1983 Shatra Code. The fully specified 62-field layout has 14 active Shatras and 9 fortress reserves per side, one Biy per side, Batyr promotion, horizontal-return timing and gate capture rights. `packages/shatra/RULES.md` records the source conflict and digital draw choices.
- **Modes:** interactive field guide, human vs bot as either side, pass-and-play, and private invite rooms with server-validated moves and reconnect.
- **Language:** English only. Every app string uses the product's locale file; lesson text is declared as English lesson content.
- **Identity:** a steppe field atlas: felt discs, ink-blue and pale sand, copper fortress marks, and a tall mapped board. Keep the layout and art specific to Shatra.
- **Deployment:** standalone Worker served by workerd on Melon, isolated state directory, through `docs/MELON-RELEASE.md`. Public promotion and catalog publication follow hostname DNS/TLS and production smoke.

## Release checklist

- [x] Rules package, conformance fixtures, and AI adapter
- [x] Route-aware board input and shared route choice dialogs
- [x] Product shell, bot, tutorial, pass-and-play, PWA, and invite rooms
- [x] Build, lint, typecheck, unit and browser verification
- [ ] Push verified increments to `main`; confirm CI
- [ ] Stage on Melon, play and reconnect through two seats, restart, and restore the staged state
- [ ] Public HTTPS/WebSocket smoke and family catalog entry after DNS is ready
