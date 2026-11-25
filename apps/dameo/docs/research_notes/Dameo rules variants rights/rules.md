# Dameo rules and edition evidence

## Canonical standard rules and game contract

### Takeaway

The creator's standard Dameo is the 8×8, all-squares, 18-men-per-side game. Its defining rules are forward linear movement by a man or unbroken friendly line, orthogonal compulsory maximum-capture sequences, and queenwise kings; the primary rules page is unusually explicit about the capture timing and promotion cases.

### Cited Findings

- Christian Freeling's MindSports rules page defines linear movement as advancing a straight, unbroken line of same-color men one square along its occupied line when the square in front is empty; a single man is a line of one, and kings do not use linear movement. The page's initial-position image and explanatory text describe the standard setup and opening move count. [MindSports: Rules](https://mindsports.nl/index.php/arena/dameo/65-rules)
- The same rules page says men and lines move forward only; kings move queenwise. A man ending on the opponent's back row is promoted; if a linear move puts a line on that row, only the head man is promoted. [MindSports: Rules](https://mindsports.nl/index.php/arena/dameo/65-rules)
- Captures take precedence over non-capturing moves and are compulsory. Men capture by orthogonal short leap forward, backward, or sideways; kings capture orthogonally by a long leap. [MindSports: Rules](https://mindsports.nl/index.php/arena/dameo/65-rules)
- A capture sequence must continue when another capture is available. Captured pieces remain on the board until the sequence ends; a piece cannot be jumped twice in that sequence, although empty squares can be revisited. This is the rule combination that produces the named “Coup Turc” tactic. [MindSports: Rules](https://mindsports.nl/index.php/arena/dameo/65-rules)
- The maximum-capture rule requires choosing a sequence that captures the most pieces, with men and kings counting equally; if multiple king routes tie for maximum, the player may choose among them. [MindSports: Rules](https://mindsports.nl/index.php/arena/dameo/65-rules)
- The Wikipedia rules summary independently specifies an 8×8 board and an 18-piece trapezoid: White's rows from its perspective are a1–h1, b2–g2, and c3–f3; Black mirrors this arrangement, and White moves first. [Dameo article](https://en.wikipedia.org/wiki/Dameo)
- The FMJD-hosted “Checkers families and rules” survey gives the same 8×8/18-men setup and depicts rows of 8, 6, and 4 men per side; its summary also identifies forward orthogonal/diagonal and linear movement, orthogonal captures, flying kings, and maximum capture. [FMJD-hosted rules survey (PDF)](https://www.fmjd.org/downloads/variants/Checkers_families_and_rules_28-9-2018.pdf)
- Wikipedia describes a man capturing an adjacent opponent orthogonally to an empty square just beyond, while a king can make an orthogonal long capture over an opponent to any unblocked empty square beyond it. [Dameo article](https://en.wikipedia.org/wiki/Dameo)
- The creator's history says Dameo was formed in 2000 after Freeling encountered Croda; he added the dormant linear-movement idea to Croda's forward diagonal/straight man movement and orthogonal capture. [MindSports: About Dameo](https://mindsports.nl/index.php/arena/dameo/64-about-dameo); [MindSports: Dameo history and rules](https://mindsports.nl/index.php/on-the-evolution-of-draughts-variants/draughts-variants/509-dameo)

### Inferences

- A rules implementation should model a whole turn as one multi-capture route, retain captured men as blockers until route completion, and track which enemy pieces that route has already jumped. This follows directly from the official Coup Turc explanation.
- “Forward” for a line move is the direction in which the line is advancing; because the official text allows men to move diagonally forward and gives line movement along the line's own axis, the legal generator should require the front square to be empty and advance the whole line one cell in that direction. For identical men, the board-position effect can also be described as moving the rear man to the empty cell immediately beyond the front of the line.
- A man that crosses the far rank during a capture but finishes elsewhere remains a man; a man ending there is promoted only after its entire capturing move finishes. This is explicit in the primary rules and Wikipedia summary.

### Gaps

- The MindSports page uses “long leap” for a king's capture without defining all edge cases in prose (e.g. how many opposing pieces on the ray are eligible when there is more than one). Wikipedia clarifies a single target over an unobstructed orthogonal ray; use that as the current digital convention and add fixtures before implementation.
- The initial setup is represented primarily by a creator-provided diagram. The coordinate transcription above follows the published Wikipedia and FMJD descriptions; the board mask should still be encoded and tested locally before move generation.

## Endings and draw-rule conflict

### Takeaway

No-legal-move loss is consistent across the creator's rules and the Wikipedia summary. Draw wording differs between the creator's current rules page, another creator-authored page, and Wikipedia's sourced summary, so the product should disclose a deliberate digital choice rather than imply the historic text is uniform.

### Cited Findings

- The primary rules page says a player loses by elimination or complete blockage and notes that draws may occur by “mutual exhaustion of material.” [MindSports: Rules](https://mindsports.nl/index.php/arena/dameo/65-rules)
- The creator's separate 25-page evolution article says a draw may occur by mutual agreement or threefold repetition. [MindSports: Dameo history and rules](https://mindsports.nl/index.php/on-the-evolution-of-draughts-variants/draughts-variants/509-dameo)
- Wikipedia says a player with no legal move loses, a position where neither side can win is drawn, and threefold repetition by the same player is drawn. Its repetition claim cites the creator's 2002 article, Tapalnitski's 2017 rules/strategy PDF, and BrainKing's implementation. The Wikipedia article itself carries a notice that it relies excessively on primary sources. [Dameo article](https://en.wikipedia.org/wiki/Dameo); [BrainKing rules](https://brainking.com/hw/GameRules?tp=123); [Tapalnitski, “Meet Dameo!” (PDF)](https://mindsports.nl/images/stories/arena/damvar/Dameo.pdf)
- The creator's current rules page explicitly allows “draws” without naming threefold repetition, while the creator's separate history article names it. The two official pages are therefore not textually identical on adjudication. [MindSports: Rules](https://mindsports.nl/index.php/arena/dameo/65-rules); [MindSports: Dameo history and rules](https://mindsports.nl/index.php/on-the-evolution-of-draughts-variants/draughts-variants/509-dameo)

### Inferences

- Follow the user-provided Wikipedia behavior for v1: a player with no legal move loses; declare a draw when neither side can possibly win; declare a draw on threefold repetition. Record these as selected digital rules, because the creator's current primary rules page uses the less precise “mutual exhaustion of material” wording.
- Repetition identity must include the board, side to move, and promoted status; for a normal position-only repetition rule, historical moves do not otherwise affect Dameo legality.

### Gaps

- “Mutual exhaustion of material” is not formally defined on the primary rules page. The source does not specify whether this means mutual agreement, a material-only dead position, or a broader inability to win; the separate creator article's threefold rule and Wikipedia's no-possible-win rule point to distinct draws.
- The sources do not define a move-count draw. Do not invent a 50-move rule without a separate decision.

## Variant and popularity selection

### Takeaway

Use standard 8×8 Dameo. The sources establish it as the canonical edition and document the most; they do not establish a measurable popularity winner over the 10×10 “Big Dameo” variant, so the project must not claim the choice is statistically most popular.

### Cited Findings

- Wikipedia identifies the standard 8×8/18-men game as Dameo and mentions “Big Dameo” only as a 10×10 variant in its external links. It gives no adoption figures or comparative ranking for either form. [Dameo article](https://en.wikipedia.org/wiki/Dameo)
- BoardGameGeek's standard Dameo entry lists 83 ratings, 49 comments, a 7.5 average, and digital implementations including Abstract Play, Ai Ai, BoardSpace, and igGameCenter (snapshot accessed 2026-11-25). The entry points to MindSports as the official website. This is one site's community signal, not evidence that standard Dameo is more popular than Big Dameo in the broader population. [BoardGameGeek: Dameo](https://boardgamegeek.com/boardgame/24698/dameo)
- Wikipedia says the standard game has had online tournaments on Little Golem, BrainKing, and igGameCenter; it also lists the standard game's original 2002 magazine article and the 2017 “Meet Dameo!” rules/strategy booklet. [Dameo article](https://en.wikipedia.org/wiki/Dameo)
- PlayStrategy announced the standard variant's addition to its draughts platform in December 2025 and described an introductory tournament and later tournament schedule. [PlayStrategy: “Dameo is here!”](https://playstrategy.org/blog/aTAluBIAACUADOff/dameo-is-here%21)
- The creator describes Dameo as inspired by Croda and created in 2000. [MindSports: About Dameo](https://mindsports.nl/index.php/arena/dameo/64-about-dameo)

### Inferences

- The 8×8 standard is the best-supported implementation target: it has the creator's complete rule page, a creator-authored history, independent rule transcriptions, a dedicated FMJD-hosted survey, and multiple online implementations/tournament references. Big Dameo has a Wikipedia reference to a BGG thread but no comparable full rule authority or adoption evidence in the sources reviewed.
- This is an evidence-based choice of the canonical, best-documented form, not a popularity claim. Do not fork the 10×10 board into v1 unless further research finds authoritative rules and meaningful adoption data.

### Gaps

- No source found provides comparative play counts, tournament participation, downloads, or survey data for standard Dameo versus Big Dameo. BoardGameGeek ratings and platform availability are only limited proxies.
- The Big Dameo 10×10 rules and current play community were not independently verified from a dedicated primary source; its existence is reported by the Wikipedia article, which links to a BGG forum thread.
