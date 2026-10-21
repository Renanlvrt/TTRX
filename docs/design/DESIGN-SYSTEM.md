> **Superseded 2026-10-21.** The user rejected the white shell, tab bar and Palatinate accent. Current direction: SPEC.md §9 #31 (teal palette, soft corners, Home lobby). Kept for the research notes.

# RentReady mobile design system

The implementer follows this file screen by screen. It distils five sources (see REFERENCES.md): Anthropic frontend-design, Impeccable (craft floor, typeset, animate, adapt), Taste Skill (app-screens chapter), Emil Kowalski's design-engineering skill, and the Vercel Web Interface Guidelines. Student priorities come from STUDENT-NEEDS.md.

## 1. Direction

RentReady is a phone tool a student opens in a cold hallway with one hand. It should feel like a good banking app: calm surfaces, one clear number, one obvious next step. Durham shows up as a single colour, Palatinate, used on the primary action and the key figure. The memorable thing on every screen is the money figure, set large in tabular numerals. Everything around it stays quiet.

### Frozen by tests (do not change)

- `--color-brand: #7E317B`. Purple-hued hexes only from `#7E317B #68246D #5A1F57 #9A4C96 #CBA8C9 #E9DCE8 #F5EEF4`.
- Tokens `--color-brand`, `--color-brand-hover`, `--color-brand-soft`, `--color-ink`, `--color-surface`, `--color-muted`, `--color-line` keep their contrast floors: ink on surface 7:1, muted on surface 4.5:1, brand on surface 4.5:1, white on brand and brand-hover 4.5:1, ink on brand-soft 4.5:1.
- No Tailwind purple, violet, indigo or fuchsia classes. No `bg-gradient-`, `bg-linear-`, `bg-radial-`, `backdrop-blur`, `blur-*` or `drop-shadow-*` classes in `.tsx`.
- UI copy passes `src/copy` rules: no em dashes, no banned words, no adverbs such as just, really or simply.

### Defaults we refuse (from the sources)

| Refuse | Use instead | Source |
|---|---|---|
| Inter as the UI face | IBM Plex Sans (one family) | frontend-design, Taste |
| Cream ground with a high-contrast serif | White ground, neutral stone steps, sans throughout | frontend-design trait 1 |
| Tracked all-caps eyebrow labels ("DURHAM STUDENT HOUSING", "BILLS PACKAGE") | Sentence-case labels at 13 to 14px in muted ink | Impeccable, Taste, frontend-design |
| Meta strings joined with middle dots ("Gilesgate · 4 people · per person") | A short sentence or two labelled values | frontend-design trait 5 |
| Short decorative rule under every page title | Space; the title carries itself | Impeccable craft floor |
| Accent on chrome (solid Palatinate header bar) | White top bar with the wordmark in ink and a Palatinate mark | Taste app-screens |
| Identical cards for every block, card inside card | Divided lists and one container per group | Impeccable, Taste |
| Coloured side stripes thicker than 1px on callouts | A tone step or an icon with words | Impeccable |
| Emoji or Unicode glyphs as icons (✓, 👉) | lucide-react icons, 20px, stroke 1.75, one weight | Impeccable |
| Fade-and-rise on every section | One authored moment: the saving figure counting in on the bills result | Impeccable animate, frontend-design |
| `transition: all` | Name each property | Vercel, Emil |

## 2. Tokens

```css
@theme {
  --font-sans: "IBM Plex Sans", ui-sans-serif, system-ui, sans-serif;
  --font-display: "IBM Plex Sans", ui-sans-serif, system-ui, sans-serif;

  --color-brand: #7E317B;        /* primary action, key figure, selected state */
  --color-brand-hover: #68246D;  /* pressed and hover */
  --color-brand-deep: #5A1F57;   /* text on brand-soft when it needs weight */
  --color-brand-soft: #F5EEF4;   /* selected option fill, focus wash */
  --color-brand-tint: #E9DCE8;   /* selected option border */

  --color-ink: #1C2127;          /* body text; not pure black */
  --color-muted: #4F5761;        /* secondary text, 7.3:1 on white */
  --color-subtle: #67707A;       /* captions and placeholders, 5.0:1 on white, 4.6:1 on canvas */
  --color-surface: #FFFFFF;      /* page ground */
  --color-canvas: #F4F5F6;       /* grouped-list ground, one tone step */
  --color-canvas-strong: #E9EBED;
  --color-line: #E3E5E8;         /* row rules, 1.26:1 on white */
  --color-field-border: #7D858F; /* inputs, 3.7:1 on white, 3.4:1 on canvas */

  --color-positive: #1F6B3A;     /* saving, done: 6.5:1 on white */
  --color-positive-soft: #EAF4ED;
  --color-warning: #8A5300;      /* deadline soon: 6.3:1 on white */
  --color-warning-soft: #FFF6E5;
  --color-negative: #B42318;     /* new damage, money lost: 6.6:1 on white */
  --color-negative-soft: #FDECEA;
}
```

