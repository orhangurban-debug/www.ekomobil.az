import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "https://ekomobil.az";

export const options = {
  scenarios: {
    browsing_users: {
      executor: "ramping-vus",
      startVUs: 20,
      stages: [
        { duration: "2m", target: 100 },
        { duration: "5m", target: 300 },
        { duration: "2m", target: 100 },
        { duration: "1m", target: 0 }
      ]
    }
  },
  thresholds: {
    http_req_failed: ["rate<0.02"],
    http_req_duration: ["p(95)<500", "p(99)<1200"]
  }
};

const browsePaths = [
  "/",
  "/listings",
  "/auction",
  "/pricing",
  "/rules",
  "/rules/auction",
  "/terms",
  "/privacy"
];

export default function () {
  const path = browsePaths[Math.floor(Math.random() * browsePaths.length)];
  const res = http.get(`${BASE_URL}${path}`, {
    tags: { scenario: "browse", path }
  });

  check(res, {
    "browse status is 200/307": (r) => r.status === 200 || r.status === 307
  });

  sleep(Math.random() * 2 + 0.5);
}
