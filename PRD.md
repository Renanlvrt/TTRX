# PRD: Student Renting Companion
## MVP Product Requirements Document

**Working name:** RentReady  
**Product type:** Student-focused web application  
**Initial market:** UK university students renting private accommodation  
**Initial target audience:** Students moving into their first shared house or flat  
**Primary objective:** Validate the problem and demonstrate a working solution during a six-hour hackathon  
**Commercial hypothesis:** Generate revenue through relevant service referrals, with potential future B2B partnerships.

---

# 1. Executive Summary

## 1.1 Product vision

RentReady helps students navigate the process of renting a house, from preparing to move in to eventually leaving the property.

Students often have to organise utility bills, understand household responsibilities, document existing damage, arrange storage, and prepare a property for moving out. These tasks are spread across different websites, providers, tenancy documents and advice pages.

RentReady brings these tasks into one guided experience. It helps students understand what they need to do, compares relevant options where possible, and directs them to suitable services.

The product has three primary modules:

1. **Bills:** Help students estimate whether bills-included accommodation or individually arranged utilities would be more cost-effective, and find suitable utility providers.
2. **Move-in and deposit protection:** Guide students through documenting the property's initial condition, recording existing damage, and preparing a structured report.
3. **Storage:** Help students find suitable storage services when moving between properties or returning home during holidays.

Cleaning recommendations are integrated into the moving journey as an additional service.

The product is designed to be free for students to use. Revenue may come from affiliate referrals and, if validated, commercial partnerships.

## 1.2 MVP objective

The MVP must demonstrate that students can use one simple application to:

- Understand and complete important moving tasks.
- Compare estimated utility costs against bills-included options.
- Record property damage through a guided photo checklist.
- Generate a structured record of the property's condition.
- Find relevant storage and cleaning services.
- Receive useful recommendations without navigating multiple unrelated websites.

The MVP is not expected to deliver a fully commercialised service, comprehensive UK utility-market coverage, or legally conclusive damage assessments.

Its purpose is to prove the user journey, demonstrate the core functionality, and establish whether the product deserves further development.

---

# 2. Problem Statement

## 2.1 The problem

Students frequently encounter practical responsibilities when renting accommodation that they have little experience handling.

These include:

- Determining whether bills-included rent is worth the additional cost.
- Understanding how much electricity, gas, water and broadband may cost.
- Setting up utility accounts and providing meter readings.
- Identifying and documenting existing property damage.
- Recording evidence that could help resolve a deposit dispute.
- Understanding how to report maintenance problems.
- Finding storage when moving between university terms or properties.
- Deciding whether professional cleaning is worth paying for before moving out.

Information and services exist, but students may need to find and compare them independently.

## 2.2 User problem statement

Students moving into rented accommodation need a simple way to understand their responsibilities, estimate their costs and organise essential moving tasks because they often lack experience with renting and must navigate fragmented information.

## 2.3 Consequences of the problem

Potential consequences include:

- Paying more for bills than necessary.
- Choosing unsuitable utility packages.
- Missing important documentation at move-in.
- Struggling to establish whether damage existed before the tenancy.
- Spending unnecessary time finding storage and cleaning services.
- Forgetting important tasks during an already stressful move.

The MVP should focus on the problems that can be addressed directly and demonstrated reliably.

## 2.4 Problem validation assumptions

The following are hypotheses to validate rather than established facts about every student:

- Students find it difficult to compare bills-included and bills-excluded accommodation.
- Students do not always document property damage adequately.
- Students would prefer guided instructions over long documents.
- Students would use one application for several moving-related tasks.
- Students will trust recommendations for third-party services if prices, limitations and commercial relationships are transparent.

---

# 3. Target Users

## 3.1 Primary users

### First-time student renters

Students moving from university accommodation or the family home into private rented accommodation.

Their needs include:
- Understanding what they need to organise.
- Estimating household bills.
- Documenting the property.
- Knowing what to do if something is wrong.

### Returning student renters

Students who already have experience renting but need to move between houses.

Their needs include:
- Comparing utility options.
- Managing move-in and move-out tasks.
- Finding storage and cleaning services.
- Maintaining consistent documentation across tenancies.

### Students moving between locations

Students moving to a different city, returning home during the summer, or travelling internationally.

