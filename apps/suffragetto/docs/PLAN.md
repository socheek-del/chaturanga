# Suffragetto

## Selected edition

Digitize the surviving WSPU / Sargeant Bros. second-edition, two-player rules as the best-documented form.
Sources do not establish a statistically most-popular variant. The game is attributed to the WSPU; the
surviving object is associated with Sargeant Bros. Date records differ: Oxford materials place it around
1907–08 or 1917 for the surviving second edition, while the specialist catalogue says circa 1909 and reports
a 1909 rules-sheet stamp. The exact first-edition date remains unresolved. See the [rules and rights
report](reports/Suffragetto%20rules%20and%20rights.md).

## Rules summary

- Board: 17×17 square grid; 9×17 central Arena envelope with the 3×2 House of Commons and Albert Hall
  goal buildings cut out of the pink capture area; 21-cell Prison and Hospital zones; six-cell Prison Yard
  and Hospital Grounds. Exact coordinates and S/P setup masks are in
  [`board-coordinates.md`](board-coordinates.md). Build a machine-readable, tested fixture from this map
  before implementing move generation.
- Each side has 21 pieces: 16 small rank-and-file and five large pieces. The Suffragette side has a Leader
  and four assistants; Police has an Inspector and four constables. The S/P markers on the surviving board
  determine setup. One large piece occupies the middle of the front row; the other four occupy the outermost
  cells of the front and second rows. The source uses a coin toss for first move; the product exposes a
  first-player choice.
- Players alternate one piece per turn. A piece moves one adjacent empty cell in any of eight directions,
  or hops over one occupied adjacent cell into the empty cell beyond. A turn may chain hops, changing
  direction; either side's pieces may be hopped over. Each destination must satisfy the zone restrictions.
- Prison, Prison Yard, Hospital and Hospital Grounds are not ordinary landing or crossing destinations.
  Suffragettes may not enter Albert Hall; police may not enter the House of Commons. A piece in the
  opponent's goal building may move within it but may not leave.
- Opponents may be arrested/disabled only while in a pink Arena cell and only by a hop. Goal buildings are
  not pink Arena cells. Rank-and-file pieces capture
  on diagonal hops; Leaders/Inspectors capture in any direction. A jumped opponent outside the Arena, or
  reached by a non-capturing hop direction, is not captured. Captures transfer a piece to Prison or Hospital.
- If both Prison and Hospital hold at least 12 pieces, either player can demand an exchange of up to six
  equal-rank pairs. No consent is required. Released pieces go to the respective staging areas; another
  exchange cannot occur until both are clear.
- First player to fill all six cells in the opposing goal building wins. The source wording says to place six
  pieces there; the six-cell board areas support the full-occupancy reading.

## Digital conventions to pin

- Repetition is a draw after three occurrences of the full position (board, prisoners, staging areas and
  side to move). No 50-move rule is added.
- A player with no legal move loses. The historical source gives no no-move or repetition result.
- The initiating player selects up to six matching-rank prisoner pairs; the opponent cannot refuse. The
  original rules do not define which individual pieces are selected or a UI exchange protocol.
- Remove a captured piece from its Arena cell immediately during a chained hop so its cell becomes empty;
  the original prose does not state capture timing inside a chain.
- The archival board resolves zone membership: both 3×2 buildings are uncolored cutouts from the pink
  Arena and cannot be capture squares. The coordinate fixture must assert each zone and setup count.

## Rights boundary

The historical procedures may inform independently written rules and code. The Oxford transcription is
clarity-edited and marked © 2018; its scans, photos, wording, layout and illustrations are not product assets.
Create new prose, board styling, pieces and branding, and avoid implying endorsement by the WSPU, Sargeant
Bros. or Bodleian. The research is not worldwide copyright or trademark clearance.

## Product contract

- Standalone English PWA with an original visual identity and board/piece art.
- Complete play against bounded bots as either side, local pass-and-play and saved/reloaded games.
- Interactive tutorial for every selected mechanic, including hops, Arena captures, rank-specific capture,
  Prison/Hospital, exchanges, goal occupancy and victory.
- Private online rooms and quick match, with server validation through the same pure rules engine and
  isolated Suffragetto D1 storage. No chat.
- Installable offline-capable PWA; all strings keyed in the English locale.
- Reserved local ports: web `5201`, PWA preview `4201`, Worker `8811` (recheck listeners before use).
- Melon deployment only. Keep the route/catalog unpublished until DNS/TLS and public HTTPS/WSS smoke pass.

## Sequence

1. [x] Research provenance, editions and rights. Report and source notes live under `docs/reports/` and
   `docs/research_notes/`.
2. [x] Transcribe the archival board's exact coordinate masks and setup in `board-coordinates.md`.
3. [x] Build and verify the TS fixture from that map before adding move generation. Its layout tests assert
   all 289 cells, each zone count, goal/Arena exclusions, both 21-cell setups and the five large-piece cells.
4. [ ] Implement `@chaturanga/suffragetto` as a pure 17×17 `Variant` with rules tests, serialization,
   prisoner exchanges, shared conformance and seeded replay/undo.
5. [ ] Add bounded bots and strength smoke; test both roles, chained hops and exchanges.
6. [ ] Build the independent PWA, original art, local play/save, responsive board, offline behavior and
   interactive tutorial; add web, locale, lesson, PWA and browser checks.
7. [ ] Add the isolated Worker/D1, private rooms and quick match; verify legality, reconnect, restart and
   copied-state restore.
8. [ ] Pass exact-SHA CI and stage on Melon. Verify built PWA, tutorial, bots, online play, offline mode,
   restart and copied-state restore. Publish only after public DNS/TLS and HTTPS/WSS smoke pass.

## Sources

- [Bodleian rules exhibit and transcription](https://visit.bodleian.ox.ac.uk/sites/default/files/bodwhatson/documents/media/suffrage_in_a_box_sources_combined_compressed.pdf)
- [Bodleian exhibition essay](https://www.glam.ox.ac.uk/files/shout-out-women)
- [Games Board Association object record and archival photos](https://www.gamesboard.org.uk/cgi-pub/gardpub.cgi?command=view&pk=13815&table=examples)
- [2016 online reconstruction](https://suffrajitsu.com/play-suffragetto-online-the-1909-suffragettes-vs-police-board-game-meets-the-digital-age)
- [U.S. Copyright Office: Games](https://www.copyright.gov/register/tx-games.html)
- [UK IPO: Copyright duration](https://www.gov.uk/government/publications/copyright-notice-duration-of-copyright-term/copyright-notice-duration-of-copyright-term)
