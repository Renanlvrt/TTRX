# RentReady B2B signup billing: design spec (`src/lib/billing/`)

Status: **sandbox simulation only.** No real money moves, every partner is fictional, every email uses an RFC 2606 `.example` domain, and the module never touches the network. Implementation forks follow this file. The frozen tests in `src/lib/billing/*.test.ts` are the contract; where this file and a test disagree, the test wins and the difference is listed under "Test-list adjustments".

Research basis: HMRC rounding rules (VATREC12030 says round VAT half up at 0.5p; VATREC12010 allows rounding the invoice VAT total down), Stripe and Brandur on idempotency keys, OWASP business-logic guidance, TigerBeetle and Modern Treasury on double-entry ledgers, ICO and EDPB on pseudonymisation. Every BigInt, allocation, hash and date value in the tests was checked with Node.

Scope note: SPEC §4 excluded "bookings/payments, affiliate tracking". This branch overrides that for a simulated billing module; the override is logged in SPEC §9.

---

## 0. Sandbox guard (added after the research pass)

- `src/lib/billing/mode.ts` exports `BILLING_MODE = 'sandbox' as const`.
- `createBillingService(deps)` accepts an optional `mode?: 'sandbox' | 'live'`. `mode: 'live'` throws `InvariantError('live billing disabled')`.
- `SignupOutcome` and `LedgerTransaction` both carry `sandbox: true` (literal type `true`). `buildTransaction` and `reverseTransaction` always set it.
- Every ledger transaction that `recordSignup` creates has a memo starting with `[SIMULATED]`.
- `money.ts` adds `formatSimulated(m)`, which returns `'SIM ' + formatMoney(m)`, for example `'SIM £2.50'`. `formatMoney` is unchanged.
- No non-test file under `src/lib/billing/` may contain the text `fetch(` or `XMLHttpRequest` (scanned by `sandbox.test.ts` with `import.meta.glob(..., { query: '?raw' })`).
- Fixture partners are fictional and labelled `(fictional)` in their names: Palatine Lettings, Wearside Homes, Gamma Rooms, Delta Studios.

---

## 1. Why client-side billing is unsafe, and what production needs

