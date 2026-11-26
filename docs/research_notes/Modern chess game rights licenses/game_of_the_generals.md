# Game of the Generals rights status

Research recheck: 2026-11-27.

## Current primary-source rights status

### Takeaway

No newly reviewed primary source establishes a digital-adaptation license or permission that covers this project. The Game of the Generals product remains blocked before implementation under the repository's documented gate.

### Cited Findings

- The Philippine Game of the Generals Organization's official rules page describes the 8×9 board, hidden setup, movement, challenges and win conditions, and ends with “© 2020 by Philippine Game of the Generals Organization”; it does not publish a reuse or digital-adaptation license. [Official rules](https://philggo.wixsite.com/home/rules)
- The creator-attributed first-person history says Ronnie Pasola Jr. invented the game in August 1967 and describes its public introduction in October 1972. It does not state a present-day rights chain or grant digital-adaptation permission. [PhilGGO history](https://philggo.wixsite.com/home/history)
- The official PhilGGO contact page invites inquiries about the game, tournaments, sponsorship and media; it does not state an authorization policy. No one was contacted. [PhilGGO contact](https://philggo.wixsite.com/home/contact)
- The distributor's current archive identifies 1111 Empire, Inc. as the official global distributor of physical sets. Its page attributes the game to Pasola and says he held the patent, but does not claim to own all present-day rights or offer a digital license. [Elmer Francisco archive](https://elmerfrancisco.org/game-of-the-generals/)
- PhilGGO's account of 1970s history says the Electronic Arbitek was manufactured under license in the United States and that other licensing agreements were then in progress. This documents historical licensing activity, not a current project-wide permission. [PhilGGO account](https://philggo.wixsite.com/home/about)

### Inferences

- The official organization, the physical-set distributor, and the original creator are relevant leads, but the reviewed public pages do not establish which present-day entity can grant this project permission.
- Historical licensing and existing commercial adaptations are not themselves licenses for Chaturanga.

### Gaps

- Current ownership of any relevant patent, trademark, or other rights and authority to license a new digital adaptation remain unverified.
- No applicable public digital-adaptation license or project-specific permission was found in the sources reviewed.

## Existing digital implementations and source licenses

### Takeaway

Existing digital implementations do not supply permission to this project. The public GitHub adaptation checked has no repository license recorded, and Henerals describes itself as independent without publishing a license for reusing its implementation or granting third parties rights in the underlying game.

### Cited Findings

- GitHub's repository API reports `license: null` for the public Android client `rogermadjos/GotGClient`; its root contents do not include a `LICENSE` file. This is a finding about that code repository only, not the underlying board-game rights. [Repository metadata](https://api.github.com/repos/rogermadjos/GotGClient) · [Repository root contents](https://api.github.com/repos/rogermadjos/GotGClient/contents)
- Henerals' current history page calls Henerals an independent implementation and says it does not claim organizational endorsement or certification. [Henerals history](https://henerals.com/history/)
- Henerals' terms, effective 26 October 2026, govern its own service and specify Apple's EULA for its iOS/iPadOS app; they do not offer an adaptation license to third parties. [Henerals terms](https://henerals.com/terms/)
- Mawkins Entertainment's current app-store listing offers another adaptation and names the developer/copyright holder for that app; the listing contains no permission to adapt the original game. [Google Play listing](https://play.google.com/store/apps/details?id=com.mawkins.gotg) · [Apple App Store listing](https://apps.apple.com/us/app/game-of-the-generals-mobile/id1538299546)

### Inferences

- A code license, if one were available for an independent implementation, would cover only rights the licensor controls; it would not, on its own, establish that the licensor can authorize a faithful adaptation of the original title.
- The 2013 GitHub repository is not a usable licensed implementation source: GitHub returns no detected license, and this task also forbids copying existing adaptation code or assets.

### Gaps

- The full code and asset licensing of each existing adaptation was not exhaustively audited; none of the sources reviewed grants Chaturanga rights to reuse them.
- Current authority of any existing adaptation developer to sublicense the underlying game was not established.

## Implementation decision under repository policy

### Takeaway

Keep `game-of-the-generals-001` blocked before implementation. A future step can resume after an applicable license is documented or the owner authorizes and obtains written permission from a verified rights holder; this research did not send any message.

### Cited Findings

- The product plan states that implementation waits for applicable permission or a license and that no rights holder or distributor has been contacted. [Repository product plan](../../../../apps/game-of-the-generals/docs/PLAN.md)
- The official rules page and the current distributor archive establish game and product context, but neither reviewed page provides the required project license or authority chain. [Official rules](https://philggo.wixsite.com/home/rules) · [Distributor archive](https://elmerfrancisco.org/game-of-the-generals/)

### Inferences

- Under the repository rule, unresolved ownership and missing permission are sufficient to keep the implementation gate closed; this is a project-policy conclusion, not a conclusion about what any jurisdiction's law permits.

### Gaps

- To reopen implementation, establish who currently controls the relevant rights and obtain a written grant that covers faithful digital implementation, online distribution and the product's intended licensing model, or identify an applicable public license that expressly covers those uses.
- Before future engine fixtures, the product plan still calls for reconciling the full rank inventory, precedence table, piece exceptions, challenge outcomes and both Flag win conditions against official rules.
