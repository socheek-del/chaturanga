# Fortress Chess Rules and Rights

Research accessed 2026-11-25. This is a source-grounded implementation note, not a legal opinion.

## Who is the likely source of the Russian Fortress Chess variant, and what is the primary rules basis?

### Takeaway

The historically attested Russian variant is associated with Alexander (Aleksandr) Petrov’s 1850 article, “Das Vierschach mit Festungen,” but the research does not establish that Petrov invented the game. The article is cited as appearing in *Schachzeitung*, volume 5, pages 377–384; a contemporary chess manual independently points readers to Petrov’s report and describes the fortress-board concept.

### Cited Findings

- The Library of Congress authority record identifies Petrov as “Petrov, Aleksandr, 1794–1867.” [Library of Congress Authorities](https://authorities.loc.gov/authority/nr88011083?searchFields=lccn)
- Georgi Markov’s 2015 paper is catalogued by the Bulgarian National Museum of Natural History as “Russian four-handed chess: myths and misconceptions,” *Board Game Studies Journal* 9, pages 41–49; Markov’s paper characterizes the 1850 and 1862 Petrov descriptions as the only comprehensive, reliable descriptions in its abstract/indexed text. [Museum staff-publications record](https://www.nmnhs.com/e-natura/staff-publications/markov-georgi-en-p-1.html) · [Markov paper PDF](https://bgsj.ludus-opuscula.org/PDF_Files/41_49_Markov_web.pdf)
- A contemporary 1850s chess manual says Petrov’s “Vierschach mit Festungen” was described in *Berliner Schachzeitung* in 1850, page 377, and describes 16 added fields at each player’s corner with reserve pieces. This is a contemporary reference to Petrov’s article, not the article itself. [TextGrid digitization, *Lehrbuch des Schachspiels*](https://www.textgridrep.org/browse/4bj4w.0)
- A later bibliography identifies the article as A. von Petroff, “Das Vierschach mit Festungen. Aus dem russischen übersetzt von C. F. Jaenisch,” in 1850, page 377. [Russian Biographical Dictionary entry on Wikisource](https://ru.wikisource.org/wiki/РБС/ВТ/Петров,_Александр_Дмитриевич)
- A later scholarly reference list cites the full item as *Schachzeitung* 5, pages 377–384. [Markov and Härtel, “Turkish Great Chess and Chinese Whispers”](https://reference-global.com/article/10.2478/bgs-2020-0003)
- The 1850 bound volume is listed as volume 5 of *Schachzeitung* in a digitized-periodicals index, with a Google Books scan link. [Zan Chess periodicals index](https://zanchess.wordpress.com/2019/03/31/german-chess-periodicals-dsz-wsz/) The Google Books record can be opened at [volume 5, 1850](https://books.google.com/books?id=x61AAAAAcAAJ&pg=PA377), although its page scan could not be retrieved through the research browser during this review.
- The University of Maastricht’s Ludii game record lists Russian Fortress Chess as originating in Russia and cites both Markov (2015) and Petrov (1850). This is a modern digital adaptation and useful corroboration, not the primary historical rules publication. [Ludii Portal: Russian Fortress Chess](https://ludii.games/details.php?keyword=Russian+Fortress+Chess)

### Inferences

- Petrov is a well-supported attribution for the earliest detailed published rules located in this research, but it is safer to describe him as the author of the key surviving rules publication than as the proven inventor of the game.
- For implementation decisions, consult the Petrov source and Markov’s historical analysis; use later summaries only as aids. The sources indicate rule variants and unresolved details, so the implementation should identify the selected historical rule set and document any choice where the record is ambiguous.

### Gaps

- The 1850 Google Books volume is discoverable, but its specific page scan did not load in the research browser. The exact full text, illustrations, and any editorial copyright notices in the source issue therefore were not directly examined here.
- Bibliographic ranges conflict: the English Wikipedia article’s citation gives pages 376–379, while the later scholarly bibliography gives pages 377–384. The inaccessible scan is needed to resolve this precisely. [Wikipedia: Fortress chess](https://en.wikipedia.org/wiki/Fortress_chess) · [Markov and Härtel (2020)](https://reference-global.com/article/10.2478/bgs-2020-0003)
- Markov’s PDF link returned a fetch error in the research browser. Its publication metadata and abstract/indexed excerpts were available through the author’s institution and other indexed copies, but the complete article text was not independently inspected in this pass.
- The sources reviewed do not prove who first devised the variant or establish a single undisputed modern rule set.

## Does the available evidence indicate that permission is needed to implement the game mechanics?

### Takeaway

The evidence supports proceeding with an independent rules implementation: the original rules description dates to 1850, and official U.S. Copyright Office guidance distinguishes a game’s method of play from copyrightable written or visual expression. This is not a conclusion for every jurisdiction, and no blanket worldwide clearance was established.

### Cited Findings

- The U.S. Copyright Office states that a game idea, title, and methods of play are not protected by copyright, while a particular rules text or board/container artwork may qualify if it contains sufficient literary or pictorial expression. [U.S. Copyright Office, “Games”](https://www.copyright.gov/register/tx-games.html)
- U.S. Copyright Act §102(b) says copyright does not extend to an idea, procedure, process, system, method of operation, concept, principle, or discovery, regardless of how it is described or illustrated. [U.S. Copyright Office, Title 17, §102(b)](https://www.copyright.gov/title17/92chap1.html)
- Petrov’s death in 1867 is recorded by the Library of Congress. The date establishes the work’s historical age, but this note does not determine the term or status of any particular edition under every country’s law. [Library of Congress Authorities](https://authorities.loc.gov/authority/nr88011083?searchFields=lccn)
- The sources reviewed identify the original article and later historical scholarship, but do not identify a current game publisher, licensor, or rights holder asserting control over the rules themselves. [Ludii source list](https://ludii.games/details.php?keyword=Russian+Fortress+Chess) · [Markov bibliographic record](https://www.nmnhs.com/e-natura/staff-publications/markov-georgi-en-p-1.html)

### Inferences

- The strongest practical basis found is an independently coded implementation of rule mechanics from the historical source, using newly written rules/tutorial text and newly created software and graphics. Under the cited U.S. guidance, mechanics alone are not an identified reason to seek permission; this should not be generalized into a global legal ruling.
- There is no evidence in the reviewed sources of a separate publisher permission gate for implementing this historic variant. Keep the decision scoped to independent use of mechanics, and do not reuse another author’s protected expression or assets.

### Gaps

- The project is published online internationally; this review did not research the copyright, design, trademark, or database laws of each target jurisdiction.
- No rights search of trademark registries, commercial product catalogs, or private correspondence with Petrov descendants/archives was performed. The sources found provide no indication that such permission is required, but absence from this source set is not proof that no rights claim exists.

## What prose, artwork, branding, web code, or third-party license terms should be kept separate from the game mechanics?

### Takeaway

Write all in-product rules and tutorial content from scratch, draw original boards and pieces, and implement the engine independently. Markov’s modern historical article carries a restrictive noncommercial/no-derivatives license according to the journal license material, while Wikipedia text is CC BY-SA; neither should be copied into the product, and the historical board image’s provenance is not strong enough to rely on for product artwork.

### Cited Findings

- The Board Game Studies Journal’s published open-access license form says noncommercial article use is governed by CC BY-NC-ND 4.0 and disallows commercial use and adaptations; a scholarly-journal catalog also indexes the journal under CC BY-NC-ND. [BGSJ Open Access License form](https://sciendo-parsed-data-feed.s3.eu-central-1.amazonaws.com/BGS/Open_Access_License.pdf) · [JuSER journal record](https://juser.fz-juelich.de/record/852960)
- The Bulgarian National Museum page links Markov’s 2015 paper as a PDF and identifies its title and journal pages. The signed article-specific license was not available in the reviewed materials, so do not assume the general journal form is the complete license history of this specific article. [Museum staff-publications record](https://www.nmnhs.com/e-natura/staff-publications/markov-georgi-en-p-1.html)
- Wikipedia identifies its Fortress Chess article text as CC BY-SA 4.0. Reuse under that license carries attribution and share-alike conditions; independent original prose avoids introducing those obligations. [Wikipedia: Fortress chess](https://en.wikipedia.org/wiki/Fortress_chess)
- Wikimedia Commons labels “Russian Fortress Chess.png” with a Public Domain Mark, but the file page states it was uploaded from a Chess.com article and attributes the historical image to *Schachzeitung* in November 1850. This attribution chain does not itself verify that the digital reproduction is a faithful scan or resolve rights in any Chess.com presentation. [Wikimedia Commons file page](https://commons.wikimedia.org/wiki/File:Russian_Fortress_Chess.png) · [Chess.com article cited as the image source](https://www.chess.com/article/view/double-the-fun)
- The U.S. Copyright Office specifically notes that written rules descriptions and graphic board art can be protected expression even when the game idea/method is not. [U.S. Copyright Office, “Games”](https://www.copyright.gov/register/tx-games.html)

### Inferences

- Treat Petrov’s mechanics and independently verified factual rule details as design inputs; express them with new prose, diagrams, sound, code, and visual identity. Avoid copying Markov’s phrasing, Wikipedia’s article text, Chess.com’s presentation, or the Commons image into the app.
- Do not reuse the Ludii implementation or other modern rules code/art unless its specific license is separately inspected and compatible. The Ludii game page cited in this review does not itself state a reusable license for its implementation asset. [Ludii Portal: Russian Fortress Chess](https://ludii.games/details.php?keyword=Russian+Fortress+Chess)
- Keep product branding distinct from modern commercial products using similar labels; this research found no trademark clearance analysis for “Fortress Chess” or related names.

### Gaps

- The article-specific signed Markov license and any permissions attached to individual figures were not retrieved; avoid copying any article expression or figure unless that permission is separately verified.
- The Commons Public Domain Mark is a rights-status assertion by the file page, not an independently verified chain of title for the scan. Original artwork is the lower-uncertainty product choice.
- No trademark search or code-license review of Ludii, Chess.com, or other modern implementations was performed.
