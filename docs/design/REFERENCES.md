# Design references

## Skills read

The implementer downloaded each source into the session scratchpad and read it as reference material. None of their scripts ran.

| Source | What we took | URL |
|---|---|---|
| Anthropic frontend-design | The list of generated-design defaults (cream plus serif, tracked all-caps eyebrows, middle-dot meta strings, identical rounded cards). Spend boldness in one place. Copy rules: name actions by outcome, errors say what failed and how to fix it. | https://github.com/anthropics/skills/tree/main/skills/frontend-design |
| Impeccable | Craft floor checks (contrast, spacing rhythm, states, browser surfaces). Refuse list (eyebrows, side stripes, glyph icons, cards as the lazy container). Mobile adaptation (bottom navigation, bottom sheets, 44px targets, 16px text). Motion timing table and ease-out curve. | https://github.com/pbakaus/impeccable |
| Taste Skill, app-screens chapter | Colour on data, not chrome. KPIs as type, not tiles. Flat surfaces, a border or a tone step, never both. Tables become two-line rows under 640px. Honest empty, loading and error states. | https://github.com/Leonxlnx/taste-skill |
| Emil Kowalski, emil-design-eng | `scale(0.97)` press feedback, strong ease-out `cubic-bezier(0.23, 1, 0.32, 1)`, drawer curve `cubic-bezier(0.32, 0.72, 0, 1)`, UI motion under 300ms, never ease-in, never from `scale(0)`. | https://github.com/emilkowalski/skills |
| Vercel Web Interface Guidelines | Mobile inputs at 16px, `touch-action: manipulation`, safe-area insets, tabular numbers, inline errors with focus on the first one, `…` for loading, `Intl.NumberFormat`, no `transition: all`. | https://github.com/vercel-labs/web-interface-guidelines |

## Apps whose patterns we copy

We copy patterns only: layout, hierarchy and interaction. No logos, icons, illustrations or brand colours.

### Monzo (UK banking)

- One large balance figure at the top of the account screen, with a short label above and a one-line caption under it. RentReady uses this for the bills saving and the weekly share.
- Transactions as full-width rows: merchant name left, amount right in tabular figures, a small caption line under the name. RentReady uses this for providers and bill lines.
- Bottom tab bar with four or five labelled destinations.

### Splitwise (shared bills)

- Money is always shown as "your share". Totals for the house appear second, in caption size. RentReady shows per-person weekly first and the house total as a caption.
- Green for money you keep, red for money you lose, always with words beside the colour.

### Things 3 (task lists)

- A screen title, then grouped checklists with generous row height and a clear done state.
- Progress shown in words ("4 of 9") rather than as a decorative ring. RentReady uses this for the move-in and move-out hubs and the inspection rooms.

### Airbnb (trips, check-in and check-out)

- Step-by-step flows with one question per screen, a progress bar at the top and the primary button fixed at the bottom of the screen.
- Bottom sheets for detail ("Show all amenities") instead of inline expansion. RentReady uses sheets for "Compare all 7 suppliers".

### Apple Health (summary)

- Grouped white rows on a light grey ground, each row with a label, a value and a chevron. RentReady uses this for the partner billing summary and the "Don't forget" block.

## Further reading checked for specific rules

- WCAG 2.2, non-text contrast (field borders at 3:1): https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html
- Apple Human Interface Guidelines, layout and touch targets (44pt): https://developer.apple.com/design/human-interface-guidelines/layout
- MDN, `env()` safe-area insets: https://developer.mozilla.org/en-US/docs/Web/CSS/env
- Emil Kowalski's skill page: https://emilkowal.ski/skill
- Taste Skill overview (secondary source): https://skillselion.com/guides/design-taste-skill-claude-code
