import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "https://ekomobil.az";
const SESSION_COOKIE = __ENV.SESSION_COOKIE || "";

export const options = {
  scenarios: {
    mixed_traffic: {
      executor: "ramping-vus",
      startVUs: 10,
      stages: [
        { duration: "2m", target: 80 },
        { duration: "5m", target: 150 },
        { duration: "2m", target: 50 },
        { duration: "1m", target: 0 }
      ]
    }
  },
  thresholds: {
    http_req_failed: ["rate<0.03"],
    http_req_duration: ["p(95)<700", "p(99)<1500"]
  }
};

function authHeaders() {
  if (!SESSION_COOKIE) return {};
  return { Cookie: `ekomobil_session=${SESSION_COOKIE}` };
}

function doReadRequest() {
  const paths = ["/listings", "/auction", "/api/listings?limit=20", "/api/auctions?limit=20"];
  const path = paths[Math.floor(Math.random() * paths.length)];
  return http.get(`${BASE_URL}${path}`, { tags: { type: "read", path } });
}

function doLightWriteRequest() {
  // Auth-required endpoint for realistic session checks.
  return http.get(`${BASE_URL}/api/kyc/deep`, {
    headers: authHeaders(),
    tags: { type: "write_light", path: "/api/kyc/deep" }
  });
}

export default function () {
  const chance = Math.random();
  let res;
  if (chance < 0.8) {
    res = doReadRequest();
    check(res, { "read ok": (r) => r.status === 200 });
  } else {
    res = doLightWriteRequest();
    check(res, {
      "write light auth/status ok": (r) => r.status === 200 || r.status === 401
    });
  }

  sleep(Math.random() * 1.5 + 0.3);
}