Their needs include:
- Temporary storage.
- Transport and moving assistance.
- Coordinating departure and arrival dates.

## 3.2 Secondary stakeholders

- Utility and broadband providers.
- Storage companies.
- Cleaning companies.
- Moving companies.
- Universities and Students' Unions.
- Potentially, letting agencies and property managers.

Secondary stakeholders may become commercial partners. They are not required to use the MVP.

---

# 4. Product Scope and Priorities

## 4.1 Core modules

### Module A: Bills and cost comparison

Priority: P0, essential.

Students provide basic information about their household and usage preferences. The application estimates potential costs and compares bills-included accommodation with arranging bills separately.

### Module B: Move-in inspection and deposit documentation

Priority: P0, essential.

Students follow a guided checklist, capture photographs, add notes, record pre-existing damage and generate an organised report.

### Module C: Storage discovery

Priority: P0, essential for the product concept.

Students enter their location, dates and storage requirements to find relevant storage options.

For the six-hour prototype, a small curated list of sample or verified provider options is acceptable if live integrations are unavailable.

### Module D: Cleaning services

Priority: P1, supporting feature.

The application recommends cleaning services when appropriate, particularly before moving out. It explains what the student should consider cleaning before paying for a professional service.

### Module E: Contextual housing advice

Priority: P1, limited MVP implementation.

Provide concise guidance on common situations, such as documenting damage, reporting visible mould, and understanding the next steps when a maintenance issue occurs.

The MVP does not need an unrestricted AI assistant. A small collection of curated guidance and reliable sources is sufficient.

### Explicitly out of scope for the initial MVP

- Building a property search marketplace.
- Signing tenancy agreements.
- Making payments to utility providers.
- Automatically switching utility contracts.
- Full landlord or letting-agency management software.
- Legal advice or predictions of deposit dispute outcomes.
- Automated professional mould diagnosis.
- Nationwide, real-time comparisons of every utility tariff.
- A production-grade user account and cloud-storage system.

---

# 5. User Journey and Information Architecture

## 5.1 Landing page

The landing page introduces the product and presents three main modules.

**Headline:** Everything you need to get settled in your student house.

**Supporting text:** Compare bills, document your property and organise moving services in one place.

The page should immediately communicate the three primary actions:

1. Compare my bills.
2. Document my house.
3. Find storage.

A secondary action can offer cleaning recommendations.

The landing page must explain that the service is free to use and that certain third-party recommendations may generate a commission.

## 5.2 Journey overview

### Stage 1: Preparing to rent

The user can access a short viewing checklist containing practical checks, such as:

- Check water pressure and whether taps or showers leak.
- Look for visible mould, damp patches and water stains.
- Check windows, doors, locks and visible damage.
- Ask which bills are included in the rent.
- Ask about the property's heating system and energy arrangements.
- Check whether there is a suitable place for a washing machine, where relevant.
- Clarify who is responsible for maintenance and repairs.

The viewing checklist is informational. It is not a property-search engine or a professional survey.

### Stage 2: Moving in

The user selects the relevant module.

- Bills: estimate costs and compare arrangements.
- Property inspection: capture initial condition evidence.
- Storage: find a suitable service if required.

The application should allow users to complete modules independently rather than forcing a fixed sequence.

### Stage 3: Living in the property

Users can revisit their records, consult guidance, and find information about reporting maintenance issues.

The MVP may present this as a simple dashboard or a limited set of informational actions.

### Stage 4: Moving out

The user can:

- Repeat the original photo checklist.
- Compare move-in and move-out photographs.
- Record changes and notes.
- Generate an evidence report.
- Find cleaning services.
- Find storage for belongings.
- Review outstanding moving tasks.

The move-out experience should reuse the original inspection data wherever possible.

---

# 6. Functional Requirements: Bills Module

## 6.1 Objective

Help students determine whether a bills-included arrangement or separately arranged bills is likely to be more cost-effective for their household.

The application should explain its estimates and assumptions instead of presenting uncertain figures as guaranteed savings.

## 6.2 Inputs

The user should provide:

