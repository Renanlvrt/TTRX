# ADR 0005: Partner attribution rules

Status: accepted, 2026-10-20. The partners in tests and demos are fictional and use `.example` domains.

## Rules, in order
1. **Referral code.**
   - Codes are trimmed, upper-cased and must match `^[A-Z0-9]{4,16}$`.
   - A touch only counts if:
     - its code is known,
     - its partner is `active`,
     - the partner has an `active` contract at the time of signup,
     - the touch falls inside `[signupAt - 30 days, signupAt]`.
   - Among the touches that count, the first touch wins by default; last-touch is a setting.
   - If two touches have the same timestamp, the code that sorts first A to Z wins.
2. **Email domain.**
   - The student's email domain must match a partner domain exactly (case-insensitive).
   - Subdomains and lookalikes such as `alpha-lettings.example.evil.com` do not match.
   - Free webmail domains such as `gmail.com` cannot be partner domains (`FORBIDDEN_DOMAIN`).
3. **Otherwise the signup is unattributed.** It is recorded, and no fee is posted.

## Contracts
- A contract applies from `effectiveFrom` up to but not including `effectiveTo`, in UTC.
- A partner cannot have two active contracts that overlap.
- Status is `active`, `suspended` or `terminated`.
- Every rejected touch keeps its reason: `UNKNOWN_CODE`, `PARTNER_INACTIVE`, `NO_ACTIVE_CONTRACT`, `TOUCH_OUTSIDE_WINDOW` or `TOUCH_AFTER_SIGNUP`. If a partner disputes an attribution, we can answer from the data.

## Why
- An explicit code is stronger evidence than an email domain, so it takes precedence.
- First-touch pays the partner who introduced the student. Many affiliate programmes use a 30-day window.
- Each partner contract must state the touch model, so both sides read attribution the same way (`deferred/open-questions.md`).

## Sources
- https://rewardful.com/first-or-last-touch-attribution
- https://getreditus.com/resources/glossary/attribution-window
