# Integration Readiness Checklist (Legal + Technical)

## Objective
Provide one standardized readiness framework for service networks, insurers and government channels before production integration.

## Priority Order
1. Service networks (brand service centers)
2. Insurance companies
3. Government channels (ASAN/eGov related flows)
4. Finance partners (bank/leasing) - phase extension

## Readiness Scoring Model
- Each dimension scored 0-2:
  - 0 = not ready
  - 1 = partially ready
  - 2 = fully ready
- Production threshold: total score >= 14/18 and no critical zero in Legal or Security.

Dimensions:
1. Legal basis
2. Data contract quality
3. API maturity
4. Security controls
5. Operational support
6. Monitoring and SLA
7. Testing and certification
8. Incident and dispute process
9. Commercial model clarity

## Universal Checklist

### A. Legal and Compliance
- [ ] Data sharing legal basis documented.
- [ ] User consent language approved by legal teams.
- [ ] Data retention and deletion rules signed off.
- [ ] Liability split and dispute escalation defined.
- [ ] Audit access rights agreed.

### B. Data Contract
- [ ] Field-level schema versioned and documented.
- [ ] Source-of-truth and update frequency defined.
- [ ] Error codes and nullability documented.
- [ ] Data freshness SLA declared.
- [ ] Backfill policy for historical data defined.

### C. API and Security
- [ ] Auth mechanism agreed (OAuth2, mTLS, signed keys).
- [ ] Rate limits and quotas documented.
- [ ] Idempotency and retry behavior defined.
- [ ] Encryption in transit and at rest confirmed.
- [ ] IP allowlist and key rotation process available.

### D. Operations
- [ ] Sandbox endpoint available.
- [ ] On-call contacts and escalation SLA confirmed.
- [ ] Planned downtime communication process defined.
- [ ] Incident response playbook aligned.

### E. Testing and Launch
- [ ] Contract tests passed in sandbox.
- [ ] Negative case tests passed (timeouts, malformed payloads).
- [ ] UAT sign-off from business owner and security owner.
- [ ] Production launch checklist approved.

## Partner-Type Specific Additions

## 1) Service Network Partners
- [ ] VIN-to-service-event mapping quality verified.
- [ ] Standardized service event taxonomy mapped.
- [ ] Odometer field consistency checks validated.
- [ ] Workshop branch identifiers normalized.

Critical go-live checks:
- At least 80% of incoming records mapped without manual intervention.
- Duplicate event rate below 2%.

## 2) Insurance Partners
- [ ] Claim status and severity mapping agreed.
- [ ] Claim event redaction policy approved (privacy-safe display).
- [ ] Policy active/expired interpretation documented.
- [ ] Event lag (T+N) defined and displayed as freshness metadata.

Critical go-live checks:
- Claim severity mapping accuracy >= 95% in test dataset.
- No prohibited personal fields in payloads.

## 3) Government-Linked Flows
- [ ] Consent and legal authority for query execution is explicit.
- [ ] Query logs are immutable and auditable.
- [ ] Session traceability preserved for each lookup.
- [ ] Data usage boundaries are enforceable by policy engine.

Critical go-live checks:
- 100% query traceability with actor, timestamp, purpose.
- Legal and security sign-off mandatory.

## RACI Model
- Product: owns use case and UX obligations.
- Legal/Compliance: owns lawful basis and terms.
- Security: owns control baseline and access policy.
- Engineering: owns connector reliability and observability.
- Partner Manager: owns commercial terms and SLA commitments.

## Go/No-Go Decision Template
- Partner:
- Integration type:
- Readiness score:
- Critical risks:
- Mitigations:
- Decision:
- Owner sign-offs:

## First 6-Week Execution Queue
Week 1-2:
- finalize legal templates and consent blocks.
Week 2-3:
- define canonical schemas and reason codes.
Week 3-4:
- run sandbox integration smoke tests.
Week 4-5:
- complete security and negative-case tests.
Week 5-6:
- run go/no-go board and schedule pilot rollout.
