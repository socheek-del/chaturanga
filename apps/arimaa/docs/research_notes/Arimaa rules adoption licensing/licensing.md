# Arimaa Licensing and Permission

## What the Arimaa Public License covers

### Takeaway

Arimaa has an explicit public license, current version 2025.02. It separately protects the name, game and match rules, and board and piece designs; its permission differs by use category. A free public game site is addressed directly, but carries mandatory conditions.

### Cited Findings

- The license says Arimaa is available for educational, research, and personal use while protecting its IP; it defines the name as trademarked and the game/match rules and board/piece designs as copyright-protected. Any use or distribution accepts the license, which Arimaa.com may update. — [Arimaa Public License, version 2025.02](https://arimaa.com/arimaa/license/current.txt)
- The ERP section grants the name and branding for informational or educational use, board and piece design, rules, and game implementation; the page suggests linking to Arimaa.com. But its software example bars commissioning development and public release, so a public product cannot rely on the ERP category. — [Arimaa Public License, §§1, 2025.02](https://arimaa.com/arimaa/license/current.txt)
- The site says prior commercial permissions include physical sets, books, an iPhone app, PC game, and web games. Those examples establish precedent only; they do not confer permission on another project. — [Arimaa license page](https://arimaa.com/arimaa/license/)

### Inferences

- Treat the product’s public release category as controlling; calling the product “educational” does not convert publicly released software into ERP use under the license’s own software example.
- Use original product branding. The license discusses trademarked name and some use of “branding,” but does not separately describe a logo asset or grant use of one in a product identity.

### Gaps

- The public license states that Arimaa is patented, but this review did not verify a patent number, jurisdiction, or current status. — [Arimaa software download page](https://arimaa.com/arimaa/download/)
- The exact scope of the license’s “board design” and “piece design” grant for a particular visual asset was not separately explained.

## Which permission route covers a free public game site

### Takeaway

The Arimaa Public License’s Section 3 explicitly covers publicly distributed software and a free online game site with no revenue from users or advertising. It requires an announcement in the Arimaa Discord and product notices/links; do not deploy publicly until the project can satisfy those terms. If the service takes any revenue, Section 2 applies instead.

### Cited Findings

- Section 3 calls public distribution of Arimaa software and a free website with no user or advertising revenue examples of non-commercial, non-ERP use. It says a product/service announcement in the Arimaa Discord is sufficient for that category. — [Arimaa Public License, §3, 2025.02](https://arimaa.com/arimaa/license/current.txt)
- Section 3 grants the Arimaa name, board design, rules, and game implementation. It requires the product to say it is authorized by Arimaa.com and complies with Section 3, say derivatives must also comply with the Arimaa Public License, clearly display `www.arimaa.com`, link Internet offerings to `http://arimaa.com/arimaa`, state that any end-user rights apply only to the product/service and not to Arimaa, and announce publicly in Discord. — [Arimaa Public License, §3, 2025.02](https://arimaa.com/arimaa/license/current.txt)
- Section 2 treats charges, advertising, sponsorship and other revenue as commercial use, including a free-to-user site supported by advertising. It requires a commercial licensing agreement, at least 1% of revenue shared with Arimaa.com, a public Discord announcement, attribution that the product is under license and Section 2, and annual payment by the end of January. — [Arimaa Public License, §2, 2025.02](https://arimaa.com/arimaa/license/current.txt)
- The license’s contact page accepts questions through a form. It was not used; no rights-holder contact or Discord announcement was sent for this research. — [Arimaa.com contact form](https://arimaa.com/arimaa/contact/)

### Inferences

- For the repository’s no-fee, no-ad product model, Section 3 appears to be the relevant route for public distribution, provided the owner makes the required community announcement and the required notices/links ship with the product.
- A server bill paid by the owner is not itself identified as revenue in the license; charging users or receiving ads/sponsorship is explicitly commercial.
- The repository’s no-outbound-messages rule means the required Discord announcement must be made by an authorized owner or separately authorized before public launch. No permission message should be sent implicitly during implementation.

### Gaps

- The license does not specify whether its Discord announcement must happen before development, before a public beta, or before a production launch. The exact sequence is unverified; ask through the official contact form if that distinction matters.
- If the product later adopts fees, ads, sponsorship or other revenue, the commercial route and revenue accounting would need to be confirmed for that business model.

## Software, artwork, text, and tournament materials

### Takeaway

An Arimaa game license is not a license to reuse any engine’s source code, and an engine’s open-source license is not permission to use the Arimaa game. The project can avoid asset ambiguity by writing original lessons and using original art; any code reused must meet its own license as well as the game license.

### Cited Findings

- The official download page says downloads are under the Open Software License 2.1 unless a file says otherwise; those rights apply only to downloaded files, not the game. It also says derivatives of downloads must comply with the Arimaa Public License. — [Download Arimaa Software](https://arimaa.com/arimaa/download/)
- The official page identifies the `bot_Akimot` source as GNU GPL licensed; its GitHub repository lists GPL-3.0. That license governs that program’s code only, and adopting it would require separate GPL compliance in addition to the Arimaa game’s public-license conditions. — [Official software list](https://arimaa.com/arimaa/download/); [Akimot repository](https://github.com/tomik/akimot)
- The official rules page states that its rules may be copied/distributed under the Arimaa Public License. The APL itself grants rules use in Sections 1–3, subject to the selected category’s restrictions and notices. — [Official game rules](https://arimaa.com/arimaa/learn/rulesIntro.html); [Arimaa Public License](https://arimaa.com/arimaa/license/current.txt)
- For paid tournaments, Section 2 treats registration, entry and sponsorship fees as commercial use. Section 3 separately lists a tournament with no registration fee or other income as non-commercial; its Discord announcement and other Section 3 terms still apply. — [Arimaa Public License, §§2–3, 2025.02](https://arimaa.com/arimaa/license/current.txt)
- The official download page offers 2D/3D piece files and paper-set PDFs but its top-level OSL 2.1 statement allows file-specific exceptions. The individual art packages were not opened or audited here. — [Download Arimaa Software](https://arimaa.com/arimaa/download/)

### Inferences

- The repo should independently author tutorial prose and a distinctive visual identity. Section 3 grants the game, name, board design, and rules, but its list does not expressly include piece design (in contrast to Sections 1 and 2); using original piece art avoids relying on that omission’s interpretation.
- If any official art or code is reused, retain its exact file-level license and notices, then also satisfy the applicable Arimaa Public License category.
- A bot written from scratch still implements Arimaa and is subject to the game license; use of an open-source Arimaa engine adds that engine’s own code license.

### Gaps

- The individual 2D/3D art files’ included license notices were not inspected; do not reuse them until their package-specific terms are verified.
- Section 3 expressly allows the Arimaa name but not “branding” as a separate bullet; logo use and any broader trademark presentation should be clarified before copying official marks.