- Property postcode or approximate location.
- Number of occupants.
- Property type, if known.
- Number of bedrooms, if relevant to the estimate.
- Whether the property uses gas, electricity only, or another heating arrangement, if known.
- Whether water is metered, if known.
- Expected occupancy period.
- Expected household usage.
- Heating preferences.
- Shower frequency or duration, as an optional usage indicator.
- Expected broadband requirements.
- Whether the household has access to bills-included accommodation.
- The quoted bills-included cost per person per month, if available.

Avoid asking students to estimate technical quantities they are unlikely to know. Translate lifestyle questions into clearly labelled assumptions.

## 6.3 User flow

1. The user selects **Compare my bills**.
2. The application asks a short sequence of questions.
3. The application estimates household costs using available information.
4. The user enters the quoted bills-included price.
5. The application compares the estimated costs.
6. The user sees a breakdown of the estimated monthly and total cost.
7. The application identifies relevant providers or trusted comparison services.
8. The user opens a provider's website to check current tariffs and eligibility.

## 6.4 Comparison calculations

The system should calculate the estimated cost of individually arranged bills.

For each bill category:

Estimated monthly cost = estimated household consumption × applicable unit price + applicable standing charges.

The calculation must use consistent units and billing periods.

The estimated total should include only the bill categories selected by the user.

For a shared household:

Estimated monthly cost per person = total estimated monthly household cost ÷ number of occupants.

For the bills-included option:

Monthly cost per person = quoted monthly bills-included price per person.

If the price is quoted for the entire property, divide it by the number of occupants only when the user confirms that the cost is shared equally.

For a common comparison period:

- Calculate the estimated total cost of individually arranged bills.
- Calculate the total quoted bills-included cost over the same period.
- Show the difference.
- State which option appears cheaper under the current assumptions.

Do not assume that bills-included arrangements are unlimited. Users must be reminded to check fair-use limits, caps, exclusions and contractual terms.

## 6.5 Comparison results

The results page should display:

- Estimated monthly household cost.
- Estimated monthly cost per person.
- Estimated cost over the selected tenancy period.
- Bills-included cost for the same period.
- Estimated difference between the options.
- Individual cost breakdowns.
- Assumptions and confidence limitations.
- Links to relevant provider or comparison websites.

Example presentation:

**Estimated cost per person**

| Arrangement | Monthly estimate |
|---|---:|
| Bills included | £160 |
| Bills arranged separately | £125 |
| Estimated difference | £35/month |

These values are illustrative only and must not be presented as live market prices.

The application should explain that actual costs depend on property efficiency, weather, household usage, tariffs and contractual conditions.

## 6.6 Utility provider links

For the MVP, provider links may be curated manually.

Each provider entry should contain:

- Provider name.
- Bill category.
- Relevant service or tariff page.
- Pricing information, only when verified.
- Date the information was last checked.
- Any known eligibility restrictions.
- Affiliate disclosure, if applicable.

Never invent a tariff, imply a price is current without verification, or claim to have arranged a contract for the user.

## 6.7 Revenue functionality

Where approved affiliate programmes exist, the application may include tracked referral links.

Revenue must not influence the cost-comparison calculations or cause the application to rank a more expensive option as the best choice.

The comparison should prioritise user suitability and transparent estimated costs.

If no affiliate agreement exists, provider links must not be presented as revenue-generating.

---

# 7. Functional Requirements: Move-in Inspection

## 7.1 Objective

Help students create a structured, dated record of the property's condition when they take possession.

The feature should reduce the chance that a student forgets to document pre-existing damage.

## 7.2 Inspection setup

The user selects:

- Property address or a descriptive property label.
- Move-in date.
- Inspection date.
- Rooms or areas to inspect.
- Whether this is the initial inspection or a later inspection.

The system creates an inspection record.

For a first-time inspection, the record becomes the reference point for future comparisons.

## 7.3 Guided checklist

The application should guide the user through relevant inspection areas.

### Bathroom

- Shower, bath and visible sealant.
- Grout and visible mould or staining.
- Sink and taps.
- Toilet.
- Tiles and flooring.
- Ventilation and extractor fan, where present.
- Walls and ceiling.
- Skirting boards.
- Visible leaks or water damage.

### Kitchen

- Worktops and cupboards.
- Sink and taps.
- Visible leaks.
- Fridge and freezer.
- Oven and hob.
- Appliance handles and visible damage.
- Flooring.
- Walls and ceiling.
- Windows and doors.

