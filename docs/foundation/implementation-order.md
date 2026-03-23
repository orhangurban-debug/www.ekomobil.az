# Technical Implementation Order

This repository follows a dependency-safe order:

1. Core domain and validation
   - Trust types, listing validation, media protocol.
2. Trust backend APIs
   - Evaluation endpoint, manual review queue endpoints.
3. Publish flow UI
   - Enforces validation and calls trust APIs.
4. B2B shell
   - Dealer inventory and lead inbox baseline.
5. Analytics layer
   - Event taxonomy and ingestion API.
6. Operations visibility
   - Review queue and analytics monitor routes.

Why this order:
- Prevents UI-first drift by locking rules in domain code.
- Keeps trust-critical logic testable before scale features.
- Ensures observability exists before expansion.
