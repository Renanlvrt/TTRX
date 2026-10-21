# Durham_testing_branch: architecture brief

Started 2026-10-20. This branch moves RentReady from the hackathon demo toward a product that Durham University could partner on. Nothing from it reaches `main` without the user's approval.

## What the branch adds
1. **A Durham-style UI.**
   - Palatinate purple is the primary colour, and it is the only purple allowed (SPEC §9 #30).
   - Surfaces are stone and cream, with a serif display face and a sans-serif body face.
   - Tables are ruled and every colour pair meets WCAG AA contrast.
   - No glow gradients and no floating cards.
   - No crest, logo or "official" wording until a partnership is signed.
2. **A B2B signup-billing module** in `src/lib/billing/`.
   - It is pure TypeScript, with no server and no new dependencies.
   - It records a student signup, attributes it to a billing partner (referral code first, then exact email domain), calculates a flat fee from the partner's contract, and posts the fee to an append-only, double-entry ledger.
   - Money is held as BigInt pence, rounding is always explicit, and no floats are used.
   - **All money is simulated.** `BILLING_MODE='sandbox'` is the only mode, live mode throws, memos start with `[SIMULATED]`, and every partner is fictional and uses an `.example` domain.
   - Design: `docs/billing/DESIGN.md`. ADRs, the deferred fee-model work and the security notes are also in `docs/billing/`.
3. **A frozen test suite, written before the code.**
   - At least 200 new general tests: calculations, data integrity, the store, SPEC §8 criteria, a palette guard, contrast checks and doc-style checks.
   - At least 100 billing tests.
4. **A QA loop that runs until 20:00 on 2026-10-20.** Each pass:
   1. runs the tests, the build and lint;
   2. reviews the code and UI as a strict QA tester;
   3. fixes one cluster of issues;
   4. commits, then adds a row to the loop log below.

## Branch rules
- No commits to `main`, and no pushes unless the user asks.
- No new dependencies.
- `src/lib` stays pure: no React or UI imports.
- The existing 62 tests stay green.
- Billing never uses `number` for money. Every function that rounds is given a rounding mode.
- No personal data in the ledger, the audit log or memos. Student emails are stored only as keyed pseudonyms.
- Docs follow the stop-slop and no-ai-slop rules: no em dashes and no banned words. A frozen test checks this.

## Frozen-test policy
- All new tests land together in one "freeze" commit. After it, nobody edits a test file: no changed assertions, no skips, no deletions.
- If a test looks wrong, it stays as it is. Log it under "Disputed tests" with the evidence, and the user decides.
- Work counts as done when its frozen tests pass against the real code.

## Disputed tests

| Test (file > name) | Why it looks wrong | Evidence | Status |
|---|---|---|---|
| src/design/contrast.test.ts > --color-brand is Durham Palatinate #7E317B | The user dropped purple ("the purple give a vibe coded sign") and chose a green-cyan teal like Apple's latest iPhones | User instruction, 2026-10-21; new brand #0E6B62 passes every other contrast test (white on brand 6.37:1, brand on surface 5.92:1) | Overruled by user, test left unedited; fails by design from feat/teal-lobby on |

## Loop log

| time | finding | fix | commit |
|---|---|---|---|
| 14:35 | Branch created, 62 baseline tests green | Froze 318 general, 144 billing and 136 anti-slop tests before writing code | 1a305ee, 7d94d6e |
| 14:45 | README failed 3 no-ai-slop eval checks (emoji, "That's it:", colon reveal) | Rewrote the lines | 6092b76 |
| 14:50 | Billing modules missing, so 170 billing tests failed | Implemented src/lib/billing; 692/692 green | f2481c1 |
| 14:52 | Partners had no way to see billing | Added a simulated partner billing page | c4cbfd0 |
| 14:55 | QA review: 11 billing defects (lease takeover race, release after commit, mixed-currency receivables, catalog mutability, PII echo) and 4 a11y defects (focus rings, 1.4:1 input borders) | Fixed all 15, with 30 new regression tests; 722/722 green | a31b56f, 92be0ce |
| 15:10 | User: all-white tab-bar redesign harder to read; wants only the strict necessary | Reverted ba31928 (239ad89); Home is now only Moving in or moving out | 6dfdb4c |
| 18:50 | Task pages crowded (captions, fine print, repeated figures) | One answer and one action per page; optional detail behind Details or Show all | ed5ebe6 |
| 19:49 | Final check | 722\/722 tests, build passes, eslint 0 errors (2 old react-refresh warnings in ui.tsx); no disputed tests; loop stopped | this commit |
| 2026-10-21 | User: purple looks vibe coded, UI too boxy, Home captions and headline redundant | Teal palette, 8/12/16px corners, system font, logo mark, Home lobby (logo plus two tiles), accent stripes removed (branch feat/teal-lobby) | see git log |