### Bedroom

- Each corner of the room.
- Walls and ceiling.
- Skirting boards.
- Flooring and carpets.
- Windows and frames.
- Wardrobe and furniture provided with the property.
- Doors and handles.
- Visible damp, staining or damage.

### Living room and communal areas

- Walls and ceiling.
- Corners and skirting boards.
- Flooring and carpets.
- Windows and doors.
- Furniture supplied with the property.
- Visible marks, cracks or damage.

### Additional areas

Where applicable, users may document hallways, staircases, utility cupboards, outdoor areas and other spaces included in the tenancy.

## 7.4 Photo capture

Each checklist item should support:

- Taking a photograph using the device camera.
- Uploading an existing photograph, where supported.
- Adding a written note.
- Marking the item as checked.
- Marking the item as damaged, concerning or not applicable.
- Retaking or removing an incorrect photograph.

The system should preserve the original image and avoid destructive editing.

Photographs should be linked to the relevant property, inspection, room and checklist item.

The interface should show which checklist items remain incomplete.

## 7.5 Damage records

Each damage record should contain:

- Room or area.
- Checklist item.
- Photograph.
- Date and time recorded by the application.
- Optional user note.
- Condition category.
- Whether the issue was reported to the landlord or agent.
- Optional record of the response.

Example:

Room: Bathroom

Item: Bottom-right corner beside shower

Condition: Existing staining

Note: Dark marks visible around the sealant during the initial inspection.

The application must distinguish user observations from AI-generated interpretations.

## 7.6 Inspection completion

Once the user finishes the checklist, the application should:

1. Display a summary of completed items.
2. Identify incomplete checklist items.
3. Show all recorded concerns.
4. Allow the user to review the photographs.
5. Generate an inspection report.
6. Allow the user to download or share the report.

The application should remind users to send relevant evidence to the landlord or letting agent through an appropriate channel and retain a copy.

## 7.7 Initial report

The report should include:

- Property identifier.
- Inspection date.
- Room-by-room records.
- Photographs and associated notes.
- Items marked as damaged or concerning.
- Items not inspected.
- A clear indication that it is a user-created inspection record.

The report should not claim that the property has passed a professional inspection.

---

# 8. Functional Requirements: Move-out Comparison and Deposit Support

## 8.1 Objective

Allow students to compare the property's initial and final condition using the original inspection records.

## 8.2 User flow

1. The user opens the existing property record.
2. The user selects **Start move-out inspection**.
3. The system loads the original room and item checklist.
4. The user captures new photographs of the same areas.
5. The application pairs new photographs with the corresponding original records.
6. The user reviews changes and adds notes.
7. The application generates a move-out report.

The original inspection must remain unchanged.

## 8.3 Photo comparison

The comparison interface should display:

- Initial photograph.
- Move-out photograph.
- Initial note.
- Move-out note.
- Dates associated with each photograph.
- User-reported changes.

The user should be able to review the two images side by side.

Where feasible, the application may provide an optional visual comparison feature to highlight possible differences.

## 8.4 AI-assisted comparison

If implemented, AI may suggest possible visible changes between paired photographs.

Examples:

- A new-looking scratch.
- A change in a stain.
- Missing or damaged visible items.
- A possible difference in sealant condition.

The system must:

- Label these as potential differences, not confirmed damage.
- Allow the user to correct or dismiss the suggestion.
- Avoid deciding who caused the change.
- Avoid calculating a legally binding deduction.
- Never claim that an image alone proves liability.

For the six-hour MVP, deterministic pairing and manual review are more important than sophisticated visual analysis.

## 8.5 Generated email

The application should allow the user to generate an editable email based on their inspection records.

For example:

Subject: Property condition record following move-in inspection

Dear [Landlord or Agent],

I am writing to document the condition of the property at [address] following my move-in inspection on [date].

During the inspection, I recorded the following existing issues:

- [Issue and location]
- [Issue and location]

I have attached the relevant photographs for your records. Please confirm receipt and let me know whether any action is required.

Kind regards,

[Student name]

The email must be editable before sending.

The application must never send an email without the user's explicit approval.

The system should also support a move-out email that references the initial and final inspection records.

