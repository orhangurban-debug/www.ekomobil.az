import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "https://ekomobil.az";
const AUCTION_ID = __ENV.AUCTION_ID || "";
const SESSION_COOKIE = __ENV.SESSION_COOKIE || "";
const BID_START = Number(__ENV.BID_START || "1000");
const BID_STEP = Number(__ENV.BID_STEP || "100");

if (!AUCTION_ID) {
  throw new Error("AUCTION_ID env var is required for hot-auction-bids test.");
}

export const options = {
  scenarios: {
    burst_bidders: {
      executor: "ramping-vus",
      startVUs: 5,
      stages: [
        { duration: "1m", target: 30 },
        { duration: "3m", target: 70 },
        { duration: "1m", target: 30 },
        { duration: "1m", target: 0 }
      ]
    }
  },
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<900", "p(99)<2000"]
  }
};

function randomBid() {
  const spread = Math.floor(Math.random() * 8);
  return BID_START + spread * BID_STEP;
}

export default function () {
  const headers = {
    "Content-Type": "application/json"
  };
  if (SESSION_COOKIE) {
    headers.Cookie = `ekomobil_session=${SESSION_COOKIE}`;
  }

  const payload = JSON.stringify({
    amountAzn: randomBid()
  });

  const res = http.post(`${BASE_URL}/api/auctions/${AUCTION_ID}/bid`, payload, {
    headers,
    tags: { type: "bid", auction_id: AUCTION_ID }
  });

  check(res, {
    "bid route responded": (r) => r.status >= 200 && r.status < 500
  });

  sleep(Math.random() * 0.8 + 0.2);
}
