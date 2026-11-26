# Ko Shogi adoption

## Historical record and rules baseline

### Takeaway

Ko Shogi is best treated as a historical game reconstruction. The available record does not establish a historically played or currently popular rules edition.

### Cited Findings

- Ko Shogi (廣象棋, “wide/broad shogi”) is described as a 19×19 Go-board game with 90 pieces per side and 34 piece types, partly incorporating xiangqi. The article attributes it to Ogyū Sorai and cites the 1770 *Kōshōgifu* and 1773 *Kōshōgifugukai* commentary ([Ko Shogi overview and references](https://en.wikipedia.org/wiki/Ko_shogi)).
- Tohoku University’s archival record catalogs the *Kōshōgifu* as a Japanese book printed in Meiwa 7 (1770), with digitized images available from the record ([Tohoku University digital archive](https://touda.tohoku.ac.jp/collection/database/library/10010000019232)). Kanazawa City Library catalogs the *Kōshōgifu* and *Kōshōgifugukai* together as a two-volume work spanning Meiwa 7 to An’ei 2 (1770–1773) ([Kanazawa Library holdings](https://www2.lib.kanazawa.ishikawa.jp/kinsei/wahon.htm)).
- The two texts do not settle every rule identically. The overview identifies discrepancies about shooting, promotion effects, and piece roles, and notes some rules are absent or unclear in the 1770 text ([Ko Shogi notes on source differences](https://en.wikipedia.org/wiki/Ko_shogi#Notes)).
- The wider shogi-variant overview says there is “no evidence that it was ever played” and notes that historical sources for large variants can disagree on details, including piece moves ([Shogi variant overview](https://en.wikipedia.org/wiki/Shogi_variant#Historical_variants)).

### Inferences

- The best-sourceable implementation baseline is a clearly named modern reconstruction based on the 1770 *Kōshōgifu*, cross-read with the 1773 commentary. The product rules should record each conflict and the selected convention instead of implying that a single uncontested historical ruleset survives.
- The archive metadata establishes surviving texts and their dates; it does not establish that Sorai’s game was played or that all circulating modern reconstructions follow one agreed interpretation.

### Gaps

- The cited archive pages provide catalog records and digitization access, but this research did not independently transcribe or collate all original Japanese text. Exact rule adjudications still require direct source review.
- No modern scholarly critical edition or complete comparative study of the two texts was located in this pass.

## Catalog entry and popularity comparison

### Takeaway

The roadmap’s separate Ko Shogi entry is consistent with the requested Wikipedia scope. Chu Shogi is the supported large-board choice for the distinct “Shogi variants” entry; that does not make it a Ko Shogi variant or a popularity winner within Ko Shogi.

### Cited Findings

- The target Wikipedia list presents “Ko Shogi” and “Shogi variants” as two separate bullets, and its Ko Shogi bullet gives “1997” ([target list section](https://en.wikipedia.org/wiki/List_of_abstract_strategy_games#Chess_and_chess-like_games)). The list carries a “needs more citations” banner ([list article notice](https://en.wikipedia.org/wiki/List_of_abstract_strategy_games)).
- The same list’s separate “Shogi variants” entry points to a broad category. Its variant overview calls Chu Shogi the most popular large-board variant and says it retained some adherents in the West, while Ko Shogi is separately described as having no evidence of ever being played ([Shogi variant overview](https://en.wikipedia.org/wiki/Shogi_variant#Historical_variants)).
- The rollout roadmap explicitly chooses Chu Shogi for “Shogi variants” and says Ko Shogi is a “Separate entry” whose modern reconstruction should be pinned before compound-move bot work ([repository roadmap](../../../../../docs/CHESS-LIKE-ROADMAP.md#build-order)).
- The Ko Shogi article’s historical account places the game around the turn of the 18th century and points to 1770/1773 texts, which conflicts with the list’s bare “1997” date ([Ko Shogi overview](https://en.wikipedia.org/wiki/Ko_shogi); [archival catalog for the 1770 text](https://touda.tohoku.ac.jp/collection/database/library/10010000019232)).

### Inferences

- “Most popular” is not a meaningful selection criterion among documented Ko Shogi editions on the evidence found: the source trail points to a reconstruction problem, not multiple established communities or tournament standards.
- The list’s “1997” date is not corroborated by the sources found and should not be interpreted as Ko Shogi’s origin date. The available evidence establishes a 1770 printed rules text and 1773 commentary; it does not explain the list’s 1997 label.
- The roadmap’s distinction is sound: implement Chu Shogi as the representative of the umbrella “Shogi variants” item and implement Ko Shogi separately as the specifically named historical game.

### Gaps

- “Most popular large-board variant” is an encyclopedic qualitative characterization, not a participation census. No comparative player counts or tournament statistics across shogi variants were located.
- The 1997 date in the target list remains unexplained and weakly sourced.

## Present-day adoption and selection recommendation

### Takeaway

No specific Ko Shogi form can honestly be called “most popular” from the available evidence. Describe the product as an established-source reconstruction and keep adoption claims modest.

### Cited Findings

- The strongest direct statement about historical uptake is that no evidence Ko Shogi was ever played ([Shogi variant overview](https://en.wikipedia.org/wiki/Shogi_variant#Large_variants)). This is an encyclopedia’s summary, not proof that no individual ever played it.
- Searches found modern reference/catalog listings, including [Analog.Games’ Ko Shogi entry](https://analog.games/games/2cbfde7b-d449-446b-8df7-0a0c497acb14/ko-shogi), but a listing documents discoverability, not a player base, event activity, or comparative popularity.
- An event page for the Chu Shogi national tournament mentions other old games, “小象棋” and “禽象棋,” as materials available between matches, with rules from general literature ([Chu Shogi tournament information](https://www.cha-cafe.jp/cyu-syougi/index.htm#)). The names are not “廣象棋,” Ko Shogi’s name; this page is not evidence that Ko Shogi was played at that event.

### Inferences

- Recommended selection wording: “Ko Shogi reconstruction based on Sorai’s 1770 *Kōshōgifu* and the 1773 *Kōshōgifugukai* commentary; where they conflict, the implementation documents its chosen convention.” Avoid “most popular,” “standard tournament edition,” or claims of an active Ko Shogi community.
- Modern digital listings or a playable app can support access and future participation, but they cannot retroactively establish historical adoption or a pre-existing popularity ranking.

### Gaps

- No reliable current Ko Shogi participation counts, recurring Ko Shogi tournament results, recognized association rules, or comparative online activity data surfaced. Absence of such evidence in this search is not proof that no modern players or informal play exist.
- Whether a modern reconstruction has a rights or attribution condition is outside this adoption review and should be resolved in the separate rights research.