## 8.6 Report generation

The move-out report should contain:

- Initial inspection date.
- Final inspection date.
- Matched photographs.
- User notes.
- Potential changes identified.
- Existing issues documented at move-in.
- Missing or unmatched photographs.
- A disclaimer that the report is supporting evidence, not a legal determination.

The report should be available for download and sharing.

## 8.7 Deposit guidance

The application may provide general information about deposit protection, evidence, and dispute resolution in England.

Guidance should reference authoritative sources, including the relevant tenancy deposit protection scheme or government guidance.

The application must not guarantee that a student will recover their deposit or that a landlord's proposed deduction is unlawful.

---

# 9. Functional Requirements: Storage

## 9.1 Objective

Help students find storage when moving between properties, returning home, or leaving belongings behind during university holidays.

## 9.2 Inputs

- Current or preferred location.
- Storage start date.
- Expected storage duration.
- Approximate volume or number of boxes.
- Whether collection is required.
- Whether delivery is required.
- Budget, if known.
- Optional requirements such as access hours or insurance.

## 9.3 Storage recommendations

The results page should show available or curated options with:

- Provider name.
- Location or service area.
- Storage type.
- Price, only when verified.
- Minimum rental period.
- Collection and delivery options.
- Relevant terms.
- Provider website.
- Affiliate disclosure where applicable.

If live availability and pricing cannot be accessed, the application must clearly label the results as indicative and direct the user to confirm the final quote with the provider.

## 9.4 Storage user flow

1. User selects **Find storage**.
2. User enters location and storage requirements.
3. Application displays relevant options.
4. User compares available options.
5. User opens the provider's website to request a quote or make a booking.

The MVP does not need to process storage bookings or payments.

---

# 10. Functional Requirements: Cleaning

## 10.1 Objective

Help students decide whether to clean the property themselves or arrange a professional cleaning service before moving out.

## 10.2 Cleaning guidance

The application may provide a checklist covering:

- Kitchen surfaces and cupboards.
- Oven and hob, where relevant.
- Fridge and freezer.
- Bathroom and sanitary fittings.
- Visible limescale and ordinary dirt.
- Floors and carpets.
- General surfaces.
- Removal of personal belongings and rubbish.

The checklist must not suggest that ordinary cleaning can resolve serious mould, leaks or other underlying property defects.

## 10.3 Service recommendations

If professional cleaning may be useful, the application should ask for:

- Property location.
- Property size.
- Type of cleaning required.
- Preferred date.
- Whether additional services are required.

The system may display cleaning providers and direct the user to request a quote.

## 10.4 Cleaning cost comparison

Where reliable prices are available, compare the quoted cleaning service cost with the student's budget.

Do not claim that professional cleaning guarantees the return of the deposit.

The application should explain that deposit outcomes depend on the tenancy agreement, the property's condition, evidence and applicable rules.

---

# 11. Shared Platform Requirements

## 11.1 Navigation

The application should provide simple navigation between:

- Home.
- Bills.
- Move-in inspection.
- Move-out comparison.
- Storage.
- Cleaning.
- Help and guidance.

The user must be able to return to the home screen without losing completed work.

## 11.2 Property workspace

A property record groups related information together.

Each property can contain:

- Property details.
- Inspection records.
- Photographs.
- Notes.
- Generated reports.
- Moving tasks.
- Relevant service recommendations.

For the hackathon, a single demo property is sufficient, provided the structure can support multiple properties later.

## 11.3 Progress tracking

Each module should display a simple status:

- Not started.
- In progress.
- Completed.

Users should be able to revisit completed tasks.

The system should not mark an inspection complete if required checklist items have not been addressed without explicitly recording them as skipped or not applicable.

## 11.4 Data persistence

User-entered data should remain available when navigating between screens and refreshing the application, within the persistence capabilities of the MVP.

For a six-hour prototype, browser-local persistence may be sufficient for a demonstration.

Production deployment would require a more robust storage strategy.

## 11.5 Export and sharing

The application should support:

- Downloading inspection reports.
- Downloading or sharing move-out comparisons.
- Copying generated email text.
- Opening third-party service links.

The MVP must not pretend that an email has been sent or a third-party booking completed when the user has only generated text or opened a link.

---

# 12. AI and Recommendation Requirements

