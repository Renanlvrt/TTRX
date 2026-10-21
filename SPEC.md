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

### Presenter shortcuts
- **Alt+D** — demo house loaded, demo controls hidden. **Alt+R** — reset to a brand-new user.
- **Phone:** press and hold the RentReady logo ~1s: turns demo mode on; hold again to reset to a new user.
- **Default:** every page load (and reload) opens as a brand-new user with nothing filled in. Alt+D / hold the logo loads the demo house (move-in 10/10, move-out 9/10, Oven & Hob left for the live upload). Nothing persists across reloads.
- **Live link:** https://renanlvrt.github.io/TTRX/ (GitHub Pages, auto-deploys on push to main).

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
| 23 | Extra verified data | From the user's Durham costs doc, only claims verified on 17 Oct were added: Fuse (≈0.9% under cap, 24m) & Outfox (#1 service), Plusnet/TalkTalk/Sky, BT FF300 £30.99, Council Tax £0 student exemption + apply link, contents insurers, Ellis Leazes £175/£195 = £20 pppw benchmark. Rejected: Virgin £18.99 (not found), E.ON "top large supplier" (false), Sky price (unconfirmed). Evidence in research/extra-*.json. |
| 24 | Storage recommender | Two questions: boxes (small/medium/large counters) + duration (1 month / summer / 6 months / 1 year). Cheapest published price = Best (yellow) + alternatives; unpublished sizes = Get a quote. Prices in research/storage-pricing.json. |
| 25 | Presenter mode | **Alt+D** loads the real demo house (photos in public/demo-house) and hides every demo control so it looks like a real user; **Alt+R** wipes everything back to a brand-new user. Bills stays empty for the live survey. Live upload: oven after-photo → report 5 new / 2 pre-existing / 3 unchanged. |
| 26 | Cleaning advisor | Cleaning page answers "pay a cleaner or risk the deposit?": no cleaning input: things to clean = NEW ISSUES from the move-out report (shown as photos); one visible question: "How much was your deposit?" (per person; empty for a new user, £400 in the demo house); the answer appears once it is filled. Bedrooms (from bills survey, default 4) sit behind a small Change link. ≤2 items → DIY; ≥3 and cleaner share < deposit → book a cleaner; else DIY. Prices: Tenancy.Cleaning Durham fixed prices + £35 oven (research/cleaning-prices.json). |
| 27 | Storage all-in | Totals include required fees: Kit Keeper (collection £45, boxes, £12.99 box delivery, £6.95/box return), LOVESPACE plans + £7.95/box return, Box Co plans + £14.95/box return, Seven Seas ~£210 Durham order charge, DUmove £35 early retrieval. Optional own-box purchases shown as notes. Cross-checked in src/lib/storage.data.test.ts. |
| 28 | Bills results, simpler | One-line verdict ("You save £X by doing it yourself"), package vs do-it-yourself £/wk side by side (cheaper one solid green) on the first phone screen. One link per provider (quote page). Cheapest first and highlighted; only the cheapest shown per bill, "Show all N options" expands. Heating question: Warm and cozy / Only when I'm really cold / I could live in an igloo. |
| 29 | Reload = new user | Every reload starts as a brand-new user (no demo data). The demo house is opt-in via Alt+D or holding the logo. Non-app files (raw house photos, UI mock-ups, notes, pasted docs) are gitignored. |
| 30 | Durham_testing_branch (2026-10-20) | Applies on `Durham_testing_branch` only; `main` is unchanged. (a) **Palatinate exception**: the purple ban is lifted for Durham Palatinate only. Allowed hexes are #7E317B #68246D #5A1F57 #9A4C96 #CBA8C9 #E9DCE8 #F5EEF4. Every other purple stays banned, including violet, indigo, fuchsia and gradient glows, and a test enforces this. (b) **B2B billing domain module** in `src/lib/billing/`, overriding the §4 exclusion of payments and affiliate tracking for this branch. It is pure TS with no server. **All money is simulated**: `BILLING_MODE='sandbox'` only, live mode throws, memos are prefixed `[SIMULATED]`, there is no payment provider and no network, and partners are fictional with `.example` domains. The fee schedule is a flat fee per signup. Tiers, VAT, invoices and refunds are deferred to `docs/billing/deferred/`. |
| 31 | Teal reskin (2026-10-21, branch `feat/teal-lobby`) | Purple is dropped entirely, which supersedes the Palatinate exception in #30(a). Palette: deep teal #0E6B62 for actions, cyan #0E7C86 as the second tile, pale gold highlight, cool off-white #F5F7F6 surface. Corners 8/12/16px. System font (SF Pro on iPhone), no web fonts. Home is a lobby: the RentReady mark and wordmark, with Moving in and Moving out as two distinct tiles at the bottom. No captions, no headline, no glow or glass effects. The frozen test that requires Palatinate is overruled by the user and logged in docs/durham-branch/ARCHITECTURE.md. |
| 32 | Home matched to the user's reference mock (2026-10-21, `feat/teal-lobby`) | Reference: `everything raw/Gemini_Generated_Image_4yn4tr4yn4tr4yn4.jpg`, colours sampled from it. Home: a diagonal teal gradient, a silver house-and-tick mark with a soft glow and a white shine under it, a silver wordmark, and one frosted-glass panel holding Moving in and Moving out with silver key and box glyphs. The header is frosted glass over Home and solid teal elsewhere. Brand token #04625C. These effects (gradient, glass, glow) are a user-requested exception to the no-effects rule in #31. They live as CSS classes in `src/index.css` (`lobby`, `glass`, `app-bar`, `logo-glow`, `silver-text`), not as Tailwind effect classes in components. |
| 33 | Every page in the Home style (2026-10-21, `feat/teal-lobby`) | One fixed teal gradient behind the whole app; cards are frosted glass (`bg-card`), text is white, actions are silver-mint with dark teal labels, highlights are pale gold glass. The PDF report still prints dark on white (print tokens). Overrules two more frozen contrast tests that assumed white button labels; logged in docs/durham-branch/ARCHITECTURE.md. |
| 34 | Energy matched to the meter (2026-10-21, `feat/energy-meter-accurate`) | The bills survey asks how the house pays at the meter (monthly bills / top-up key or card / app top-up / not sure) and whether electricity is cheaper at night. Results list only suppliers with a primary source that they take that meter (`src/data/meterEligibility.ts`): online sign-up = "Join online", tariff offered but only by call or chat = "Contact to join". "Not sure" lists only suppliers confirmed for every meter type. Prices are exact rates from the Octopus, EDF and E.ON Next public APIs and a Fuse quote, all for North East region F and valid to 31 Dec 2026; British Gas, OVO and Outfox show "Up to" the Ofgem cap. The invented Fuse price (cap x 0.991) is removed. Economy 7 houses get "Night-rate price on quote". The "landlord pays" question is dropped because the bills-package question already covers it. Never say "whole of market": the app shows "Exact prices from N of 23 suppliers". Live data for every supplier needs a partner feed (The Energy Shop or Switchcraft) and a small server; see docs/bills/energy-research-2026-10-21.md. |
| 21 | Restart bills | Small "Reset compare bills" text link on results restarts the survey. |

## 10. Git workflow
- `main` is always demo-able. Work on branches (`feat/<module>`), push to `origin` (github.com/Renanlvrt/TTRX), merge into `main` after `npm run build` and `npm test` pass.
