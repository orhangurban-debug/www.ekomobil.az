# Trust-MVP Backlog Freeze (Phase 1)

## Scope Boundary
This backlog is frozen for the first release scope (2-4 months):
- VIN entry and verification flow
- Mileage inconsistency flags
- Seller verification
- Minimum media protocol enforcement

Out of scope for this phase:
- Full eGov transaction completion
- AI damage detection
- 360 media pipeline

## Epic 1: VIN Verification Flow

### User Stories
1. As a seller, I can submit VIN so that buyers can see vehicle identity is validated.
2. As a buyer, I can view source and freshness of VIN verification data.
3. As an admin, I can review failed or suspicious VIN checks.

### Functional Requirements
- VIN format validation by market rules.
- Verification status: `pending`, `verified`, `failed`, `manual_review`.
- Source tagging: `user_submitted`, `service_partner`, `gov_partner`.
- Data freshness timestamp in listing.

### Acceptance Criteria
- Invalid VIN cannot be published.
- Verified VIN badge appears in search and listing detail.
- Any verification older than policy threshold shows stale warning.

### Priority
- Must-have.

## Epic 2: Mileage Inconsistency Flags

### User Stories
1. As a buyer, I can see whether declared mileage conflicts with known records.
2. As a seller, I am warned when declared mileage likely conflicts before publishing.
3. As risk ops, I can review high-risk mileage mismatch cases.

### Functional Requirements
- Compare declared mileage with latest trusted mileage events.
- Flag severity levels: `info`, `warning`, `high_risk`.
- Explainable reason code shown to users.
- Seller remediation flow: update listing or request review.

### Acceptance Criteria
- Listings with high-risk mismatch are blocked or sent to manual review.
- Reason codes are visible in admin and user-facing trust panel.
- Manual override requires admin note with audit log.

### Priority
- Must-have.

## Epic 3: Seller Verification

### User Stories
1. As a buyer, I can see if seller identity is verified.
2. As a seller, I can complete identity verification without leaving publish flow.
3. As support, I can suspend verification status upon abuse signals.

### Functional Requirements
- Verification states: `unverified`, `in_review`, `verified`, `restricted`.
- Minimal KYC metadata and consent capture.
- Badge and trust tooltip on listing card/detail.
- Abuse-triggered demotion workflow.

### Acceptance Criteria
- Unverified sellers can publish with limits.
- Verified sellers get ranking boost flag (configurable).
- Verification state changes are fully audited.

### Priority
- Must-have.

## Epic 4: Minimum Media Protocol

### User Stories
1. As a buyer, I only see listings that meet minimum visual quality.
2. As a seller, I receive clear guidance to complete required media.

### Functional Requirements
- Minimum: 20 photos + 15-30 second engine video.
- Required angle checklist (front, rear, both sides, dashboard, interior, odometer, trunk).
- Publish blocker until protocol is satisfied.
- Auto quality checks: file corruption, duration, min resolution.

### Acceptance Criteria
- Publish fails with actionable checklist for missing media.
- Listings meeting protocol get `MediaComplete` marker.
- Admin can allow policy exception with reason logging.

### Priority
- Must-have.

## Non-Functional Requirements (All Epics)
- Auditability: all trust state transitions are logged.
- Latency: trust status should render in listing under 300 ms at p95 (cached read path).
- Reliability: verification retries and dead-letter queue for failed partner calls.
- Security: PII access by least privilege only.

## Dependency Map
- VIN and mileage depend on partner connector readiness.
- Seller verification depends on legal copy and consent policy.
- Media protocol depends on storage and transcoding readiness.

## Release Gate Checklist
- [ ] End-to-end publish flow works for verified and unverified sellers.
- [ ] Trust panel displays VIN, mileage and seller signals.
- [ ] Admin manual review queue operational.
- [ ] Dashboard counters for trust funnel available.

## Suggested Sprint Breakdown
- Sprint 1: VIN flow + trust panel skeleton.
- Sprint 2: mileage flags + admin review queue.
- Sprint 3: seller verification and permissions.
- Sprint 4: media protocol enforcement + stabilization.