## 12.1 Appropriate AI uses

AI may be used for:

- Turning inspection notes into a clear report.
- Drafting emails from user-provided information.
- Explaining common renting concepts in plain English.
- Suggesting relevant checklist items.
- Highlighting possible image differences.
- Asking follow-up questions to improve utility estimates.

## 12.2 AI limitations

AI must not:

- Invent current utility tariffs or storage prices.
- Guarantee savings.
- Make definitive legal determinations.
- Diagnose the cause of mould from a photograph.
- Determine legal liability for damage.
- Promise a deposit refund.
- Send messages or make bookings without approval.

## 12.3 Source-grounded guidance

Where advice depends on current law or official rules, the application should cite relevant authoritative sources.

For England, useful sources include GOV.UK, Citizens Advice and the applicable tenancy deposit protection scheme.

If a source cannot be verified, the application should say so rather than present a guess as fact.

## 12.4 MVP implementation strategy

The initial product does not require a complex AI architecture.

A practical approach is:

- Use deterministic calculations for utility estimates.
- Use a predefined inspection checklist.
- Use a simple template system for reports and emails.
- Use curated guidance with source links.
- Add AI-generated text only where it provides a clear benefit.

This reduces development risk and makes the demonstration more reliable.

---

# 13. Revenue Model

## 13.1 Core principle

Students should be able to use the essential functionality without paying.

The product should monetise relevant services where a legitimate commercial arrangement exists, rather than withholding basic protection or guidance.

## 13.2 Primary initial revenue hypothesis: Affiliate referrals

Potential categories include:

- Broadband.
- Electricity and gas.
- Contents insurance.
- Storage.
- Professional cleaning.
- Moving services.

The application may receive a commission when a user completes an eligible action through an approved referral programme.

Actual revenue depends on provider agreements, user conversion, commission rates and eligibility.

The MVP must not claim to have affiliate partnerships that have not been established.

## 13.3 Secondary future revenue hypothesis: Commercial partnerships

Potential future customers include:

- Storage companies seeking student customers.
- Cleaning businesses seeking bookings.
- Utility comparison services.
- Moving companies.
- Universities or accommodation organisations interested in a student support service.

These are potential customers, not validated buyers.

The product should only pursue partnerships where the service provides demonstrable value.

## 13.4 Revenue tracking

If affiliate links are integrated, the system should record available referral events such as:

- Provider link viewed.
- Provider link clicked.
- Referral source.
- Module that generated the referral.

Actual purchases and commissions should only be recorded where the affiliate provider supplies reliable confirmation.

## 13.5 Commercial validation metrics

The project should eventually measure:

- Percentage of users completing a bills comparison.
- Percentage clicking a provider link.
- Percentage completing an eligible purchase.
- Revenue per active user.
- Cost of acquiring a user.
- Percentage returning to the app during move-out.
- Number of commercial partners willing to participate in a pilot.

The six-hour hackathon cannot establish a reliable long-term conversion rate. It can establish a measurement plan and test the first steps of the user journey.

---

# 14. Non-Functional Requirements

## 14.1 Usability

- The interface should be easy to use for someone unfamiliar with renting.
- Instructions should use plain English.
- Forms should ask only for information necessary for the current task.
- Users should be able to complete a module without completing every other module.
- The interface should work on a typical smartphone and desktop browser.

## 14.2 Performance

- Navigation should feel responsive.
- The application should show loading states when operations take time.
- Large photo uploads should not freeze the interface.
- Report generation should provide clear feedback.

## 14.3 Reliability

- Users should receive an error message when a photo or report fails to save.
- Failed operations should not silently discard data.
- The application should handle incomplete forms.
- Utility calculations should be deterministic and testable.
- Unknown prices should be shown as unavailable, not fabricated.

## 14.4 Privacy and security

Photographs and property records may contain sensitive information.

The application should:

- Request only necessary information.
- Avoid collecting financial account credentials.
- Avoid exposing property records publicly.
- Keep uploaded images private.
- Explain how data is stored and used.
- Avoid collecting unnecessary personal information from other occupants.
- Provide a way to remove demo data.
- Obtain appropriate permission before processing images with third-party AI services.

A production version must establish appropriate retention, deletion, access control and data-protection procedures.

