# EkoMobil Auction Anti-Fraud Policy

## Main Risks
- Fake bids to inflate price
- Coordinated seller-bidder manipulation
- Winner no-show or refusal
- Account farming and repeated abuse
- False claims about off-platform payment completion

## Controls
- KYC-lite verification before bidding
- Phone verification and risk scoring
- Device/IP heuristics for suspicious behavior
- Velocity limits on bid creation
- Reserve anomaly alerts for manual ops review
- Completion confirmation requires buyer and seller attestation
- Ops may request proof of payment or proof of failed settlement for disputes

## Enforcement Ladder
- Warning
- Temporary bidding freeze
- Auction removal
- Account suspension
- Seller/dealer trust downgrade

## Ops Alerts
- Same device across multiple bidder accounts
- Bid spikes without normal browsing history
- Repeated last-minute withdrawals
- Reserve abuse patterns by seller cohort
- Repeated false “sale completed” claims
- Repeated winner no-show by the same user or device

## Audit Requirements
- Every bid must be immutable
- Every moderation decision must have actor + timestamp + reason
- Auction disputes must be linked to trust and user histories
- Platform fee events must be auditable separately from the vehicle sale amount
- No audit record should imply that the platform received the full vehicle price
