# Janggi product plan

Built 2026-11-23 on the owner's request: "build janggi, like the other variants, on a new domain, and deploy".

## Decisions made by the agent (open for the owner to change)

- **D1 Rules:** Fairy-Stockfish `janggi` (bikjang and points), not `janggimodern`, `janggitraditional` or `janggicasual`.
- **D2 Languages:** Korean (default) and English.
- **D3 Subdomain:** the family pattern's `kr-` prefix.
- **D4 Design:** "Dancheong" (`design.md`). **Characters:** 楚/漢 generals and 卒/兵 soldiers; octagonal pieces in three sizes.
- **D5 Arrangements:** each player chooses in pass-and-play; the bot picks at random; a private room's creator
  chooses both; quick match uses the default (안상차림) for both.
- **D6** A pass that would end the game asks for confirmation.

## Not built

- Choosing one's own arrangement in quick match, or as the joiner of a room.
- Saved games, PGN and an engine review (chess and Makruk have them).
- README media (GIFs).

## Platform changes (plat-019)

All additive: `GameStatus` kinds `bikjang` and `double-pass`, an optional winner on `repetition` and
`fifty-move`; `Variant.startFens`, carried by room creation and rematch; `SearchAdapter.terminalScore`;
`OnlineLobby` `startFen`/`roomOptions`; `useMoveInput` ignores a pass; Korean as a family language.
