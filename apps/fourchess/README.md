# Fourfold Chess

Fourfold Chess is a four-seat, Free-for-All chess game played on a 14×14 crossboard with 160 playable squares. It includes pass-and-play, three seeded bots, an 11-step interactive tutorial, and private four-player online rooms.

The exact selected conventions are documented in [`packages/fourchess/RULES.md`](../../packages/fourchess/RULES.md). They follow a current tournament-documented FFA rules form; the available sources do not establish a historical or worldwide popularity winner among four-handed chess variants.

## Development

```sh
npm run dev:fourchess
npm run build:fourchess
npm run e2e:fourchess
```

The site and room Worker are independent product workspaces under `web/` and `worker/`. The Worker validates every online move through the Four-handed rules engine. It has no chat. Local browser identity keeps a returning player in the same seat.

Deployment targets Melon. The verified release process and public routing checks are in [`docs/MELON-RELEASE.md`](../../docs/MELON-RELEASE.md); stage an exact committed revision with `npm run stage:fourchess` after setting `FOURCHESS_SHA` to that full commit SHA.
