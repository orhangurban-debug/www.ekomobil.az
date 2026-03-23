# EkoMobil Auction Rules Engine

## Objective
Define a platform-only vehicle auction model where EkoMobil runs discovery, bidding, moderation, trust and service-fee collection, but does not receive or hold the full vehicle sale proceeds.

## Platform Position
- EkoMobil is the facilitator, not the seller, buyer, escrow agent or owner of the vehicle.
- The winning buyer pays the vehicle price directly to the seller off-platform.
- EkoMobil may collect only platform service payments:
  - auction lot fee
  - optional bidder deposit
  - no-show penalty
  - seller success fee invoice

## Supported Auction Modes
- Public ascending auction
- Reserve-price auction
- Optional pilot support for buy-now

## Seller Eligibility Rules
- Seller must be `verified`
- Listing must have:
  - VIN verification
  - trust score above configured threshold
  - media completeness = true
- Seller/dealer must have no unresolved critical disputes in the last 90 days
- Seller must accept the platform-only settlement model

## Bidder Requirements
- Verified account required
- Phone verification required
- Optional bidder deposit for high-value vehicles
- Anti-abuse rate limits per account/device/IP
- Buyer must accept post-win SLA and no-show rules

## Core Auction Rules
- Minimum bid increment is configurable by price band
- Auction duration is fixed or extended if bid arrives near closing window
- Reserve price can be hidden from buyers
- Seller cannot edit core listing attributes after the first valid bid
- Winning bidder gets a limited confirmation window
- Vehicle sale payment must not be routed through EkoMobil

## Auction State Machine
- `draft`
- `scheduled`
- `live`
- `extended`
- `ended_pending_confirmation`
- `buyer_confirmed`
- `seller_confirmed`
- `completed`
- `not_met_reserve`
- `no_show`
- `cancelled`
- `disputed`

## Resolution Rules
- If the winner does not confirm within SLA:
  - bidder may lose deposit or receive no-show penalty
  - offer may pass to next eligible bidder or auction closes without sale
- If the seller rejects a valid winning flow:
  - seller trust score penalty
  - auction abuse flag
- If both sides confirm successful completion:
  - seller success fee invoice may be issued

## Financial Rules
- Lot fee is collected before auction goes live
- Buyer deposit, if enabled, is a platform service payment and not part of the vehicle sale amount
- No-show penalty is a platform disciplinary charge
- Success fee is recognized only after `sale_confirmed` or `ops_verified`
- No state should imply that EkoMobil holds or settles the vehicle sale proceeds