Load IBM Plex Sans 400, 500 and 600 from Google Fonts with `display=swap` and a `preconnect`. Before shipping, confirm in DevTools that `font-variant-numeric: tabular-nums` changes the figure widths; if the served subset drops `tnum`, switch to Source Sans 3, which ships it.

The serif face leaves the UI. Keep it only if a test or the wordmark needs it; the wordmark can be IBM Plex Sans 600 at 18px with the Palatinate mark beside it.

### Colour rules

- One ground (white), one ink, one accent (Palatinate). Grouped lists sit on `canvas` with white rows.
- Palatinate appears on: the primary button, the selected option, the key money figure on a results screen, the active tab icon and label. Nowhere else. Count it on each screenshot: no more than three Palatinate regions per screen.
- Semantic colour says good or bad, never decoration: positive for savings and done, negative for new damage and money at risk, warning for deadlines inside 7 days. Status always carries words or an icon as well as colour.

## 3. Type scale

One family, five sizes, fixed roles. Line lengths stay under 70 characters.

| Role | Size / line height | Weight | Use |
|---|---|---|---|
| Figure | 40/44px, tracking -0.02em, tabular | 600 | The one key number per screen (saving, weekly share, new issues) |
| Title | 24/30px, tracking -0.01em | 600 | Screen title, one per screen, `text-wrap: balance` |
| Heading | 18/24px | 600 | Section headings inside a screen |
| Body | 16/24px | 400 | All running text and inputs (16px stops iOS zoom) |
| Label | 14/20px | 500 | Row labels, button text at small size, values in rows |
| Caption | 13/18px | 400, `subtle` colour | Sources, dates, fine print. Nothing smaller than 12px anywhere |

Rules: sentence case everywhere, including buttons and labels. Numbers in rows are right-aligned and tabular. Money uses `Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' })`. Use `…` for loading and follow-up actions ("Change…"). Non-breaking space between a figure and its unit (`£18.30&nbsp;/ week`).

## 4. Space, shape and depth

- 4px base. Steps: 4, 8, 12, 16, 24, 32, 48.
- Screen margins 16px on phones, 24px from 640px up. Content column max 560px, centred on desktop.
- Inside a group: 8 to 12px. Between groups: 32px. More space above a heading (32px) than below it (12px).
- Radius: 12px on containers, 10px on buttons and inputs, full round on the tab bar indicator and chips only. Children nest at a smaller radius than their parent.
- Depth: a container uses a border (`line`) or a tone step, never both, and no shadow at rest. Only things that float get a shadow: the bottom sheet and the sticky action bar (`0 -1px 0 var(--color-line)` plus `0 -8px 24px rgb(28 33 39 / 0.06)` written in CSS, not a `drop-shadow-` class).

## 5. App shell (mobile first)

```
+----------------------------------+
| [R] RentReady            [?]     |  top bar 52px, white, 1px line under
|----------------------------------|
| Title                            |
| one-line context                 |
|                                  |
|  content ...                     |
|                                  |
|----------------------------------|
| [ Primary action           ]     |  sticky action bar (task screens only)
|----------------------------------|
|  Home    Moving in   Moving out  |  tab bar 56px + safe-area inset
+----------------------------------+
```

- **Top bar:** white, wordmark left (press-and-hold demo toggle stays on it), one icon button right if needed. Back appears as a chevron with the parent's name ("Moving in") on sub-screens.
- **Bottom tab bar:** three tabs, Home, Moving in, Moving out. Icon 22px plus a 12px label, the active tab in Palatinate with a 600 label, inactive in `subtle`. Height 56px plus `env(safe-area-inset-bottom)`. Hidden on desktop (640px and up), where the top bar shows the same three links.
- **Sticky action bar:** on survey, inspection, email and cleaning screens the primary action sits above the tab bar, full width, 48px tall, inside 12px padding plus the safe-area inset when the tab bar is hidden. It stays in the thumb zone; content gets matching bottom padding so nothing hides under it.
- Add `viewport-fit=cover` to the viewport meta, `<meta name="theme-color" content="#FFFFFF">`, `touch-action: manipulation` on `html`, and `-webkit-tap-highlight-color: transparent` with a visible `:active` state instead.
- No horizontal scroll at 360px. Flex children that hold text get `min-w-0`; long provider names truncate with `truncate` and keep a `title`.

