# Design system — "Wat" (วัด)

The app has its own identity rooted in Makruk's home: Thai temple colours, gold ornament and calm
lacquerware surfaces. It stays friendly and playful for learners without borrowing any other product's
trade dress (owner decision 2026-09-14: no Duolingo look — its fonts, colours, chunky 3D buttons, zig-zag
lesson path or lightning XP are off-limits).

Two moods, one system:

- **App shell and learning — warm and encouraging.** Paper-coloured surfaces, indigo actions, gold rewards,
  soft rounded cards, a temple-stairway lesson path and a friendly mascot.
- **Game screen — calm and focused.** The board is the hero; chrome is compact and quiet.

Live showcase: `/design` (light and dark side by side).

## Open-source foundations

| Piece | Choice | Licence |
|---|---|---|
| Styling | Tailwind CSS v4 with CSS custom-property tokens | MIT |
| Icons | Lucide | ISC |
| Typeface | [Prompt](https://fonts.google.com/specimen/Prompt) by Cadson Demak — Thai + Latin, self-hosted via Fontsource | SIL OFL 1.1 |
| Accessible primitives | Native `<dialog>`, ARIA radio groups and switches (Radix-style patterns, no copied styling) | — |

## Tokens

Defined in `apps/makruk/web/src/index.css` and exposed to Tailwind as colour utilities (`bg-primary`, `text-muted`,
`border-line`, …). Light values sit on `:root` / `[data-theme='light']`; dark values on
`[data-theme='dark']`. Token names are kept stable; `-shadow` means the stronger shade of an accent.

| Token | Light | Dark | Inspiration · use |
|---|---|---|---|
| `canvas` | #f8f4ec | #121226 | Temple paper / night sky · page background |
| `surface` | #fffdf9 | #1a1a33 | Cards, dialogs |
| `surface-2` | #f1eadf | #24254a | Raised / hover areas, tracks |
| `line` | #e3d9c8 | #34365e | Borders, dividers |
| `ink` | #1f1d36 | #f2eee4 | Body text |
| `muted` | #625e78 | #aba8c4 | Secondary text |
| `primary` | #3a3f9b | #9ea4f4 | Indigo · main actions, current item, progress |
| `secondary` | #17866b | #4fc29f | Jade · selection, links, correct answers |
| `danger` | #b63a2b | #f08a7a | Lacquer red · errors, wrong answers, resign |
| `warning` | #d99a1e | #f0c055 | Saffron · hints, counting-rule alerts |
| `gold` | #b7862a | #e2b65a | Temple gold · XP, stars, completed lessons |

**Type:** Prompt for everything (Thai is the default language; layouts allow Thai strings ~20% longer than
English). Weights 400/500/600/700; Tailwind's `font-extrabold` is mapped to 700 so headings stay confident
without looking chunky. No all-caps labels.

**Shape:** buttons and segmented controls are pills (`rounded-full`); cards `rounded-[1.25rem]`; dialogs
`rounded-[1.5rem]`. Borders are 1px. Depth comes from a soft two-layer shadow (`shadow-card`), never from a
thick bottom border.

**Ornament:** a small gold diamond motif (`.motif-diamonds`) echoes Thai temple patterning on unit banners and
hero areas. Use sparingly — one ornament per view.

**Motion:** hover lifts by 1–2px; press settles back with a slight scale-down (150ms); progress fills ease out
over 500ms. `prefers-reduced-motion` disables animation globally.

## Components (`apps/makruk/web/src/components/ui`)

| Component | Notes |
|---|---|
| `Button` / `buttonClasses()` | Pill buttons. Variants: primary (indigo), secondary (jade), outline, danger, warning, ghost. Sizes sm, md, lg, icon. `block` for full width. |
| `Card` | Soft card with `shadow-card`; `interactive` lifts on hover; `tone` tints for feedback. |
| `ProgressBar` | Slim rounded track, solid fill. |
| `Switch` | `role="switch"`, 56×32 touch target, indigo when on. |
| `SegmentedControl` | Pill track; the active option is a raised white chip. |
| `Badge` | Status and reward pills. |
| `Modal` | Native `<dialog>` with a tinted indigo backdrop. |
| `AppShell` | Bottom tab bar on phones, left rail from `md`; brand mark is a gold diamond. |

**Lesson path:** a temple stairway — one column of diamond-shaped steps joined by a dotted gold line, each
with its title and stars beside it. Completed steps are gold, the next suggested lesson is indigo with a
"Start" tag, every other lesson is an open outlined step.

Accessibility rules: every control has an accessible name; minimum touch target 40px; focus rings use
`ring-primary/30`; colour is never the only signal (icons and text accompany correct/wrong states); text on
gold uses dark ink.

## Illustration and piece-art style guide

All art is made in-house as optimised SVG.

- **Mascot:** "ขุนน้อย" (Little Khun) — a round ivory Khun with a gold crown and a jade sash, thick rounded
  outlines and flat fills from the palette. Poses: idle, happy, thinking, sad, celebrate.
- **Illustrations:** flat shapes, 2–3 palette colours per scene, generous space, Thai motifs (temple roof
  lines, lotus, gold diamonds, teak grain) as accents.
- **Pieces:** silhouettes must read at 36px. White pieces use a light fill with a dark outline; black pieces a
  dark fill with a light inner highlight. Each type keeps its traditional Makruk shape (tall crowned Khun,
  rounded Met, pointed Khon, horse-head Ma, boat-hull Ruea, flat cowrie-shell Bia).
- **Piece sets:** three, chosen in settings. "Classic carved" (default) and "Modern flat" are the stylised
  sets. "Traditional wood" (art-003) is the opposite of sleek on purpose: it copies a physical Thai set for
  players who cannot name the stylised pieces. Flat carved silhouettes, one fill and a carved line — no
  gradients, no 3D shading. Sizes are measured from the owner's reference set, as a percentage of a square:
  Khun 50x81, Ma 50x81, Khon 41x70, Met 28x48 (much smaller than the Khon), Ruea 66x50 — the widest and
  lowest piece — and the Bia a 53-wide disc of concentric turning rings, because a Bia lies on the board and
  is seen from above. The turned pieces are generated from lathe profiles; a promoted Bia is the disc turned
  over with the Met's spire cut into it. The pale side is bone with dark cuts; the dark side is near-black
  with pale cuts, so it still reads on the dark board themes.
- **Boards:** Makruk boards are un-checkered — a single colour with grid lines. Themes vary material colour
  and line colour only.
- **Marketing media:** screenshots, GIFs and social images must not show the site's domain (it may change).
