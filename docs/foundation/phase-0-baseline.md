# Phase-0 Baseline (Foundation and Compliance-by-Design)

## Scope Initialized
- Web foundation app for C2C + B2B user journeys.
- Trust domain model initialized:
  - VIN verification state
  - Mileage mismatch flags
  - Seller verification signal
  - Media completeness signal
- First trust score utility and preview UI scaffolded.

## Architecture Decisions
1. Domain-first trust model in `src/lib` for easy API integration later.
2. Audit-friendly signal structure with reason codes.
3. Thin UI layer using reusable trust component.

## Integration Placeholders (Next Step)
- `partner-connectors/service-centers`
- `partner-connectors/insurers`
- `partner-connectors/gov-gateway`

## Compliance Baseline
- No raw PII persisted in current scaffold.
- Trust decisions are explainable via reason codes.
- Model supports future immutable audit log integration.

## Immediate Build Backlog
1. Add listing publish flow and media protocol validator.
2. Add admin manual review queue (high-risk mileage mismatch).
3. Add event tracking for verification funnel.
4. Add B2B dealer portal shell and lead inbox MVP.
