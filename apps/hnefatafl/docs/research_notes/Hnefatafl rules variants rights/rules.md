# Copenhagen 11×11 Hnefatafl Rules

## Board, seats, setup and movement

### Takeaway

Copenhagen is a two-player asymmetric game on an 11×11 board: 24 attackers move first against 12 defenders and a king. Every piece slides orthogonally along empty squares; restricted throne/corner cells constrain where pieces may stop and may act as hostile capture squares.

### Cited Findings
- The current Copenhagen 11×11 rules identify two sides, attackers and the king's side; attackers move first, then turns alternate. All pieces move any number of vacant squares in a row or column, like a rook. [Aage Nielsen, Copenhagen Hnefatafl rules](https://aagenielsen.dk/copenhagen_rules.php)
- The official setup diagram has 24 attackers: five on each of the top and bottom rows, a further attacker immediately inward from each group, plus five on each side edge and one further inward at each side's midpoint. The defenders make a central cross of 12 ordinary defenders plus a king on the central throne. [Copenhagen 11×11 rules PDF, setup diagram](https://aagenielsen.dk/Copenhagen_Hnefatafl_11x11.pdf)
- The PDF explicitly describes an 11×11 board, a king's side and attackers, and attackers twice the number of ordinary defenders. Its diagram specifies the initial array. [Copenhagen 11×11 rules PDF](https://aagenielsen.dk/Copenhagen_Hnefatafl_11x11.pdf)
- Only the king may occupy the central throne and four corner squares; the king may re-enter the throne and any piece may pass through it while empty. The throne is hostile to attackers at all times, and hostile to defenders only while empty; corners are restricted and hostile; board edges themselves are not hostile. [Aage Nielsen, Copenhagen Hnefatafl rules](https://aagenielsen.dk/copenhagen_rules.php)

### Inferences
- For a setup fixture, use 24 attackers, 12 ordinary defenders, and 1 king. The textual placement description is enough to count pieces, but the diagram should be transcribed and checked cell by cell before engine setup is accepted. [Copenhagen 11×11 rules PDF](https://aagenielsen.dk/Copenhagen_Hnefatafl_11x11.pdf)
- In this ruleset, “twice as many attackers as defenders” counts ordinary defenders separately from the king: the official diagram has 24 attackers, 12 ordinary defenders and one king. [Copenhagen 11×11 rules PDF](https://aagenielsen.dk/Copenhagen_Hnefatafl_11x11.pdf)

### Gaps
- The rule text references a starting-position image rather than a coordinate listing. Transcribe coordinates from the official diagram and independently verify its rotation/reflection before creating a fixture. [Aage Nielsen, Copenhagen Hnefatafl rules](https://aagenielsen.dk/copenhagen_rules.php)

## Captures, the king, shieldwalls and exit forts

### Takeaway

Ordinary taflmen are captured by sandwiching; the armed king has a special surround rule and is immune to capture on the edge. Copenhagen additionally uses shieldwall capture, full encirclement, and a defender exit-fort win.

### Cited Findings
- A non-king piece is captured when a just-completed move sandwiches it orthogonally between two enemies or between an enemy and a restricted square. Capture is not automatic for a piece that moves between existing enemies; the capturing move must close the trap. The king may participate in captures. [Aage Nielsen, Copenhagen Hnefatafl rules](https://aagenielsen.dk/copenhagen_rules.php)
- Shieldwall capture takes a contiguous edge row of two or more enemy pieces bracketed at both ends, provided each has an enemy piece directly in front. A corner can substitute for one endpoint. The capture must be made by a flanking move. The king may help form/capture the shieldwall or bracket it; a king inside a captured shieldwall is not removed, though other enclosed defenders are. [Copenhagen 11×11 rules PDF, §3.1](https://aagenielsen.dk/Copenhagen_Hnefatafl_11x11.pdf)
- The king wins for defenders by reaching any corner square. Defenders also win with an exit fort when the king touches the board edge, has a legal move, and attackers cannot break the fort. [Aage Nielsen, Copenhagen Hnefatafl rules](https://aagenielsen.dk/copenhagen_rules.php)
- The armed king is captured by attackers on all four orthogonal sides except adjacent to the throne, where the three remaining sides suffice because the throne supplies the fourth. The king cannot be captured on a board edge. [Aage Nielsen, Copenhagen Hnefatafl rules](https://aagenielsen.dk/copenhagen_rules.php)
- Attackers also win by forming an unbroken ring around the king and every remaining defender, even without capturing pieces. [Aage Nielsen, Copenhagen Hnefatafl rules](https://aagenielsen.dk/copenhagen_rules.php)

### Inferences
- King capture is an ending condition, not an ordinary sandwich capture. The engine should evaluate it separately from the standard two-sided capture rule and from shieldwall resolution. [Aage Nielsen, Copenhagen Hnefatafl rules](https://aagenielsen.dk/copenhagen_rules.php)
- The edge-fort rule requires determining whether the attackers can ever break a formation, not simply checking a static surrounded pattern; its tutorial should explicitly teach the rule's “impossible to break” test. [Aage Nielsen, Copenhagen Hnefatafl rules](https://aagenielsen.dk/copenhagen_rules.php)

### Gaps
- The rules define an exit fort by an impossibility condition and show examples, but do not provide a machine-oriented test. A digital adjudication must either implement the full reachability/fort test or document a narrower convention with source support. [Copenhagen 11×11 rules PDF, §5.1](https://aagenielsen.dk/Copenhagen_Hnefatafl_11x11.pdf)
- The detailed shieldwall text says capture only follows a flanking move; some later summaries omit this nuance. Use the official Copenhagen PDF wording and test corner substitutions and king-in-wall cases from its diagrams. [Copenhagen 11×11 rules PDF, §3.1](https://aagenielsen.dk/Copenhagen_Hnefatafl_11x11.pdf); compare [Taflhús Copenhagen rules explanation](https://taflhus.com/learn/rules)

## Outcomes, repetitions, and edition history

### Takeaway

Copenhagen adds shieldwalls, encirclement, exit forts and explicit no-move/repetition outcomes to the earlier Fetlar rules. A player with no legal move loses; impossible-to-end positions are draws; perpetual repetition is forbidden and loses for the defenders. The precise treatment of non-perpetual repeated positions should be pinned before implementation.

### Cited Findings
- Aage Nielsen's rules summary dates the collaboration by Nielsen, Adam Bartley and Tim Millar to 2012. Copenhagen was created after Fetlar to close a draw-fort loophole and repetition gap; the additions were encirclement, banning repetitions except the defender loses, removing all draws except positions with too few pieces to finish, retaining an exit-fort win, and adding shieldwall capture. [Aage Nielsen, Copenhagen Hnefatafl summary](https://aagenielsen.dk/copenhagen_summary.php)
- The rules say a player unable to move loses. If the game cannot be ended, for example because both sides have too few pieces left, it is a draw. Perpetual repetition is forbidden and “results in a loss for White”; in this ruleset White is the defender. [Aage Nielsen, Copenhagen Hnefatafl rules](https://aagenielsen.dk/copenhagen_rules.php)
- The current World Tafl Federation championship page lists Copenhagen Hnefatafl 11×11 as a tournament line and says Copenhagen rules have been used for World Championships on the site from 2013 through 2026. It also distinguishes this modern tournament ruleset from separately labeled historical Hnefatafl. [World Tafl Federation Championship 2026](https://aagenielsen.dk/wtfturnering2026.php); [Copenhagen Hnefatafl summary](https://aagenielsen.dk/copenhagen_summary.php)
- The official rules page identifies the collaborators and credits Adam Bartley with the English text and diagrams; as of the checked page it was updated 21 August 2026. [Aage Nielsen, Copenhagen Hnefatafl rules](https://aagenielsen.dk/copenhagen_rules.php)

### Inferences
- Copenhagen 11×11 is a well-supported, actively used tournament standard, but it is a modern rules reconstruction, not a direct recovery of a single historically complete Viking ruleset. [Aage Nielsen, Copenhagen Hnefatafl summary](https://aagenielsen.dk/copenhagen_summary.php); [World Tafl Federation Championship 2026](https://aagenielsen.dk/wtfturnering2026.php)
- “White loses” on perpetual repetition should be modeled as a defender loss only for the source's defined perpetual case. The sources do not specify whether any position occurring for a third time is automatically a loss; do not silently import another game's threefold rule. [Aage Nielsen, Copenhagen Hnefatafl rules](https://aagenielsen.dk/copenhagen_rules.php)

### Gaps
- The wording “perpetual repetitions” is not algorithmically defined. The 2026 tournament page links to the current rule but does not define a positional threshold in its tournament summary; clarify whether only a demonstrable perpetual cycle or a repeated position is forbidden. [Aage Nielsen, Copenhagen Hnefatafl rules](https://aagenielsen.dk/copenhagen_rules.php); [World Tafl Federation Championship 2026](https://aagenielsen.dk/wtfturnering2026.php)
- The rules do not enumerate all positions that are “not possible to end”; the example is only both sides having too few pieces. Any automatic material/no-possible-win adjudication needs a documented convention. [Aage Nielsen, Copenhagen Hnefatafl rules](https://aagenielsen.dk/copenhagen_rules.php)
- Older Fetlar, “Old Hnefatafl,” and historical 9×9/13×13 rules differ. Do not copy their starting side, escape edges, king capture, or draw rules into Copenhagen 11×11. [Aage Nielsen, Copenhagen Hnefatafl summary](https://aagenielsen.dk/copenhagen_summary.php)