## 6. Components

**Button.** Primary: Palatinate fill, white 16px 600 text, 48px tall, radius 10. Secondary: white fill, `field-border` 1px border, ink text. Tertiary: text button in Palatinate, 44px hit area. Press: `transform: scale(0.97)` with `transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1)`. Loading keeps the label and adds a spinner. One primary button per screen.

**List row (the main building block).** 56px minimum height, 16px side padding, 1px `line` rule between rows, no rule after the last. Left: optional 20px icon in `muted`, then label (16px) with an optional caption line (13px). Right: value (tabular, right-aligned) or a status, then a chevron if the row navigates. The whole row is the link. Groups of rows sit in one white container with 12px radius on `canvas`.

**Status.** Text plus a 16px icon: "Not started" (circle, `subtle`), "In progress" (half circle, `warning`), "Done" (check, `positive`). No filled pills.

**Option tile (survey answers).** Full-width row, 56px minimum, 1px `field-border`, radius 10. Selected: `brand-tint` 2px border, `brand-soft` fill, check icon in Palatinate at the right. Use `role="radio"` inside a `radiogroup`.

**Stepper (people, boxes).** Minus and plus buttons 44px square, value 18px tabular between them, `aria-live="polite"`.

**Inputs.** 48px tall, 16px text, `field-border` border, radius 10, label above in 14px 500. Focus: 2px Palatinate outline with 2px offset. Errors inline under the field in `negative` with an icon, focus moves to the first error. Set `inputmode="decimal"` for money, `autocomplete` and `spellcheck={false}` on emails.

**Bottom sheet.** Replaces "Show all 7 options" expansions and pickers. Slides up 280ms `cubic-bezier(0.32, 0.72, 0, 1)`, closes 200ms. Grabber 36x4px, title row, `overscroll-behavior: contain`, focus trapped and returned to the trigger.

**Notice.** One per screen at most. `warning-soft` ground, `warning` icon and text, 12px radius, no side stripe. Used for deadlines and for the "Simulation" banner on partner billing.

**Empty, loading, error.** Empty keeps the frame and gives the first action ("No rooms photographed yet. Start with the kitchen."). Loading shows grey bars at the final size, no shimmer. Errors sit inside the block that failed: what failed and a Retry text button.

## 7. Motion

- Durations: press 100 to 160ms, small state change 150 to 250ms, sheet and screen 250 to 300ms. Exit faster than entrance.
- Easing: `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)` for UI, `--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1)` for sheets. Never ease-in.
- Animate `transform` and `opacity` only. Nothing appears from `scale(0)`; start at `scale(0.95)` with opacity 0.
- The one authored moment: on bills results, the saving figure counts up over 600ms once, from 0 to the value, with tabular numerals so the width stays fixed. Skip it under `prefers-reduced-motion` and show the final number.
- Option tiles and buttons get press feedback only. No hover lifts, no section reveals, no stagger on page load.

## 8. Screens

### Home

```
RentReady
Moving into Gilesgate?            <- Title (24px). Copy adapts to stage.
Your next step: compare bills.    <- body, muted

[ Moving in                    > ]  <- two large rows, 72px, icon + label
[ Moving out                   > ]     + one-line caption each

Next up
| Compare bills        Not started > |
| Photo inspection     Not started > |
```

- The stage choice becomes two large list rows, white on canvas, not two Palatinate blocks. Palatinate appears only on the icon of the stage in progress.
- Remove the "Durham student housing" eyebrow and the decorative rule.
- Footer: the commission disclosure as a caption, the partner billing link as a tertiary text link.

### Move-in hub and move-out hub

Title "Moving in", then one grouped list of the tasks in order of urgency with status on the right. A notice only when a deadline falls inside 7 days (inspection due). Same pattern for "Moving out" with compare, report, cleaning and storage.

### Bills survey

