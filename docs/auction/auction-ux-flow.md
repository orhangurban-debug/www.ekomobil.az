# EkoMobil Auction UX Flow

## Seller Flow
1. Choose `Auction` instead of `Standard Listing`
2. Complete trust checklist
3. Set reserve price, duration, optional buy-now
4. Preview auction detail page
5. Submit for moderation
6. Auction goes live after approval

## Buyer Flow
1. Discover auction listing in auction hub
2. Review trust panel, service history, reserve hints
3. Complete bidder verification
4. Place bid
5. Receive outbid / winning notifications
6. Confirm next-step after auction close

## Primary Screens
- Auction hub
- Auction detail
- Bid confirmation modal
- Bid history panel
- Seller auction dashboard
- Winner confirmation screen

## UX Principles
- Real-time urgency without dark patterns
- Trust information always visible above bidding actions
- Clear indication that EkoMobil is a platform facilitator
- Transparent timer, bid increments and fee implications

## Event Design
- `auction_viewed`
- `bid_started`
- `bid_submitted`
- `bid_outbid`
- `auction_won`
- `auction_reserve_not_met`
