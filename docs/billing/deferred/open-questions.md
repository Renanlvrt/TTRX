# Open commercial questions

1. **Who pays?** Students' union, university accommodation office, letting agents, or a mix with different prices?
2. **What is billable?**
   - A signup, or an active user (for example, someone who finished the bills survey)?
   - Paying per active user resists fake signups, but needs an activity event.
3. **Attribution model per contract.**
   - First-touch or last-touch?
   - What lookback window? 30 days is the default.
   - Can two partners share a signup?
4. **Clawback window.** How long after signup can a fee be credited back, and for which reasons? (See `refunds-credit-notes.md`.)
5. **Disputes.** How long does a partner have to dispute an invoice? What evidence do we show? Our evidence is the audit log and the reasons attribution rejected each touch.
6. **Pricing.**
   - Flat fee only, or tiered pricing?
   - Graduated or volume tiers? (See `tiered-pricing.md`.)
   - Any minimum monthly fee?
7. **Currency.** GBP only for UK partners? EUR exists in code only to prove the exponent logic.
8. **Data sharing.**
   - What can a partner see about "their" students?
   - Default: counts and pseudonymous IDs only, never names or emails.
   - This needs a data-sharing agreement and a DPIA (`security/pii-pseudonymisation.md`).
