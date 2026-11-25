# Gess variants and popularity

## Which Gess edition should the digital product use?

### Takeaway

Use the standard two-player Gess rules created by the Puzzles and Games Ring of The Archimedeans and first published in *Eureka* in 1994. Available evidence supports this as the canonical, best-documented edition; it does not establish that it is the most popular among competing variants.

### Cited Findings
- The original rules post identifies its text as a copy of “Gess the Game” from *Eureka* no. 53 and says it was posted with permission from the journal editor and the Archimedeans; it describes the game as a two-player generalization of chess conceived by the Archimedeans’ Puzzles and Games Ring. [1995 rules repost with permission](https://groups.google.com/g/rec.games.abstract/c/tuSTCVg__Ss)
- The Archimedeans describe *Eureka* as their mathematical journal, and their archive lists the society as publisher; a separate historical index identifies issue 53 as February 1994 and Colin Bell as its editor. [Archimedeans publications](https://archim.org.uk/publications/), [Eureka issue index](https://en.wikipedia.org/wiki/Eureka_(University_of_Cambridge_magazine))
- Ian Stewart’s November 1994 *Scientific American* column, “Playing Chess on a Go Board,” introduced Gess to a broad readership as a game invented by the Cambridge society; the archived issue text is independently accessible. [Scientific American November 1994 issue](https://www.scientificamerican.com/archive/issues/1990s/), [archived issue text](https://wkbpic.com/wkbx/SA/1994/199411.pdf)

### Inferences
- The 1994 Archimedeans rules are the right baseline for this roadmap’s Gess entry. Label it “standard Gess” or “1994 Archimedeans rules,” and describe it as the best-documented form rather than claiming it is the most popular.

### Gaps
- No reliable evidence was found comparing adoption of distinct Gess rules editions. The sources surfaced several ways to represent the board, not rival rulebooks with measurable player populations.

## Are there competing variants or only board conventions?

### Takeaway

The material located points to one rule set and two geometrically equivalent board presentations: an 18×18 playable-square grid (with off-board footprint centers allowed) and a 20×20 cell diagram with an unplayable perimeter. Treat those as coordinate/display conventions, not as separate Gess variants.

### Cited Findings
- The reposted standard rules allow a 3×3 footprint to be partly off-board, permit pieces to move partly off the board with off-board stones removed, and describe the playable area as an 18×18 grid. [1995 rules repost with permission](https://groups.google.com/g/rec.games.abstract/c/tuSTCVg__Ss)
- The SGF specification for Gess defaults to a 20×20 board representation whose “edges” place a row and column outside each edge; it states this represents 18×18 playable squares and encodes moves by footprint-center coordinates. [SGF Gess specification](https://red-bean.com/sgf/gess.html)
- A BoardGameGeek discussion explains that 18×18 and 20×20 presentations are alternate views of playing Gess on a Go board: 18×18 cells versus a 20×20 cell drawing with a non-playable outer margin. [BoardGameGeek board-representation discussion](https://boardgamegeek.com/geeklist/173951/games-played-on-a-20x20-grid-or-larger)
- BoardGameGeek lists the game as “Gess (1994)” and describes the rule-defining pieces as any same-color 3×3 footprint, whose pattern can change when stones move. [BoardGameGeek Gess entry](https://boardgamegeek.com/boardgame/12862/gess)

### Inferences
- Implement one normalized 18×18 playable-square state. The UI may show a 20×20 explanatory margin or address partly off-board footprints, but should not expose that visual choice as a rules variant.
- The 510 possible footprint patterns described in secondary summaries are move-shape possibilities within the game, not 510 editions or variants. [Wikipedia Gess overview](https://en.wikipedia.org/wiki/Gess)

### Gaps
- No primary source located establishes an official naming standard for the 18×18 versus 20×20 presentation; the original rule text and the SGF document support treating them as equivalent encodings.

## What does available popularity evidence show?

### Takeaway

Gess has evidence of historical dissemination and present online play, but it appears niche in the available catalog signals. None of the evidence supports ranking a Gess variant as “most popular.”

### Cited Findings
- Ian Stewart’s 1994 *Scientific American* column helped introduce the game outside the Archimedeans; the article itself says the game was called Gess and gives the Cambridge society attribution. [Archived Scientific American column](https://wkbpic.com/wkbx/SA/1994/199411.pdf)
- As checked on 2026-11-26, BoardGameGeek’s Gess page showed 22 user ratings and 18 comments, no recorded publisher, and no marketplace listings. These are platform-specific community signals, not sales or global player counts. [BoardGameGeek Gess entry](https://boardgamegeek.com/boardgame/12862/gess)
- The Atari ST archive documents a freeware two-human-player Gess utility by Jean-Etienne Doucet, dated 5 June 1995, which managed the game’s pieces on screen. This establishes an early software implementation, not its user base. [AtariUpToDate Gess archive](https://www.atariuptodate.de/en/12786/gess)
- Wikipedia’s external links identify PlayGess (formerly hGess) as an online place to play Gess and report AI play, but the linked site timed out when checked; this is a lead, not independently verified usage data. [Wikipedia external links](https://en.wikipedia.org/wiki/Gess), [PlayGess](https://playgess.com/)

### Inferences
- The 1994 standard edition is the only clearly documented edition encountered and thus the sensible selection. That is a documentation-based selection, not a popularity verdict.
- Small BGG counts and the absence of a publisher/listings suggest limited visibility in that particular catalog; they cannot prove low worldwide adoption.

### Gaps
- No comparable sales, tournament participation, club membership, or concurrent-player data were found for Gess or for distinct Gess rule variants. BGG ratings/comments are too limited and self-selected to substitute for such data.
