# Hiashatar

## Selected rules

Implement the documented 10×10 reconstruction in `packages/hiashatar/RULES.md`. It includes enemy-only bodyguard zones, horses that ignore zones, hia that cannot check the noyon, one-to-three-square pawn advances from home, bers promotion, and every passed square as an en passant target.

## Release checklist

- [x] Rules package with FEN, replay, checkmate, stalemate and digital draw conventions
- [x] Variant conformance and specific zone, horse, promotion and en passant fixtures
- [x] Bounded bot for either color
- [x] English PWA and tutorial
- [x] Same-device saves, private invite rooms and isolated Worker service
- [x] Full repository verification and browser checks
- [ ] Push the verified revision and stage it on Melon
- [ ] Verify the stage, reconnect and offline PWA
- [ ] Public TLS smoke and catalog entry after hostname DNS points to Melon
