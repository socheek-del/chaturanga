# Hive implementation plan

## Status

Blocked before implementation while digital adaptation rights remain unverified. The rules and adoption review selects the base two-player Hive rules as the planning default, without claiming it is the most popular edition. No publisher contact has been made.

## Rules selection

Use Gen42's base two-player Hive game. Its official rules describe an 11-piece hand for each player, a shared boardless hive, the Queen Bee surround objective, creature-specific movement, the one-hive connectivity rule, the Queen placement deadline, and the official expansion pieces as separate additions. The roadmap selects the base edition; do not silently add expansions. Sources:

- [Official Hive rules PDF](https://www.gen42.com/wp-content/uploads/Hive-rules.pdf)
- [Gen42 Hive Ultimate product page](https://www.gen42.com/product/hive-ultimate/), which describes the expansion-inclusive edition and lists two players
- [Gen42 About Us](https://www.gen42.com/about-us/), which identifies John Yianni as Hive's inventor and invites digital games developers to contact the publisher

Available sources support the base rules as the canonical product profile. They do not establish comparative usage rates between base Hive and expansion combinations, so do not claim a popularity winner.

## Rights gate

The publisher's official rules PDF carries a 2010 Gen42 Games copyright notice and names John Yianni as author. Gen42's About Us page invites digital games developers to contact it, but no general public license for an independent Hive digital adaptation was found in the official pages reviewed. The Gen42 website terms reserve rights in website contents and require prior written permission for reuse of those contents; that statement is not treated as a legal ruling about abstract game mechanics.

Under the repository's per-product rights gate, a faithful implementation must not start until an applicable license or written permission for this digital adaptation is established. The owner has not authorized an external contact. Do not reuse official tile art, logo, diagrams, rule text, or product identity while blocked.

The source review is recorded in [`reports/Hive rules adoption and rights.md`](reports/Hive%20rules%20adoption%20and%20rights.md) with source notes in [`research_notes/Hive rules adoption and rights/`](research_notes/Hive%20rules%20adoption%20and%20rights/).

## If rights are cleared

Before engine work, pin any remaining setup, repetition, draw, and expansion conventions in `packages/hive/RULES.md`. Then build a separate English-first product with a pure serializable rules engine, bounded deterministic bots, complete interactive tutorials, same-device play, private two-player rooms, an original boardless interface, and isolated Melon deployment. Public release requires a separate check of the permission terms, site address, DNS/TLS, and HTTPS/WebSocket behavior.
