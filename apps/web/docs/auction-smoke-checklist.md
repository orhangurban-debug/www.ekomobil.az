# Auction Smoke Checklist

Use this checklist before each production deploy touching auction logic.

## 1) Lot lifecycle

- [ ] Create lot from `/auction/sell`.
- [ ] Complete lot fee payment and verify lot moves to `live`/`scheduled` as expected.
- [ ] Wait for close sweep or force close path; verify final status transitions:
  - `ended_pending_confirmation`
  - `pending_seller_approval`
  - `not_met_reserve`

## 2) Bid flow

- [ ] Bid below min increment is rejected with clear error.
- [ ] Seller cannot bid on own lot.
- [ ] Bid on closed/non-live lot is rejected.
- [ ] Auto-bid with two users resolves to expected winner and next minimum.

## 3) Pre-auth / deposit gate

- [ ] STRICT_PRE_AUTH mode: bid returns preauth requirement if hold missing.
- [ ] Complete preauth callback and verify bidder can place bid.
- [ ] Deposit-required lot: bidder without held deposit cannot bid.
- [ ] Held deposit bidder can bid.
- [ ] Repeated deposit create clicks reuse same active checkout (no duplicate redirect orders).

## 4) Settlement confirmation

- [ ] Buyer confirm only allowed in settlement statuses.
- [ ] Seller confirm only allowed in settlement statuses.
- [ ] `no_show` only seller-triggered.
- [ ] `seller_breach` only buyer-triggered.
- [ ] `completed` status only after both sides confirm.

## 5) Payment callbacks security

- [ ] Non-remote/internal callback requires valid `x-signature`.
- [ ] Invalid signature returns 401.
- [ ] Live callback with verified remote order status finalizes correctly.
- [ ] Repeated callback delivery is idempotent (does not create duplicate state transitions).

## 6) Realtime and UI resilience

- [ ] Stream disconnect does not crash page.
- [ ] Invalid stream payload does not break UI.
- [ ] Submit buttons recover after network failure (no stuck loading state).
- [ ] `/auction` main page blocks bidding for non-open lot statuses.

## 7) Admin/Ops

- [ ] Ops can review auction documents approve/reject.
- [ ] Dispute evidence upload works for both sides.
- [ ] Audit logs contain bid and close events.

## 8) Accounting side effects

- [ ] No-show and seller-breach checkout flows create expected payment records.
- [ ] Repeated service payment create calls reuse existing redirect/succeeded record for same obligation.
- [ ] Settlement updates deposit return/forfeit outcomes correctly.
- [ ] Penalty balances are applied only on intended branches.
