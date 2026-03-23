# EkoMobil Auction Rules Engine

## Objective
Define the rules engine for a platform-mediated vehicle auction where EkoMobil is the facilitator, not the seller.

## Supported Auction Modes
- Public ascending auction
- Sealed bid auction
- Hybrid: reserve price + buy-now

## Eligibility Rules
- Seller must be `verified`
- Listing must have:
  - VIN verification
  - trust score above configured threshold
  - media completeness = true
- Dealer/seller must have no unresolved critical disputes in the last 90 days

## Bidder Requirements
- Verified account required
- Phone verification required
- Optional refundable deposit for high-value vehicles
- Anti-abuse rate limits per account/device/IP

## Core Auction Rules
- Minimum bid increment is configurable by price band
- Auction duration is fixed or extended if bid arrives near closing window
- Reserve price can be hidden from buyers
- Seller cannot silently edit core listing attributes after first valid bid
- Winning bidder gets a limited acceptance window

## Auction State Machine
- `draft`
- `scheduled`
- `live`
- `extended`
- `ended_pending_acceptance`
- `won`
- `not_met_reserve`
- `cancelled`
- `disputed`

## Resolution Rules
- If winner does not confirm within SLA:
  - offer passes to next eligible bidder or auction closes without sale
- If seller rejects valid winning flow:
  - seller trust score penalty
  - auction abuse flag

## Revenue Hooks
- Listing fee for premium auctions
- Success fee only if transaction is completed through platform-supported flow
- Dealer auction subscription tier