## 14.5 Accessibility

- Controls must have understandable labels.
- Text should be readable at common mobile sizes.
- Important information should not rely on colour alone.
- Forms should provide clear error messages.
- Camera functionality must have an alternative where a user cannot or does not wish to take a photograph.

---

# 15. Suggested Technical Architecture

The implementation should prioritise speed, reliability and a working end-to-end demonstration.

## 15.1 Frontend

A responsive web application is recommended.

Possible stack:

- React.
- TypeScript.
- A utility-first CSS framework or a component library.
- Browser camera and file-upload capabilities.
- Client-side routing.

The exact stack can be adjusted to the team's existing skills.

## 15.2 Data model

The following entities should be represented in the application.

### Property

- Property ID.
- Address or property label.
- Move-in date.
- Move-out date, if known.
- Number of occupants.

### Inspection

- Inspection ID.
- Property ID.
- Inspection type.
- Inspection date.
- Completion status.

### Inspection item

- Item ID.
- Inspection ID.
- Room.
- Checklist item.
- Condition category.
- Notes.
- Completion status.

### Photo

- Photo ID.
- Inspection item ID.
- Image reference.
- Capture or upload timestamp.
- Optional caption.

### Bills estimate

- Estimate ID.
- Location.
- Household size.
- Usage assumptions.
- Selected bill categories.
- Estimated cost breakdown.
- Comparison period.
- Source and date of pricing information, where applicable.

### Service provider

- Provider ID.
- Provider name.
- Service category.
- Service area.
- Website URL.
- Verified pricing information, if available.
- Affiliate status.
- Last verified date.

## 15.3 Persistence strategy

For the hackathon:

- Use local browser storage for non-sensitive demo state where appropriate.
- Use object URLs or a suitable local persistence mechanism for photographs during the demo.
- Generate reports from the current property and inspection data.
- Use curated provider data if live integrations are unavailable.

Do not treat temporary image URLs as permanent records.

For production, introduce authenticated accounts, private object storage, a database and appropriate access controls.

## 15.4 Integration strategy

The MVP may use:

- Curated utility provider links.
- Curated storage provider links.
- Curated cleaning provider links.
- Local utility estimation calculations.
- Client-side report generation.
- Optional AI integration for text generation.

Live tariffs, provider booking APIs and affiliate tracking should be added only when access and implementation time permit.

---

# 16. Six-Hour Hackathon Execution Plan

## Hour 1: Build the foundation

- Create the application structure.
- Implement the landing page.
- Add navigation between the three core modules.
- Create the basic property workspace.
- Define the data structures.

**Deliverable:** A navigable application.

## Hour 2: Implement bills

- Build the household questionnaire.
- Implement the estimated cost calculation.
- Add the bills-included comparison.
- Display a cost breakdown and assumptions.
- Add curated provider links.

**Deliverable:** A working bills comparison using clearly labelled example data or verified inputs.

## Hour 3: Implement the inspection checklist

- Add room and checklist selection.
- Implement camera capture or image upload.
- Add notes and condition labels.
- Save inspection records.
- Display completed and incomplete items.

**Deliverable:** A working initial inspection flow.

## Hour 4: Implement reports and move-out comparison

- Generate a report from inspection data.
- Allow users to download or share it.
- Implement a second inspection using the same checklist.
- Display initial and final photographs together.
- Generate an editable email template.

**Deliverable:** A demonstrable evidence workflow.

## Hour 5: Implement storage and cleaning

- Add a storage questionnaire.
- Display relevant curated provider options.
- Add cleaning guidance and provider links.
- Connect the modules to the main dashboard.
- Add affiliate disclosure placeholders where appropriate.

**Deliverable:** A coherent moving-services journey.

## Hour 6: Test and prepare the pitch

- Test the complete user journey.
- Fix the most important errors.
- Prepare sample property data.
- Verify report generation.
- Confirm calculations and assumptions.
- Prepare the three-minute demo.
- Prepare the revenue hypothesis and market evidence.
- Make clear which features are implemented and which are planned.

**Deliverable:** A stable, end-to-end MVP demonstration.

If time becomes constrained, prioritise a functioning bills comparison, a working photo checklist, and a generated inspection report. Storage can use curated sample data rather than a live integration.

