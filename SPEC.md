# SPEC.md — RentReady Locked MVP (read this first, every time)

> Source of truth for **what we build**. `PRD.md` is background; where they differ, **this file wins**.
> Locked via grill-me on 2026-10-17. Change it only when the team agrees, and log the change in §9.

## 1. Team split
- **Functionality (this repo's code):** Renan + AI agents. Builds all logic and a clean, working UI.
- **UI design:** teammate, using **React + Google Stitch** (HTML/Tailwind). Their screens replace ours later.
- Therefore: **logic never lives in components.** See §6.

## 2. Product in one line
Free student renting companion for **Durham**: compare bills, prove the house's condition before/after, find storage and cleaning.

## 3. In scope
### Home
Two stage cards: **Moving in** (Bills · Photo inspection · Email landlord) and **Moving out** (Before/after report · Storage · Cleaning). Each task shows *Not started / In progress / Done*. Pre-move-in and "during living" stages are **cut**.

### Bills — the MAIN demo
Short one-question-per-screen survey:
1. Bills package price in **£ per person per week (pppw)**, or "no package".
2. Area: **Gilesgate (DH1 1/2), Viaduct (DH1 4), City Centre/Claypath (DH1 1), Langley Moor (DH7 8)** (pick or type postcode).
3. Number of people.
4. Water use: **high / normal / low**, each with an example (high = "5 days a week, 20-minute showers").
5. Heating: **all day in winter / only at night / only in extreme cold months**.
6. Gas in the house: yes / no (no ⇒ electric heating).
7. Need Wi-Fi? Need a TV licence?

Result: **Option A (package) vs Option B (arrange separately, estimated)**, per person per week, per month and over a **51-week tenancy** (editable). Per-bill breakdown, assumptions, rule-based verdict ("Separate looks £X cheaper under these assumptions"), fair-use reminder, direct provider links to set up and pay (grouped by bill). "No package" ⇒ estimate + providers only.
- Prices are **researched and hardcoded** with source + date (`research/*.json` → `src/data/`). Unverified ⇒ shown as **"unavailable"**, never guessed.
- Energy/water are effectively the same across the 4 areas (one Ofgem region, one water company). Area mainly drives broadband options and local providers. **Do not fake per-area price differences.**

### Photo inspection (move-in)
10 items — Kitchen: Oven & Hob, Fridge/Freezer · Bathroom: Shower & Sealant, Sink & Toilet · Living room: Walls & Floor, Furniture · Bedroom: Walls & Corners, Floor/Carpet, Window, Wardrobe & Desk.
Each item card: condition (**Good Condition / Existing Damage/Marks / N/A**), note, **Add Photo**, app-recorded timestamp. **"Load demo house"** pre-fills all move-in items.

### Email landlord
Editable email listing move-in issues, copy-to-clipboard. **Never sends**, never claims it was sent.

### Before / after report (move-out)
Same 10 cards, paired by item. Side-by-side photos, dates, notes, conditions. **Flags come from the selected condition, not the image:**
- Good at move-in → Damaged at move-out = **NEW ISSUE** (yellow)
- Damaged at both = **Pre-existing, documented at move-in**
- Photo missing on either side = **Unmatched**
- N/A = Not applicable · otherwise Unchanged
Summary counts per flag. Report page with **Print to PDF** (`window.print()` + print CSS) and a disclaimer (supporting evidence, not a legal determination).

### Storage & Cleaning
Pick area → curated **real** Durham provider cards (price only if verified, "indicative" label, Visit Site). Cleaning: end-of-tenancy checklist + local cleaners; never promise deposit return.

## 4. Out of scope (do not build)
- **All AI**: chatbot, Antigravity/agy, Gemini, local LLM, AI summaries, AI image analysis. *(Chatbot is the first stretch goal if time remains.)*
- Any backend, accounts, multiple properties, bookings/payments, live tariff APIs, affiliate tracking.
- Pre-move-in viewing checklist, "during living" stage, drag-to-reveal slider, PDF library, move-out email (stretch), custom checklist items.

## 5. UI direction
White background, **green** buttons, **pale yellow** highlights, `text-slate-900`, no purple. **Big, clean, compact: few elements per screen, concise copy.** Desktop-first. One task per screen; survey is one question at a time.

## 6. Architecture contract
- Stack: **React + Vite + TypeScript + Tailwind v4**, frontend only. Vitest for logic.
- `src/lib/types.ts` — all data types (the contract). `src/lib/store.ts` — `useAppState()`, `setState()`, `setTask()`, photos in IndexedDB (`savePhoto`, `usePhotoUrl`).
- `src/lib/*.ts` — pure logic (bills calc, comparison flags, email template). **No React/UI imports.** Unit-tested.
- `src/data/` — checklist, rates, providers, demo seed. Bundled demo photos in `public/demo/` with fixed names (swap real photos by filename).
- `src/components/ui.tsx` — the only styling kit; palette tokens in `src/index.css` `@theme`.
- `src/pages/<module>/` — thin screens. Stitch screens replace these and call the same lib/store functions.
- Routes in `src/App.tsx` (`ROUTES`).

## 7. Demo script (3 minutes, mixed business + technical judges)
1. Home → two stages.
2. **Bills:** £25 pppw package, Gilesgate, 5 people, normal water, heating at night, gas yes, Wi-Fi yes, TV no → A vs B, 51-week saving, breakdown, providers.
3. **Load demo house** → 10 move-in items filled.
4. Glimpse the landlord email.
5. **Move-out:** 8 items pre-done; upload **2 live photos** (Kitchen Oven & Hob, Bedroom Walls & Corners), choose **Existing Damage/Marks** on each.
6. Comparison shows 2 NEW ISSUE + pre-existing protection → Print to PDF.
7. Quick look at Storage and Cleaning.

## 8. Acceptance criteria
- [ ] Bills survey works with and without a package; numbers come from dated, sourced data; unverified = "unavailable".
- [ ] Per person = household ÷ people; both options compared over the same 51 weeks.
- [ ] Photos stay linked to their item and survive refresh.
- [ ] Load demo house works; demo photos replaceable by filename.
- [ ] 2 live uploads produce correct NEW ISSUE flags; summary counts correct.
- [ ] Report prints cleanly with side-by-side photos.
- [ ] Email editable + copyable; never claims sent.
- [ ] Storage/cleaning cards open real provider sites.
- [ ] `src/lib` has no UI imports.

## 9. Decision log (grill-me answers, 2026-10-17)
| # | Question | Answer |
|---|---|---|
| 1 | How do functionality and UI meet? | Renan builds everything now; teammate does UI (React + Stitch); split enhancements later. |
| 2 | Demo device | Desktop web app. |
| 3 | How real is the AI? | **No AI for now.** Template reports. Chatbot later only if time. |
| 4 | Audience / length | Mixed judges, ~3 min. |
| 5 | Antigravity (agy) usage | Not in MVP. Pattern exists in `semi-automated-placement/fable_backend/agent_worker.py` if revived. |
| 6 | Stack | "Easiest and safest", adaptable to Stitch → React+Vite+TS+Tailwind, no backend. |
| 7 | Photo pairing | Per checklist item card (condition + note + Add Photo), same cards at move-out, images put together. |
| 8 | Bills data source | Research Durham areas and hardcode (bills, storage, cleaning) so it works for sure. |
| 9 | Secondary modules | Storage, Cleaning checklist + providers, Landlord email. Viewing checklist **not** selected. |
| 10 | Areas | Gilesgate, Viaduct, City Centre/Claypath, Langley Moor. |
| 11 | Bills inputs | Package price or none → postcode → small survey (people, water tiers with examples, heating pattern, gas, Wi-Fi, TV). |
| 12 | Report export | Report page + browser Print to PDF. |
| 13 | Navigation | Stage tabs: Move-in / Move-out; clean, not cramped, extremely organised. |
| 14 | Package unit | £ per person per week, 51-week tenancy. |
| 15 | Move-in photos in demo | Pre-seeded demo house. |
| 16 | Comparison intelligence | Side-by-side + rule-based flags. Purpose = proof of before/after. |
| 17 | Checklist size | 4 rooms, 2 items each, 4 for bedroom (10 total). Demo: upload only 2, rest pre-done. |
| 18 | UI polish | "Really good" UI now: white, clean, very compact, big elements, as concise as possible. |
| 19 | Phone home | Phone shows two big buttons (Moving in / Moving out) → stage page with its 3 tasks. Desktop keeps both stages side by side. |
| 20 | Bills links | Link **directly to providers** to sign up / pay (energy suppliers' moving-in pages, Northumbrian Water account + pay, broadband sign-up, TV Licensing). No comparison sites. Sources in `research/direct-links.json`. |
| 22 | Energy prices | Each energy card lists tariff options costed for the household (£/person/wk + £/yr house). Octopus = live published NE rates (public API); others = "up to" Ofgem cap for standard variable, fixed = Get a quote. Cheapest highlighted. |
| 21 | Restart bills | Small "Reset compare bills" text link on results restarts the survey. |

## 10. Git workflow
- `main` is always demo-able. Work on branches (`feat/<module>`), push to `origin` (github.com/Renanlvrt/TTRX), merge into `main` after `npm run build` and `npm test` pass.
