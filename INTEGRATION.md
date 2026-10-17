# INTEGRATION.md — wiring Stitch screens to RentReady logic

For the UI teammate. Every screen below already works. To restyle, **replace the JSX in `src/pages/<module>/`** and keep calling the same functions. Don't put calculations in components.

## Golden rules
- Read state with `useAppState()`; write with `setState(s => ({ ...s, ... }))` and `setTask(id, status)` (`src/lib/store.ts`).
- Photos: `savePhoto(file) → id`, show with `usePhotoUrl(id)` (handles IndexedDB ids and `url:/demo/...` demo images), remove with `deletePhoto(id)`.
- Palette lives in `src/index.css` `@theme` (`brand`, `brand-soft`, `highlight`, `highlight-strong`, `line`). Stitch Tailwind classes can use them as `bg-brand`, `bg-highlight`, `border-line`…
- Shared bits in `src/components/ui.tsx` (Button, Card, Stat, OptionTile, StatusBadge, Page, gbp). Restyle there to change every screen at once.
- Routes are in `src/App.tsx` → `ROUTES`. Keep the paths.

## Screen → what to call

| Screen (route) | File | Reads | Calls |
|---|---|---|---|
| Home `/` | `pages/Home.tsx` | `tasks` | `resetState()` (phone: 2 stage buttons) |
| Stage `/move-in`, `/move-out` | `pages/Home.tsx` → `StagePage` | `tasks` | — |
| Bills survey + results `/move-in/bills` | `pages/bills/{BillsPage,Survey,Results}.tsx` | `bills.survey` | `estimateBills(survey) → BillsResult`, `providersFor(area, {wifi, tvLicence, hasGas}) → [{group, label, providers}]` (direct sign-up/pay links), `areaFromPostcode(text)`, `DEMO_SURVEY`; save survey to `bills.survey`; `setTask('bills', …)` |
| Photo inspection `/move-in/inspection` | `pages/inspection/{InspectionPage,ItemCard}.tsx` | `moveIn` | `CHECKLIST`, `ROOMS`, `CONDITION_LABEL`, `inspectionProgress()`, `updateRecord('moveIn', itemId, patch)`, `replaceInspection('moveIn', demoMoveIn(), current)` |
| Email landlord `/move-in/email` | `pages/email/EmailPage.tsx` | `property`, `moveIn`, `emailDraft` | `buildMoveInEmail(property, moveIn, CHECKLIST) → {subject, body, issueCount}`, `mailtoLink(subject, body)` |
| Move-out photos `/move-out/compare` | `pages/moveout/ComparePage.tsx` | `moveIn`, `moveOut` | same as inspection with `'moveOut'`, `demoMoveOut()` |
| Report `/move-out/report` | `pages/moveout/ReportPage.tsx` | `moveIn`, `moveOut`, `property` | `compareInspections(CHECKLIST, moveIn, moveOut) → ComparisonRow[]`, `sortRows()`, `summarize() → counts per Flag`; Print = `window.print()` |
| Storage `/move-out/storage` | `pages/storage/StoragePage.tsx` | `storageNeeds` (box counts + weeks) | `recommendStorage(needs, STORAGE_LISTINGS.map(l => l.pricing)) → {best, alternatives}` (`src/lib/storage.ts`, `src/data/storagePricing.ts`) |
| Cleaning `/move-out/cleaning` | `pages/cleaning/CleaningPage.tsx` | `cleaningDone` | `CLEANING_CHECKLIST`, `CLEANERS`, `DEPOSIT_LINKS` |

## Key data shapes (`src/lib/types.ts`)
- `BillsSurvey` — `packagePppw | null, area, people, water, heating, hasGas, wifi, tvLicence, tenancyWeeks`.
- `BillsResult` — `separate` & `package` (`{perWeek, perMonth, tenancy}` per person), `differenceTenancy`, `verdict`, `verdictText`, `lines[]` (per bill, `householdAnnualGBP | null` = "unavailable"), `assumptions[]`.
- `ItemRecord` — `condition ('good'|'damaged'|'na'|null), note, photoId, recordedAt`.
- `Flag` — `newIssue | preExisting | unchanged | unmatched | notApplicable` (precedence: N/A > unmatched > new > pre-existing > unchanged).

## Data & demo
- Prices: `src/data/rates.ts`, `billProviders.ts`, `services.ts` — each figure has `source` + `checkedDate`; research notes in `research/`.
- Demo photos: `public/demo/<itemId>-in.svg` / `-out.svg`. Replace with real photos using the same name (or change the extension in `src/data/demoSeed.ts`).

## Checks before merging
`npm run build` and `npm test` must pass. Branch per feature (`feat/<name>`), merge into `main`.
