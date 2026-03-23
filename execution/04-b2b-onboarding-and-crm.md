# B2B Onboarding Plan (20-30 Dealers) + CRM Must-Haves

## Target Outcome (First 90 Days)
- 20-30 dealerships onboarded and active.
- At least 70% weekly active usage in dealer portal.
- Median lead response time <= 15 minutes during business hours.

## Dealer Tiers for Rollout
- Tier A (anchor): 5-8 high-volume dealers.
- Tier B (growth): 10-15 medium dealers.
- Tier C (long-tail): 5-10 low-volume or niche dealers.

## Onboarding Funnel
1. Prospecting and qualification
2. Commercial agreement
3. Technical setup
4. Catalog import and quality pass
5. Team training and go-live
6. Hypercare (14 days)

## Qualification Checklist
- [ ] Inventory size and turnover rate known.
- [ ] Assigned dealer owner and backup contact.
- [ ] Commitment to response SLA and data hygiene.
- [ ] Existing listing channels and migration intent understood.

## 6-Week Dealer Onboarding Cadence

Week 1:
- Build target list and prioritize by inventory + reputation.
- Finalize pricing/contract package and onboarding script.

Week 2:
- Sign first 8-10 dealers.
- Run portal demos and configure trial environments.

Week 3:
- Complete bulk import for first wave.
- Validate trust metadata and listing quality protocol.

Week 4:
- Go-live wave 1 and start hypercare.
- Begin wave 2 signing (8-10 more dealers).

Week 5:
- Wave 2 data migration and user training.
- Publish dealer performance scorecards.

Week 6:
- Go-live wave 2; onboard final wave 3.
- Run retention check-ins and upsell review.

## CRM Panel Must-Have Features (Release 1)

### 1) Inventory Management
- Bulk listing upload (CSV/API), edit, pause, archive.
- VIN and trust status visible per listing.
- Media completeness and quality flags.

### 2) Lead Inbox and Routing
- Unified lead inbox with filters (new, contacted, visit booked, closed).
- Automatic routing by branch, agent availability, car category.
- Duplicate lead detection and merge.

### 3) SLA and Activity Tracking
- First response timer with breach alerts.
- Agent-level response and close metrics.
- Lead timeline: inquiry -> call -> visit -> sold/lost.

### 4) Communication Tooling
- Click-to-call logging.
- Template replies for chat/SMS/email (where integrated).
- Follow-up task reminders.

### 5) Dealer Trust Profile
- Verification status and public trust indicators.
- Recent dispute ratio and quality score.
- Listing quality score trend.

### 6) Reporting
- Daily leads, response time, test-drive bookings, close rate.
- Inventory aging report.
- Source-level conversion report.

## Roles and Permissions (Minimum)
- Dealer admin: full access, billing, users.
- Sales manager: lead routing, performance view.
- Agent: own leads and assigned inventory actions.
- Viewer/auditor: read-only reports.

## Data Migration Rules
- Required fields: VIN, make, model, year, mileage, price, branch, contact.
- Reject records with missing core fields.
- Auto-map common synonyms (gearbox/fuel/body type).
- Keep import audit logs with row-level errors.

## Success KPIs
- Dealer activation rate >= 80% (logged in and published within 7 days).
- Listing publish success rate >= 95% after first import.
- Dealer churn in first 90 days < 15%.
- Upsell to paid premium features >= 30% by day 90.

## Operational Playbook
- Daily onboarding standup during first 6 weeks.
- Dedicated onboarding manager per 10 dealers.
- Weekly QBR-lite with top-tier dealers for product feedback.

## Risks and Mitigations
- Risk: low adoption by sales agents.
  - Mitigation: mandatory SLA dashboard + simple mobile lead workflow.
- Risk: poor data quality in imports.
  - Mitigation: pre-import validator and assisted cleanup.
- Risk: delayed responses reduce trust.
  - Mitigation: breach notifications and escalation to manager.
