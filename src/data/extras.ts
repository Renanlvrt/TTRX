// "Don't forget" items for the Bills result and a local bills-package benchmark.
// Verified 2026-10-17 — see research/extra-claims.json for quotes and evidence.

export interface ExtraLink {
  label: string
  url: string
}

export interface ExtraItem {
  id: 'councilTax' | 'insurance'
  title: string
  headline: string
  detail: string
  links: ExtraLink[]
  source: string
}

export const EXTRAS: ExtraItem[] = [
  {
    id: 'councilTax',
    title: 'Council Tax',
    headline: '£0 if everyone is a full-time student',
    detail:
      'You still have to apply (one claim per house). One non-student in the house = only 25% off. Without it, a City of Durham Band A house is about £1,712/yr.',
    links: [
      { label: 'Apply online', url: 'https://openportal.durham.gov.uk/scripts/OPENPortal-Live.wsc/common/login.p' },
      { label: 'How it works', url: 'https://durham.gov.uk/article/4376/Money-off-Council-Tax-for-students' },
    ],
    source: 'https://durham.gov.uk/article/4376/Money-off-Council-Tax-for-students',
  },
  {
    id: 'insurance',
    title: 'Contents insurance',
    headline: 'Optional · about £74/yr per student',
    detail: "Covers laptops and phones. Check a parent's home policy first; it may already cover you.",
    links: [
      { label: 'Howden Student', url: 'https://www.howdeninsurance.co.uk/personal/student/student-contents-insurance/' },
      { label: 'studentGuard', url: 'https://www.guardcover.co.uk/studentguard' },
      { label: 'Cover4Insurance', url: 'https://www.cover4insurance.com/student-insurance/' },
    ],
    source: 'https://www.moneysupermarket.com/home-insurance/students/',
  },
]

/** Real Durham listing priced both ways: the gap is what the landlord charges for bills. */
export const PACKAGE_BENCHMARK = {
  pppw: 20,
  text: 'Durham check: a 4-bed on Ellis Leazes lists £175 pppw without bills or £195 with, so a £20 pppw package.',
  url: 'https://www.rightmove.co.uk/properties/167827430',
  checkedDate: '2026-10-17',
}
