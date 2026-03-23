# EkoMobil Auction Anti-Fraud Policy

## Main Risks
- Fake bids to inflate price
- Coordinated seller-bidder manipulation
- Winner no-show or refusal
- Account farming and repeated abuse

## Controls
- KYC-lite verification before bidding
- Phone verification and risk scoring
- Device/IP heuristics for suspicious behavior
- Velocity limits on bid creation
- Reserve anomaly alerts for manual ops review

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

## Audit Requirements
- Every bid must be immutable
- Every moderation decision must have actor + timestamp + reason
- Auction disputes must be linked to trust and user histories