| Client-side problem | Why it matters | Production requirement |
|---|---|---|
| The browser is user-controlled | Fees, partner IDs and timestamps can be edited in DevTools. OWASP: recompute on the server, treat client state as input only. | The server recomputes everything. The client sends only `{email, referralTouches}` plus an idempotency key; any other field is rejected (`UNEXPECTED_FIELD`). |
| The HMAC key would be public | A key bundled by Vite is readable, so the email hash is effectively unkeyed and student emails can be brute-forced. ICO and EDPB treat pseudonymised data as personal data either way. | The key lives in a KMS with a `keyId` for rotation. The demo injects a key that is marked as a demo key. |
| Each device has its own clock | Users can change the clock and break contract windows and month cut-offs. | The server's UTC clock sets the signup instant. A client `occurredAt` is rejected. |
| No shared store (the app resets on reload) | Idempotency, duplicate detection and the ledger only mean something across all requests. | Postgres or similar: unique constraints on the idempotency key and on the pseudonymous student id, optimistic versions or `SERIALIZABLE` transactions. |
| No atomic commit | Two tabs can both decide they are first. | One atomic write per signup: signup record, ledger posting and audit events together (Brandur's atomic phases). |
| Nothing is tamper-evident | Local data can be rewritten. | Append-only ledger, hash-chained audit log, separate admin audit, 6-year retention. |
| Collecting money and issuing VAT documents | Out of scope, and nothing here touches PCI. | A payment provider (Stripe Invoicing or GoCardless), sequential invoice numbers, credit notes. See `deferred/`. |

Design rules for this module:
- Expected errors return a `Result`. Exceptions (`InvariantError`) are for programming bugs and bad config only.
- Money is BigInt minor units. No `number` ever holds money.
- Every function is pure, except the async repository port.
- Every returned object is frozen.
- The clock and the id generator are injected, so tests are deterministic.

**Rounding modes**
- `HALF_UP` (half away from zero) is the default for anything HMRC sees: VAT, invoice lines and fee percentages. It matches VATREC12030.
- `DOWN` (toward zero) is for the B2B concession that lets an invoice's total VAT round down to the whole penny (VATREC12010, Notice 700 §17.5).
- `HALF_EVEN` is for internal statistics only, never on a document HMRC sees.
- No function has a default mode: every rounding call names one.
- Negative amounts round symmetrically: HALF_UP takes -2.5p to -3p, so a credit note mirrors its invoice.
- BigInt `/` truncates toward zero (`-5n/2n === -2n`), so rounding goes through `divRound`.
- A flat fee divides nothing. Rounding only matters for `allocate`, VAT and tiers (the last two are deferred).

**Repo constraints**
- `erasableSyntaxOnly` rules out `enum`, `namespace` and parameter properties. Use string unions and `as const`.
- `lib: ES2020` rules out `Object.hasOwn`, `.at()` and `findLast`.
- `verbatimModuleSyntax` means `import type` for every type-only import.
- Hashing uses `globalThis.crypto.subtle` (browser and Node 24), never `node:crypto`. There is no `@types/node` in the repo.
- BigInt does not go through `JSON.stringify`. DTOs carry amounts as strings.
- No `as any`.
- `src/lib/types.ts` already has a bills `Money` interface. The billing `Money` stays inside `billing/`; import it from `./billing/money`.

---

## 2. File layout and API

```
src/lib/billing/
  result.ts  errors.ts  rounding.ts  money.ts  mode.ts
  brand.ts   validate.ts  clock.ts   ids.ts
  canonical.ts  pii.ts  ledger.ts  audit.ts
  attribution.ts  fees.ts  repository.ts  signup.ts  reconcile.ts  index.ts
  test-fixtures.ts  (+ *.test.ts)
```

**result.ts / errors.ts**
```ts
export type Result<T, E = BillingError> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E }
export const ok: <T>(v: T) => Result<T, never>;  export const err: <E>(e: E) => Result<never, E>
export type BillingErrorCode = 'INVALID_AMOUNT'|'INVALID_AMOUNT_TYPE'|'AMOUNT_OUT_OF_RANGE'|'UNSUPPORTED_CURRENCY'|'CURRENCY_MISMATCH'
 |'INVALID_RATIO'|'INVALID_WEIGHTS'|'NON_POSITIVE_AMOUNT'|'INVALID_INSTANT'|'INVALID_EMAIL'|'INVALID_REFERRAL_CODE'
 |'INVALID_IDEMPOTENCY_KEY'|'UNEXPECTED_FIELD'|'INVALID_REQUEST'|'TOO_FEW_ENTRIES'|'UNBALANCED_TRANSACTION'
 |'DUPLICATE_TRANSACTION_ID'|'ALREADY_REVERSED'|'UNKNOWN_TRANSACTION'|'PII_REJECTED'|'DUPLICATE_REFERRAL_CODE'
 |'DUPLICATE_EMAIL_DOMAIN'|'FORBIDDEN_DOMAIN'|'UNKNOWN_PARTNER'|'INVALID_CONTRACT_WINDOW'|'OVERLAPPING_CONTRACTS'
 |'UNKNOWN_FEE_SCHEDULE'|'DUPLICATE_FEE_SCHEDULE'|'IDEMPOTENCY_KEY_REUSED'|'IDEMPOTENCY_IN_PROGRESS'
 |'VERSION_CONFLICT'|'DUPLICATE_STUDENT'|'AUDIT_CHAIN_BROKEN'
export interface BillingError { readonly code: BillingErrorCode; readonly message: string; readonly details?: Readonly<Record<string, string>> }
export class InvariantError extends Error {}   // bugs and config only, never user input
```

**rounding.ts**
```ts
export type RoundingMode = 'HALF_UP' | 'HALF_EVEN' | 'DOWN'
export function divRound(n: bigint, d: bigint, mode: RoundingMode): bigint   // InvariantError if d <= 0n
```

**money.ts**
```ts
export type CurrencyCode = 'GBP' | 'EUR' | 'JPY'
export const CURRENCY_EXPONENT: Readonly<Record<CurrencyCode, 0 | 2>>   // GBP 2, EUR 2, JPY 0
export const MAX_MINOR = 2n ** 63n - 1n                                  // Postgres bigint; MIN = -MAX_MINOR
export type Money = Brand<Readonly<{ amountMinor: bigint; currency: CurrencyCode }>, 'Money'>
export function parseCurrency(c: unknown): Result<CurrencyCode>
export function parseMoney(major: unknown, currency: unknown): Result<Money>      // ^-?(0|[1-9]\d*)(\.\d{1,exp})?$
export function moneyFromMinor(minor: unknown, currency: unknown): Result<Money>  // bigint or ^-?\d+$ string
export function add(a: Money, b: Money): Result<Money>;  export function subtract(a: Money, b: Money): Result<Money>
export function negate(m: Money): Money;  export function compare(a: Money, b: Money): Result<-1 | 0 | 1>
export function sum(currency: CurrencyCode, items: readonly Money[]): Result<Money>
export function multiplyRatio(m: Money, num: bigint, den: bigint, mode: RoundingMode): Result<Money>
export function allocate(m: Money, weights: readonly bigint[]): Result<readonly Money[]>  // largest remainder, ties to lower index, sign-symmetric
export function formatMoney(m: Money): string        // "£1,234.56", "-£0.05", "€2.50", "¥100"
export function formatSimulated(m: Money): string    // "SIM £2.50"
export interface MoneyDTO { readonly amountMinor: string; readonly currency: CurrencyCode }
export function toDTO(m: Money): MoneyDTO;  export function fromDTO(x: unknown): Result<Money>
```

**mode.ts**
```ts
export const BILLING_MODE = 'sandbox' as const
export type BillingMode = 'sandbox' | 'live'
```

**brand.ts / validate.ts**
```ts
export type Brand<T, B extends string> = T & { readonly __brand: B }
export type Instant = Brand<string, 'Instant'>            // "YYYY-MM-DDTHH:mm:ss.sssZ"
export type EmailDomain = Brand<string, 'EmailDomain'>;  export type ReferralCode = Brand<string, 'ReferralCode'> // ^[A-Z0-9]{4,16}$
export type IdempotencyKey = Brand<string, 'IdempotencyKey'>  // ^[A-Za-z0-9_-]{1,255}$
export type PartnerId, ContractId, SignupId, TransactionId, AccountId, PseudonymousId  // Brand<string, ...>
export interface NormalisedEmail { readonly local: string; readonly domain: EmailDomain }
export function parseInstant(x: unknown): Result<Instant>          // needs Z or ±hh:mm; rejects rollover dates
export function instantMs(i: Instant): number
export function parseEmail(x: unknown): Result<NormalisedEmail>    // trim + lowercase; max 254 chars, local max 64, domain labels a-z0-9- not starting/ending with '-', at least one dot
export function parseReferralCode(x: unknown): Result<ReferralCode> // trim + uppercase
export function parseIdempotencyKey(x: unknown): Result<IdempotencyKey>
export function deepFreeze<T>(x: T): Readonly<T>
```

**clock.ts / ids.ts**
```ts
export interface Clock { now(): Instant }
export function fixedClock(start: string): Clock & { advance(ms: number): void }   // InvariantError on a bad start
export function systemClock(): Clock
export interface IdGenerator { next<P extends string>(prefix: P): string }       // sequential: "txn_000001"
export function sequentialIds(): IdGenerator;  export function uuidIds(): IdGenerator  // crypto.randomUUID
```

**canonical.ts / pii.ts**
```ts
export function canonicalJson(v: unknown): string      // sorted keys; bigint -> "123n"; InvariantError on undefined/NaN/function
export function sha256Hex(s: string): Promise<string>
export function hmacSha256Hex(key: Uint8Array, msg: Uint8Array): Promise<string>
export interface Pseudonymiser { readonly keyId: string; pseudonymise(e: NormalisedEmail): Promise<PseudonymousId> } // "psn_v1_<keyId>_<64hex>"
export function createHmacPseudonymiser(o: { keyId: string; key: Uint8Array }): Pseudonymiser  // key < 32 bytes -> InvariantError
```

**ledger.ts** (append-only double entry; `balanceOf` = debits minus credits)
```ts
export type Direction = 'debit' | 'credit'
export interface LedgerEntry { readonly accountId: AccountId; readonly direction: Direction; readonly amount: Money }
export interface LedgerTransaction { readonly id: TransactionId; readonly at: Instant; readonly causationId: string;
  readonly memo: string; readonly reverses: TransactionId | null; readonly sandbox: true; readonly entries: readonly LedgerEntry[] }
export const receivableAccount: (p: PartnerId) => AccountId   // "receivable:<partnerId>"
export const SIGNUP_REVENUE: AccountId                         // "revenue:signup_fees"
export function buildTransaction(d: { id: string; at: string; causationId: string; memo: string; entries: readonly LedgerEntry[] }): Result<LedgerTransaction>
export function appendTransaction(ledger: readonly LedgerTransaction[], tx: LedgerTransaction): Result<readonly LedgerTransaction[]>
export function reverseTransaction(ledger: readonly LedgerTransaction[], originalId: TransactionId, o: { id: string; at: string; memo: string }): Result<LedgerTransaction>
export function balanceOf(ledger: readonly LedgerTransaction[], account: AccountId, currency: CurrencyCode): Money
export function trialBalance(ledger: readonly LedgerTransaction[]): Readonly<Record<CurrencyCode, { debits: Money; credits: Money; balanced: boolean }>>
```
A reversal keeps the original's `causationId`.

**attribution.ts**
```ts
export interface Partner { id: PartnerId; name: string; status: 'active' | 'inactive'; referralCodes: readonly ReferralCode[]; emailDomains: readonly EmailDomain[] }
export interface Contract { id: ContractId; partnerId: PartnerId; status: 'active' | 'suspended' | 'terminated';
  effectiveFrom: Instant; effectiveTo: Instant | null; feeScheduleId: string; flatFee: Money }   // window [from, to) UTC
export interface PartnerCatalog { readonly partners: ReadonlyMap<PartnerId, Partner>; /* indexes */ }
export function buildPartnerCatalog(p: readonly Partner[], c: readonly Contract[]): Result<PartnerCatalog>
export interface AttributionPolicy { readonly touchModel: 'first' | 'last'; readonly lookbackDays: number }  // default first, 30
export interface ReferralTouch { readonly code: ReferralCode; readonly at: Instant }
export type RejectionReason = 'UNKNOWN_CODE' | 'PARTNER_INACTIVE' | 'NO_ACTIVE_CONTRACT' | 'TOUCH_OUTSIDE_WINDOW' | 'TOUCH_AFTER_SIGNUP'
export interface Rejection { readonly source: 'referral_code' | 'email_domain'; readonly value: string; readonly reason: RejectionReason }
export type Attribution =
  | { kind: 'partner'; partnerId: PartnerId; contractId: ContractId; rule: 'referral_code' | 'email_domain'; code: ReferralCode | null; rejected: readonly Rejection[] }
  | { kind: 'unattributed'; rejected: readonly Rejection[] }
export function attribute(i: { emailDomain: EmailDomain; touches: readonly ReferralTouch[]; at: Instant }, c: PartnerCatalog, p: AttributionPolicy): Attribution
```
Rules, in order:
1. Referral code. Filter the touches to valid ones (known code, active partner, contract active at the signup instant, inside the lookback, not after the signup), then pick first or last touch. Equal instants tie-break by code A to Z.
2. Exact, case-insensitive email-domain match. Subdomains do not count.
3. Otherwise unattributed.

Catalog validation rejects free-mail partner domains (`gmail.com`, `outlook.com`, `hotmail.com`, `yahoo.com`, `icloud.com` at least) with `FORBIDDEN_DOMAIN`, and a non-positive flat fee with `NON_POSITIVE_AMOUNT`.

**fees.ts**
```ts
export interface FeeContext { readonly contract: Contract; readonly partnerId: PartnerId; readonly signupAt: Instant }
export interface FeeQuote { readonly amount: Money; readonly scheduleId: string; readonly scheduleVersion: number; readonly contractId: ContractId; readonly basis: string }
export interface FeeSchedule { readonly id: string; readonly version: number; computeFee(ctx: FeeContext): Result<FeeQuote> }
export const flatFeePerSignup: FeeSchedule   // id 'flat-per-signup', version 1
export interface FeeScheduleRegistry { resolve(id: string): Result<FeeSchedule> }
export function createFeeScheduleRegistry(s: readonly FeeSchedule[]): Result<FeeScheduleRegistry>
```

**repository.ts** (async port plus an in-memory implementation)
```ts
export type ClaimResult = { status: 'claimed' } | { status: 'in_progress' } | { status: 'completed'; response: SignupOutcome } | { status: 'fingerprint_mismatch' }
export interface SignupRecord { id: SignupId; studentRef: PseudonymousId; emailDomain: EmailDomain; at: Instant; attribution: Attribution; fee: MoneyDTO | null; transactionId: TransactionId | null }
export interface UnitOfWork { signup: SignupRecord; transaction: LedgerTransaction | null; audit: readonly AuditEvent[] }
export interface BillingRepository {
  claimIdempotencyKey(k: IdempotencyKey, fingerprint: string, now: Instant): Promise<ClaimResult>
  completeIdempotencyKey(k: IdempotencyKey, response: SignupOutcome): Promise<void>
  releaseIdempotencyKey(k: IdempotencyKey): Promise<void>
  getVersion(): Promise<number>; getAuditHead(): Promise<AuditEvent | null>
  commit(u: UnitOfWork, expectedVersion: number): Promise<Result<{ version: number }>>  // VERSION_CONFLICT | DUPLICATE_STUDENT | DUPLICATE_TRANSACTION_ID
  listSignups(): Promise<readonly SignupRecord[]>; listLedger(): Promise<readonly LedgerTransaction[]>; listAudit(): Promise<readonly AuditEvent[]>
}
export function createMemoryRepository(o?: { retentionMs?: number /*24h*/; lockTimeoutMs?: number /*60s*/ }): BillingRepository
```
Each in-memory method starts with `await Promise.resolve()` so concurrent calls interleave. The compare-and-set that follows runs with no further `await`, standing in for a unique constraint or row lock.

`commit` checks in this order: version (`VERSION_CONFLICT`), then student (`DUPLICATE_STUDENT`), then transaction id (`DUPLICATE_TRANSACTION_ID`). The version goes up by 1 on every successful commit. Listings return frozen arrays.

Idempotency timing: retention and the lock timeout are both measured from the claim's `now`. A completed key replays while `now < claimedAt + retentionMs` and is reclaimable at exactly `claimedAt + retentionMs`. An uncompleted claim is `in_progress` while `now < claimedAt + lockTimeoutMs` and is taken over at exactly `claimedAt + lockTimeoutMs`.

**audit.ts**
```ts
export type AuditType = 'SIGNUP_RECEIVED'|'SIGNUP_ATTRIBUTED'|'SIGNUP_UNATTRIBUTED'|'FEE_CALCULATED'|'LEDGER_POSTED'|'LEDGER_REVERSED'
export interface AuditEvent { seq: number; at: Instant; type: AuditType; subjectId: string; data: Readonly<Record<string, string>>; prevHash: string; hash: string }
export const GENESIS_HASH: string  // '0'.repeat(64)
export function appendAuditEvent(prev: AuditEvent | null, d: { at: Instant; type: AuditType; subjectId: string; data: Record<string, string> }): Promise<Result<AuditEvent>>
export function verifyAuditChain(events: readonly AuditEvent[]): Promise<Result<true>>   // AUDIT_CHAIN_BROKEN, details.atSeq
```
`hash = sha256Hex(canonicalJson({ seq, at, type, subjectId, data, prevHash }))`. `FEE_CALCULATED` data includes `scheduleId` and `scheduleVersion` as strings.

**signup.ts**
```ts
export interface BillingDeps { repo: BillingRepository; clock: Clock; ids: IdGenerator; pseudonymiser: Pseudonymiser;
  catalog: PartnerCatalog; fees: FeeScheduleRegistry; policy: AttributionPolicy; maxCommitAttempts?: number /*3*/; mode?: BillingMode }
export interface SignupOutcome { signupId: SignupId; studentRef: PseudonymousId; signedUpAt: Instant; attribution: Attribution;
  fee: Money | null; transactionId: TransactionId | null; replayed: boolean; sandbox: true }
export function createBillingService(d: BillingDeps): { recordSignup(body: unknown, idempotencyKey: unknown): Promise<Result<SignupOutcome>> }
```
`recordSignup` runs these steps in order:
1. Validate the key, then the body. The body is a plain object with only `email` and an optional `referralTouches: {code, at}[]`; any other key gives `UNEXPECTED_FIELD`. Nothing is written for invalid input.
2. Pseudonymise the email.
3. Fingerprint the request: `sha256(canonicalJson({ studentRef, emailDomain, touches }))`.
4. Claim the key:
   - `in_progress` gives `IDEMPOTENCY_IN_PROGRESS`.
   - `completed` replays the stored outcome with `replayed: true`.
   - `fingerprint_mismatch` gives `IDEMPOTENCY_KEY_REUSED`.
5. Attribute, quote the fee, build the ledger transaction (memo starts `[SIMULATED]`, ids from `ids.next('sig')` and `ids.next('txn')`, `causationId` = signup id) and the audit events.
6. Commit at the expected version. Retry on `VERSION_CONFLICT` up to `maxCommitAttempts` attempts in total, re-reading the version and audit head each time.
7. Complete the key. On any error after the claim, release it.

Unattributed signups are still recorded, with `fee: null`, `transactionId: null`, no posting and a `SIGNUP_UNATTRIBUTED` audit event. The outcome is deep-frozen.

**reconcile.ts**
```ts
export type DiscrepancyKind = 'UNBALANCED_TRANSACTION' | 'MISSING_POSTING' | 'DUPLICATE_POSTING' | 'AMOUNT_MISMATCH' | 'ORPHAN_POSTING'
export interface ReconciliationReport { balanced: boolean; totals: Readonly<Partial<Record<CurrencyCode, { debits: string; credits: string }>>>;
  receivableByPartner: Readonly<Record<string, MoneyDTO>>; discrepancies: readonly { kind: DiscrepancyKind; ref: string }[] }
export function reconcile(i: { transactions: readonly LedgerTransaction[]; signups: readonly SignupRecord[] }): ReconciliationReport
```
Matching rules:
- A posting belongs to the signup whose `id` equals its `causationId`. Reversals (`reverses !== null`) are not counted as postings.
- A signup with a fee and no posting is `MISSING_POSTING`.
- More than one non-reversal posting for one signup is `DUPLICATE_POSTING`.
- A receivable debit that differs from the signup fee is `AMOUNT_MISMATCH` (ref = transaction id).
- A posting with no matching signup is `ORPHAN_POSTING`.
- A signup whose posting was reversed counts as settled, with no `MISSING_POSTING` or `AMOUNT_MISMATCH`.
- `receivableByPartner` is keyed by the partner id parsed from `receivable:<id>`.

---

## 3. Frozen tests (as written)

Shared fixture (`test-fixtures.ts`):
- Signup instant `T = 2026-10-20T10:00:00.000Z`, `fixedClock(T)`, `sequentialIds()`.
- HMAC key: 32 bytes of `0x01`, `keyId 'k1'`. Policy: first touch, 30 days.
- Partners, all fictional:
  - `ptn_alpha` "Palatine Lettings (fictional)": code `ALPHA2026`, domain `alpha-lettings.example`, contract `ctr_alpha` [2026-09-01Z, 2027-09-01Z), £2.50.
  - `ptn_beta` "Wearside Homes (fictional)": code `BETA`, domain `beta-homes.example`, contract `ctr_beta` [2026-01-01Z, open), £4.00.
  - `ptn_gamma` "Gamma Rooms (fictional)": code `GAMMA`, contract [2025-01-01Z, 2026-01-01Z), £3.00.
  - `ptn_delta` "Delta Studios (fictional)": inactive, code `DELTA`, open contract, £1.00.
- Students use `student.example` (unattributed by domain) or a partner `.example` domain.

Static `it` and `it.each` blocks per file:

| File | Blocks | Covers |
|---|---|---|
| rounding.test.ts | 7 | HALF_UP, HALF_EVEN, DOWN, negatives, exact division, beyond 2^53, bad divisor |
| money.test.ts | 26 (the `it.each` expands to 12 cases) | parse grammar, types, JPY, bounds, 0.10+0.20, arithmetic, mismatch, overflow, multiplyRatio, allocate, frozen, format, DTO, compare, sum |
| validate.test.ts | 11 (`it.each` expands) | instants and offsets, rollover dates, emails, referral codes, idempotency keys |
| clock-ids.test.ts | 3 | fixed clock, sequential ids |
| canonical-pii.test.ts | 8 | canonical JSON, FIPS 180-2 `abc`, RFC 4231 case 2, pseudonymiser |
| ledger.test.ts | 11 | balance rules, multi-leg, PII memo, duplicates, balances, reversal |
| attribution.test.ts | 23 | catalog validation (7), precedence, first/last touch, tie-break, 30-day edge, after-signup, unknown, ended, inactive, `[from,to)`, suspended, exact domain, determinism |
| fees.test.ts | 5 | flat fee, currency, non-positive, registry, pluggable schedule |
| repository.test.ts | 11 | claims, replay, mismatch, release, 10 concurrent claims, 24h retention, 60s lock, versioning, concurrent duplicate student, duplicate txn id, frozen listings |
| audit.test.ts | 7 | genesis, verify, edit, removal, reorder, PII, frozen |
| signup.test.ts | 16 (`it.each` expands to 3) | happy path, replay, key reuse, 10 concurrent, 5 concurrent students, same student ×3, normalisation, unattributed, extra fields, invalid input ×3, case-insensitive codes, no raw email stored, retry cap + release, pluggable fee + audit version + frozen |
| reconcile.test.ts | 9 | clean run, empty, unbalanced, missing, duplicate, mismatch, orphan, reversal, per-currency totals |
| sandbox.test.ts | 7 | sandbox constant, live refused, `sandbox: true` flags, `[SIMULATED]` memos, `formatSimulated`, no network, fictional partners |
| **Total** | **144 static blocks** (more once `it.each` expands) | |

Expected values for the main cases: see the test files. They are the source of truth.

### Test-list adjustments (differences from the research list)

1. **Fictional data.** DSU, Harrison, OldCo and Inact became Alpha, Beta, Gamma and Delta with `.example` domains and codes `ALPHA2026`, `BETA`, `GAMMA`, `DELTA`. Same windows, fees and semantics. Email examples use `student.example`.
2. **Test 102 (10 concurrent identical requests).** WebCrypto digests resolve on separate macrotasks in Node, so the first request can finish before the last one claims. The frozen test asserts the safety property instead of an exact 1/9 split: exactly one fresh outcome, every other result is either `IDEMPOTENCY_IN_PROGRESS` or a replay with the same `transactionId`, the ledger has one transaction, and a later retry replays.
3. **Test 103 (5 concurrent distinct students).** This runs with `maxCommitAttempts: 5`. In lockstep, 5 writers can need 5 attempts, so the default of 3 would make the test flaky.
4. **Retention and lock timing (test 91).** These are measured from the claim instant, and expiry is inclusive at the boundary (see repository.ts above). The lock test also checks `T+59.999s` is still `in_progress`.
5. **Reconcile linkage.** `causationId` = signup id. A reversal keeps the original's causationId and settles the signup. Test 119 includes the signup record, and the currency check is a separate test.
6. **Sandbox additions.** These are the `sandbox: true` fields, the `mode` dep, `formatSimulated`, `mode.ts` and `sandbox.test.ts` (7 blocks).
7. **The `multiplyRatio` missing-mode check** sits inside a function that is never called, so `tsc -b` checks the `@ts-expect-error` and nothing runs it.

---

## 4. `docs/billing/` layout

```
docs/billing/
  DESIGN.md                       this file
  README.md                       status, module map, link to SPEC §9, glossary (minor units, normal balance)
  adr/
    0001-money-bigint-minor-units.md
    0002-rounding-half-up.md
    0003-double-entry-append-only.md
    0004-idempotency.md
    0005-attribution.md
    0006-result-vs-exceptions.md
  deferred/
    tiered-pricing.md       volume vs graduated tiers; counting period; tier reset in Europe/London; re-pricing via credit note, never an edit
    vat.md                  registration threshold; 20% standard rate on B2B fees; line vs invoice rounding, kept consistent
    monthly-invoices.md     calendar month in Europe/London (2026-03-31T23:30Z is April in BST); gap-free numbering; required fields; terms; Making Tax Digital
    refunds-credit-notes.md triggers (fraud, duplicate, account deletion); credit note references the invoice; ledger reversal mapping; partial credits via allocate
    payment-collection.md   PSP choice (Stripe Invoicing or GoCardless), dunning, bad debt, PCI kept off our systems
    open-questions.md       who pays, per signup vs per active user, clawback window, disputes
  security/
    threat-model.md
    client-side-limitations.md
    pii-pseudonymisation.md
    key-management.md
    audit-retention.md
  operations/
    reconciliation.md
```

---

## 5. Sources

Primary:
- HMRC VATREC12030 (rounding): https://www.gov.uk/hmrc-internal-manuals/vat-trader-records/vatrec12030
- HMRC VATREC12010 (rounding concession, Notice 700 §17.5): https://www.gov.uk/hmrc-internal-manuals/vat-trader-records/vatrec12010
- VAT Notice 700: https://www.gov.uk/guidance/vat-guide-notice-700
- Stripe idempotent requests: https://docs.stripe.com/api/idempotent_requests
- Brandur, idempotency keys in Postgres: https://brandur.org/idempotency-keys
- OWASP Business Logic Security Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Business_Logic_Security_Cheat_Sheet.html
- MDN, BigInt not serializable: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/BigInt_not_serializable
- TigerBeetle multi-debit/credit transfers: https://docs.tigerbeetle.com/develop/recipes/multi-debit-credit-transfers
- RFC 4231 (HMAC-SHA256 vectors) and FIPS 180-2 (SHA-256 "abc"), checked locally with Node.

Secondary (practice, not authority):
- Modern Treasury on ledger immutability: https://www.moderntreasury.com/journal/enforcing-immutability-in-your-double-entry-ledger , https://www.moderntreasury.com/learn/data-immutability
- Fowler money pattern: https://verraes.net/2011/04/fowler-money-pattern-in-php/
- ICO 2025 anonymisation and pseudonymisation guidance (summaries): https://www.taylorwessing.com/de/global-data-hub/2025/spotlight-on-the-uk-data-landscape/gdh---new-ico-guidance-on-anonymisation-and-pseudonymisation , https://www.rpclegal.com/snapshots/data-protection/summer-2025/ico-publishes-new-guidance-on-anonymisation-and-pseudonymisation/
- EDPB Guidelines 01/2025 on pseudonymisation (summaries): https://stibbe.com/publications-and-insights/key-takeaways-and-insights-from-the-edpb-pseudonymisation-guidelines , https://www.hunton.com/insights/publications/edpb-advises-on-pseudonymisation-for-gdpr-compliance
- Attribution models: https://rewardful.com/first-or-last-touch-attribution , https://support.getcake.com/en/support/solutions/articles/5000545958 , https://getreditus.com/resources/glossary/attribution-window
- UK invoice and credit note contents (check against HMRC Notice 700/21): https://stripe.com/gb/resources/more/invoices-in-the-uk , https://invoicedataextraction.com/blog/uk-credit-note-requirements