---

# 17. Acceptance Criteria

The MVP is ready to demonstrate when the following requirements work.

## Bills

- A user can enter household details.
- The system calculates an estimated cost using documented assumptions.
- The system compares bills-included and separately arranged bills over the same period.
- The result explains which option appears cheaper and by how much.
- The system does not fabricate provider prices.
- Provider links open correctly.

## Move-in inspection

- A user can create a property record.
- The user can navigate a room-by-room checklist.
- The user can capture or upload photographs.
- The user can add notes and mark issues.
- The application preserves the relationship between photos and checklist items.
- The user can generate a report.

## Move-out

- The application can create a new inspection for an existing property.
- The original inspection remains available.
- The user can view initial and final photographs together.
- The user can generate a comparison report.
- The application can create an editable email containing recorded issues.

## Storage

- A user can enter basic storage requirements.
- The application displays relevant provider options.
- The user can open provider websites.
- Unverified prices and availability are not presented as confirmed.

## Cleaning

- The user can access a moving-out cleaning checklist.
- The application can show relevant cleaning services.
- The application does not guarantee deposit recovery.

## Overall

- The application is navigable on mobile and desktop.
- The user can move between modules.
- The main demo can be completed without a developer manually editing the underlying data.
- The interface clearly distinguishes working features from simulated integrations.

---

# 18. Success Metrics

The MVP should be evaluated on product functionality, user usefulness and commercial plausibility.

## Product metrics

- Percentage of test users who finish the bills comparison.
- Percentage who complete the initial inspection.
- Time required to create an inspection report.
- Percentage who successfully compare initial and final photographs.
- Number of errors during the main demonstration.

## User validation metrics

- Number of students interviewed or observed using the prototype.
- Number who report experiencing the identified problems.
- Number who currently use alternative solutions.
- Number who complete a task without assistance.
- Number who say they would use the product again, supported where possible by actual behaviour.

## Commercial metrics

- Number of provider programmes that could support relevant referrals.
- Actual affiliate commission terms, where available.
- Estimated conversion rate assumptions and their evidence.
- Number of potential commercial partners contacted.
- Number willing to discuss a pilot.
- Evidence of willingness to pay, where obtainable.

The product should not claim commercial validation merely because users say they like the idea.

---

# 19. Risks and Mitigations

## Risk: The product is too broad

**Mitigation:** Keep the three modules but make bills comparison and inspection documentation the principal demo flows. Treat cleaning as a supporting feature and avoid building every possible integration.

## Risk: Existing products already offer inspection tools

**Mitigation:** Investigate competitors and position the product around the wider student renting journey. Do not claim the photo workflow is unique without evidence.

## Risk: Utility estimates are inaccurate

**Mitigation:** Display assumptions, use consistent billing periods, distinguish estimates from verified prices, and direct users to check provider tariffs.

## Risk: Affiliate revenue is too low

**Mitigation:** Model realistic conversion scenarios and test whether relevant providers offer suitable affiliate programmes. Do not assume that a click produces a commission.

## Risk: Students use the product once and never return

**Mitigation:** Provide value at move-in, during the tenancy and at move-out. Measure repeat use rather than assuming retention.

## Risk: Users mistake AI suggestions for legal advice

**Mitigation:** Use source-grounded guidance, communicate uncertainty and avoid definitive legal conclusions.

## Risk: Students do not trust commercial recommendations

**Mitigation:** Disclose affiliate relationships, present alternatives fairly, and keep user interests central to comparisons.

## Risk: The business has no validated paying customer

**Mitigation:** Treat affiliate partnerships as a hypothesis, investigate provider economics, and test commercial interest before claiming the product is a proven business.

---

# 20. Final Product Positioning

RentReady is a free student renting companion that helps students compare household bills, document property condition, and organise essential moving services.

Its core proposition is simple:

**Understand your costs. Document your home. Move with confidence.**

The MVP brings these tasks together in one guided experience.

The immediate objective is to demonstrate that the product makes common renting tasks easier and more structured. The longer-term objective is to establish whether affiliate referrals and relevant commercial partnerships can support a sustainable business.

The hackathon should prove that the product works. Subsequent validation must prove that students use it, that its recommendations create value, and that the resulting economics can support the business.
