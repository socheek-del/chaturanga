# Fortress Chess edition and popularity comparison

## Which edition does the Wikipedia entry identify, and what should the product implement?

### Takeaway
The list entry points to the historical Russian four-player game called “Fortress chess” or “Russian Four-Handed chess,” not to a documented popular modern edition. For a faithful historical implementation, use Alexander Petrov’s 1850 description, checked against his 1862 Russian article; this is a source-quality choice, not a popularity choice.

### Cited Findings
- The list’s “Fortress chess (Russia) (~18th century)” entry links to a separate article identifying the game as a four-player Russian variant of the 18th and 19th centuries, also known as Russian Four-Handed chess. The article describes a 192-square board with four corner fortresses. — [Wikipedia: List of abstract strategy games](https://en.wikipedia.org/wiki/List_of_abstract_strategy_games#Chess_and_chess-like_games); [Wikipedia: Fortress chess](https://en.wikipedia.org/wiki/Fortress_chess)
- Georgi Markov’s historical study identifies Petrov’s 1850 German article, “Das Vierschach mit Festungen,” and his nearly identical 1862 Russian description as the only detailed firsthand descriptions reliable enough to reconstruct play; Butrimov’s 1821 account is earlier but too brief to provide all rules. — [Markov, “Russian four-handed chess: myths and misconceptions,” *Board Game Studies Journal* 9 (2015), 41–49](https://bgsj.ludus-opuscula.org/PDF_Files/41_49_Markov_web.pdf); [National Museum of Natural History, Bulgarian Academy of Sciences publication record](https://www.nmnhs.com/e-natura/staff-publications/markov-georgi-en-p-1.html)
- A modern digital rules entry labels its model “Russian Fortress Chess,” explicitly cites Markov (2015) and Petrov (1850), and describes the same historical four-player game. This is an implementation/catalog record, not evidence of a separately established or popular modern edition. — [Ludii Portal: Russian Fortress Chess](https://ludii.games/details.php?keyword=Russian+Fortress+Chess)
- Markov says the supposed distinction between “Russian” and “Western European” fortress chess arose from later misreadings of Glyazer; the London Four-handed Chess Club founded in 1885 played general four-handed chess under Verney’s rules, not the Russian fortress game. — [Markov (2015)](https://bgsj.ludus-opuscula.org/PDF_Files/41_49_Markov_web.pdf)

### Inferences
- The Russian game is the correct target for the Wikipedia list item; treating generic European four-handed chess or later two-player “fortress chess” adaptations as the same edition would change the product’s player count and rules.
- Petrov’s 1850/1862 record is the best-supported edition to implement because it is the most complete and firsthand rules source. The product should identify the choice as “Russian Four-Handed Fortress Chess (Petrov description)” and avoid implying that it is a currently popular tournament standard.

### Gaps
- No separate Russian Fortress Chess edition with stronger modern popularity evidence surfaced in this comparison.
- The exact setup wording needs adjudication against Petrov’s original text: Markov describes the extra rook, bishop, and knight as randomly positioned in each fortress, while Wikipedia and Ludii describe players choosing their placements. The implementing rules research should record the selected reading and cite the original-language passage.

## Is there credible evidence that this specific Russian variant was popular?

### Takeaway
The strongest source located argues that Russian four-handed fortress chess was not particularly popular in Petrov’s time. A later Russian-language historical overview calls it popular, but supplies no count or tournament record in the passage; available evidence does not support selecting it as a “most popular” variant.

### Cited Findings
- Markov reports that the 1862 rules were published after readers requested them, which he interprets as a sign that fortress chess was hardly a well-known pastime. He also cites Petrov’s letter saying it was “not particularly popular” and that only a few people in St. Petersburg played, listing I. Butrimov among them. — [Markov (2015), “Game popularity” section](https://bgsj.ludus-opuscula.org/PDF_Files/41_49_Markov_web.pdf)
- Markov says it is impossible to determine whether Coxe’s 1784 report describes this same game; consequently the limited evidence in Petrov’s period cannot establish whether the game had once been more widespread or was never broadly played. — [Markov (2015)](https://bgsj.ludus-opuscula.org/PDF_Files/41_49_Markov_web.pdf)
- A 2023 Russian-language overview says that Russian four-handed chess with fortresses “had popularity” in Russia in the 18th–19th centuries, but the cited passage gives no participation figures, club, event, or other measure. — [“Большая Евразия: развитие, безопасность, сотрудничество,” 2023, PDF p. 32](https://inion.ru/site/assets/files/7614/2023_e_bol_shaia_evraziia_6_1.pdf)
- A 2019 Russian chess-teaching classification lists four-player fortress chess as item 6 under “historical chess,” while its separate “currently best-known and widespread” classification lists contemporary national, multiplayer, and board-form variants. The document is a taxonomy, not measured participation data. — [“Классификация нетрадиционных видов шахмат,” 2019, table 3](https://dussh-kaissa.ru/wp-content/uploads/2019/01/%D0%9C%D0%B5%D1%82%D0%BE%D0%B4%D0%B8%D1%87%D0%B5%D1%81%D0%BA%D0%B8%D0%B5-%D1%80%D0%B5%D0%BA%D0%BE%D0%BC%D0%B5%D0%BD%D0%B4%D0%B0%D1%86%D0%B8%D0%B8-%D0%BD%D0%B5%D1%82%D1%80%D0%B0%D0%B4%D0%B8%D1%86%D0%B8%D0%BE%D0%BD%D0%BD%D1%8B%D0%B5-%D1%88%D0%B0%D1%85%D0%BC%D0%B0%D1%82%D1%8B..pdf)

### Inferences
- Petrov’s contemporaneous account, as analyzed by a specialist historian, is stronger evidence about 19th-century player prevalence than an unsupported broad descriptor in a much later overview.
- The sources support historical existence and some play, but not a comparative ranking among variants or a present-day popular edition. The “pick the most popular variant” rule cannot be satisfied with defensible evidence for this entry; pick the documented Petrov edition instead.

### Gaps
- No attendance, membership, sales, circulation, or player-count series was found.
- No modern tournament circuit or active club devoted specifically to Russian four-handed fortress chess was located. This is a search finding, not proof that no informal games or groups exist.
- The available sources do not quantify what the 2023 overview means by “popularity,” and Markov’s interpretation of Petrov’s evidence conflicts with that later characterization.

## What club, tournament, and naming evidence distinguishes it from other four-handed chess?

### Takeaway
The specific fortress game has a distinct historical name and setup, but the reported 1885 London club is evidence for a different general four-handed chess tradition. No reliable tournament/club evidence located establishes the Russian fortress variant as a modern organized game.

### Cited Findings
- The historically specific titles are Petrov’s German “Das Vierschach mit Festungen” (1850) and Russian “Kratkoe opisanie chetvernoi shakhmatnoi igry s krepostiami” (1862); Markov’s English title translates this as “Russian four-handed chess.” — [Markov (2015), references and discussion](https://bgsj.ludus-opuscula.org/PDF_Files/41_49_Markov_web.pdf); [National Museum of Natural History, Bulgarian Academy of Sciences publication record](https://www.nmnhs.com/e-natura/staff-publications/markov-georgi-en-p-1.html)
- Markov corrects the claim that Russian fortress chess spread west and had a London club in 1855: the documented London Four-handed Chess Club began in 1885 and used Verney’s (later Hughes-Hughes’s) rules for general four-player chess. — [Markov (2015)](https://bgsj.ludus-opuscula.org/PDF_Files/41_49_Markov_web.pdf)
- A 2023 overview separately labels “Russian four-player chess with fortresses” and “European four-player chess,” describing the latter as the standard board plus three extra rows on each side. This confirms that the two names are being distinguished in later Russian-language writing, though it does not provide modern participation evidence. — [2023 overview, PDF p. 32](https://inion.ru/site/assets/files/7614/2023_e_bol_shaia_evraziia_6_1.pdf)
- The 2019 taxonomy also lists “four-player chess with fortresses” separately from generic “Four-Chess” and 160-cell four-player chess. — [2019 taxonomy, table 3](https://dussh-kaissa.ru/wp-content/uploads/2019/01/%D0%9C%D0%B5%D1%82%D0%BE%D0%B4%D0%B8%D1%87%D0%B5%D1%81%D0%BA%D0%B8%D0%B5-%D1%80%D0%B5%D0%BA%D0%BE%D0%BC%D0%B5%D0%BD%D0%B4%D0%B0%D1%86%D0%B8%D0%B8-%D0%BD%D0%B5%D1%82%D1%80%D0%B0%D0%B4%D0%B8%D1%86%D0%B8%D0%BE%D0%BD%D0%BD%D1%8B%D0%B5-%D1%88%D0%B0%D1%85%D0%BC%D0%B0%D1%82%D1%8B..pdf)

### Inferences
- “Fortress chess” is an ambiguous short label; product-facing and internal docs should use “Russian Four-Handed Fortress Chess” to keep it distinct from European four-player chess and Markov’s modern two-player fortress adaptations.
- A club or tournament result for generic four-player chess should not count as popularity evidence for this historical variant unless the source confirms the fortress board and rules.

### Gaps
- No contemporary club roster, tournament report, federation record, or event result specifically for Russian Fortress Chess was located.
- It remains uncertain whether Coxe’s 1784 account refers to this exact variant, as Markov notes that the surviving description does not settle the identification.