- "Question 3 of 7" caption above the title, plus a 4px progress bar in Palatinate on `canvas-strong` (width at the true ratio, transitions with transform scaleX).
- One question per screen, answers as option tiles. "Next" in the sticky action bar, disabled state explained in a caption above it when nothing is picked.
- Package price input: 48px field with "£" prefix inside, `inputmode="decimal"`, "per person per week" as the unit after the field.

### Bills results

```
Your bills in Gilesgate            <- Title
4 people, low water use

You save                          <- Label
£342                              <- Figure, Palatinate, counts up once
over 51 weeks by paying bills yourself

| Bills package        £25.00 / week |
| Do it yourself       £18.30 / week |   <- positive colour, "Cheaper" with check icon

Set up your bills
| Gas and electricity  Fuse Energy    £13.01 / wk > |
| Water                Northumbrian   £3.38 / wk  > |
| Wi-Fi                NOW Broadband  £1.79 / wk  > |
  Each row opens a sheet with the provider, the price basis, the source date and "Get a quote".
  "Compare all 7 suppliers" opens a sheet, not an inline expansion.

Your share, bill by bill            <- divided list, right-aligned tabular values
Don't forget                        <- council tax and insurance as two rows with a caption each
```

- Replace the "BILLS PACKAGE / DO IT YOURSELF CHEAPER" tiles with the two-row comparison.
- Replace the middle-dot subtitle with "4 people, low water use".
- Sources and dates stay visible as captions under each price block.

### Inspection

Title "Photo inspection", caption "4 of 9 rooms done". Grouped list of rooms with a thumbnail (48px, radius 8) or an empty camera slot, condition status in words. Room detail: camera button as the primary sticky action, condition as three option tiles (Good, Worn, Damaged), notes field.

### Email landlord

The draft in a white container with 16px body text, subject line above as a labelled field. Attached photos as a horizontal list inside its own scroll container (the page never scrolls sideways). Sticky action: "Copy email". After copying, the button label changes to "Copied" with a check icon for 2 seconds, announced through `aria-live`.

### Move-out compare and report

- Compare: per room, before and after photos side by side at equal size (each 50% minus 4px gap, aspect 4:3, radius 8), labels "Move in" and "Move out" under each. A new issue row in `negative-soft` with an icon and the words "New since move in".
- Report: Figure "5" with label "new issues", then the grouped list by room. Primary action "Share report" (Web Share API with a print fallback).

### Cleaning

Ask "How much was your deposit?" first (money input, 48px). When filled, show two rows: "Cleaner for a 4-bed: £106" and "Deposit at risk: £400", then one sentence verdict in body text with the positive or warning colour on its icon. Bedrooms stay behind "Not a 4-bed? Change…".

### Storage

Steppers for small, medium and large boxes, a segmented control for Summer or Christmas, then "Best price" as the Figure row (LOVESPACE £218.30) with the provider list under it, cheapest first, right-aligned prices.

### Partner billing (simulation)

- The notice "Simulation. No real money moves and no partner is billed." sits first, above the title.
- Tables become two-line rows under 640px: partner and amount on line 1, date and memo on line 2 in caption size. On desktop keep the ruled table with right-aligned tabular amounts and 13px sentence-case headers, no header band.
- Summary as a divided list (signups recorded, ledger balanced, audit chain verified), not three stacked cards.

## 9. Accessibility and quality floor

- Touch targets 44px minimum, 8px apart. Primary actions 48px.
- Visible `:focus-visible` on every control: 2px Palatinate outline, 2px offset; on Palatinate fills, a white outline.
- Contrast: body and placeholders 4.5:1, large text 3:1, field borders and icons that carry meaning 3:1.
- `<html lang="en-GB">`, one `h1` per screen, headings in order, a skip link, `<title>` per route.
- Respect `prefers-reduced-motion`; never disable zoom.
- Theme the browser surfaces: `::selection` in `brand-soft` with ink text, `accent-color: var(--color-brand)` for native checkboxes and ranges, caret in Palatinate.

## 10. Self-review with Playwright

Every change ends with screenshots at 360x780, 393x852 and 1280x800 of each route, plus one with an input focused. On each screenshot check:

1. The key figure and the primary action are visible without scrolling at 393x852.
2. No horizontal scroll (`document.documentElement.scrollWidth <= innerWidth`).
3. No more than three Palatinate regions.
4. No text under 12px, no uppercase tracked labels, no middle-dot meta strings.
5. Nothing hides under the sticky action bar or the tab bar.
