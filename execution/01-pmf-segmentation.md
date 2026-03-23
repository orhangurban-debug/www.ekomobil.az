# AsanAvto PMF Segmentation (Hybrid: C2C + B2C)

## Objective
Define measurable product-market-fit hypotheses for both segments and align them to one North Star trajectory.

## Segment A: C2C (Individual Sellers and Buyers)

### Core Value Proposition
- Buy with confidence using verified vehicle history.
- Sell faster with trusted listing badge and structured listing quality.

### PMF Hypotheses
1. If we provide VIN-based transparency and mileage inconsistency flags, then buyers will trust listings more and conversion to contact will increase.
2. If we enforce high-quality listing media and structured checklist, then low-intent browsing will decrease and lead quality will improve.
3. If seller identity verification is visible, then fraud complaints and negotiation friction will decline.

### Ideal Customer Profile
- Buyer: 24-45, mobile-first, distrusts unverified listings, compares 2-3 alternatives before calling.
- Seller: private owner with one-time sale, wants faster sale with fewer low-quality calls.

### Quantitative Success Criteria (First 2 Quarters)
- Verified listings share >= 35% of active C2C inventory by end of Q2.
- Lead-to-visit rate >= 18% for verified listings.
- Median time-to-first-qualified-lead <= 48 hours.
- Fraud/dispute rate < 1.5% of completed C2C deals.
- Repeat buyer return within 90 days >= 20%.

### Qualitative PMF Signals
- Buyers explicitly mention "history transparency" in NPS verbatims.
- Sellers prefer verified flow even if it takes longer to publish.

## Segment B: B2C (Dealers/Autosalons)

### Core Value Proposition
- Inventory and lead management in one workflow.
- Higher trust profile increases qualified demand and lowers wasted calls.

### PMF Hypotheses
1. If dealers can bulk-publish with trust metadata, then cost-per-lead drops and listing activation time falls.
2. If CRM lead workflow is integrated into the listing lifecycle, then response time improves and close rate increases.
3. If dealer profile is verified and performance-rated, then buyer preference shifts toward verified dealers.

### Ideal Customer Profile
- 20-300 car inventory dealers in Baku and one additional city.
- Already paying for ads but lacking structured CRM and trust differentiation.

### Quantitative Success Criteria (First 2 Quarters)
- Dealer onboarding: 30 active dealerships by end of Q2.
- Median lead response time <= 15 minutes during business hours.
- Dealer lead-to-sale conversion >= 10%.
- Monthly dealer retention >= 85%.
- B2B MRR coverage >= 40% of paid acquisition spend by end of Q2.

### Qualitative PMF Signals
- Dealers move more inventory to AsanAvto from incumbent platforms.
- Sales managers request workflow enhancements rather than asking to leave.

## Shared North Star Alignment
- North Star: `Verified Transaction Rate`.
- Supporting levers:
  - Increase verified inventory quality.
  - Reduce trust uncertainty at discovery time.
  - Improve lead handling speed.

## Experiment Backlog (First 90 Days)
1. C2C verified badge A/B test on search cards.
2. VIN check trial week for first-time sellers.
3. Dealer SLA banner showing median response time on profile.
4. Listing quality score nudges before publish.

## Instrumentation Requirements
- Track verification funnel events (start -> completed -> visible badge).
- Track lead lifecycle events (created -> viewed -> contacted -> visited -> sold).
- Track dispute lifecycle with reason taxonomy.

## Exit Criteria for PMF Gate
Proceed to Scale if all are met for 2 consecutive months:
- Verified Transaction Rate trend is upward month-over-month.
- At least 3 of 5 quantitative success criteria reached per segment.
- No critical trust regression (fraud/dispute spike beyond threshold).
