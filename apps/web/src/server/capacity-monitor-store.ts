import { getPgPool } from "@/lib/postgres";
import { getAdminOverview } from "@/server/admin-store";
import { getAuctionServiceTelemetry } from "@/server/auction-ops-store";

type AlertSeverity = "info" | "warning" | "critical";

interface TrafficMetrics {
  analytics15m: number;
  analytics1h: number;
  analytics24h: number;
  leads24h: number;
  listings24h: number;
}

interface ProtectedApiMetrics {
  protectedRequests15m: number;
  distinctKeys15m: number;
  oauth15m: number;
  login15m: number;
  bid15m: number;
  payment15m: number;
}

export interface CapacityAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  recommendation: string;
}

export interface CapacitySnapshot {
  generatedAt: string;
  overview: Awaited<ReturnType<typeof getAdminOverview>>;
  database: {
    healthy: boolean;
    latencyMs: number | null;
    poolMax: number;
    rateLimitFailOpen: boolean;
  };
  traffic: TrafficMetrics;
  protectedApi: ProtectedApiMetrics;
  auction: {
    connected: boolean;
    healthOk: boolean;
    acceptedBids: number;
    rejectedBids: number;
    viewerCount: number;
    lockWaitAvgMs: number;
    lockWaitMaxMs: number;
  };
  recommendation: {
    status: "launch_ok" | "tune_soon" | "prepare_scale" | "critical";
    label: string;
    detail: string;
  };
  alerts: CapacityAlert[];
}

function toPositiveInt(raw: string | undefined, fallback: number): number {
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function toNumber(value: string | number | null | undefined): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

async function queryTrafficMetrics(): Promise<TrafficMetrics> {
  try {
    const pool = getPgPool();
    const result = await pool.query<{
      analytics_15m: string;
      analytics_1h: string;
      analytics_24h: string;
      leads_24h: string;
      listings_24h: string;
    }>(
      `SELECT
         COUNT(*) FILTER (WHERE event_timestamp >= NOW() - INTERVAL '15 minutes')::text AS analytics_15m,
         COUNT(*) FILTER (WHERE event_timestamp >= NOW() - INTERVAL '1 hour')::text AS analytics_1h,
         COUNT(*) FILTER (WHERE event_timestamp >= NOW() - INTERVAL '24 hours')::text AS analytics_24h,
         COUNT(*) FILTER (WHERE event_name = 'lead_created' AND event_timestamp >= NOW() - INTERVAL '24 hours')::text AS leads_24h,
         COUNT(*) FILTER (
           WHERE event_name IN ('listing_created', 'listing_published')
             AND event_timestamp >= NOW() - INTERVAL '24 hours'
         )::text AS listings_24h
       FROM analytics_events`
    );
    const row = result.rows[0];
    return {
      analytics15m: toNumber(row?.analytics_15m),
      analytics1h: toNumber(row?.analytics_1h),
      analytics24h: toNumber(row?.analytics_24h),
      leads24h: toNumber(row?.leads_24h),
      listings24h: toNumber(row?.listings_24h)
    };
  } catch {
    return {
      analytics15m: 0,
      analytics1h: 0,
      analytics24h: 0,
      leads24h: 0,
      listings24h: 0
    };
  }
}

async function queryProtectedApiMetrics(): Promise<ProtectedApiMetrics> {
  const currentMinute = Math.floor(Date.now() / 1000 / 60);
  const windowStart = currentMinute - 14;
  try {
    const pool = getPgPool();
    const result = await pool.query<{
      total_15m: string;
      distinct_keys_15m: string;
      oauth_15m: string;
      login_15m: string;
      bid_15m: string;
      payment_15m: string;
    }>(
      `SELECT
         COALESCE(SUM(count), 0)::text AS total_15m,
         COUNT(DISTINCT key)::text AS distinct_keys_15m,
         COALESCE(SUM(CASE WHEN key LIKE 'oauth_google_start:%' THEN count ELSE 0 END), 0)::text AS oauth_15m,
         COALESCE(SUM(CASE WHEN key LIKE 'login:%' THEN count ELSE 0 END), 0)::text AS login_15m,
         COALESCE(SUM(CASE WHEN key LIKE 'bid:%' OR key LIKE 'bid-preauth:%' THEN count ELSE 0 END), 0)::text AS bid_15m,
         COALESCE(SUM(CASE WHEN key LIKE 'payment:%' OR key LIKE 'payment-seller-bond:%' THEN count ELSE 0 END), 0)::text AS payment_15m
       FROM security_rate_limits
       WHERE window_minute >= $1`,
      [windowStart]
    );
    const row = result.rows[0];
    return {
      protectedRequests15m: toNumber(row?.total_15m),
      distinctKeys15m: toNumber(row?.distinct_keys_15m),
      oauth15m: toNumber(row?.oauth_15m),
      login15m: toNumber(row?.login_15m),
      bid15m: toNumber(row?.bid_15m),
      payment15m: toNumber(row?.payment_15m)
    };
  } catch {
    return {
      protectedRequests15m: 0,
      distinctKeys15m: 0,
      oauth15m: 0,
      login15m: 0,
      bid15m: 0,
      payment15m: 0
    };
  }
}

async function probeDatabaseHealth(): Promise<CapacitySnapshot["database"]> {
  const start = Date.now();
  try {
    const pool = getPgPool();
    await pool.query("SELECT 1");
    return {
      healthy: true,
      latencyMs: Date.now() - start,
      poolMax: toPositiveInt(process.env.PG_POOL_MAX, 10),
      rateLimitFailOpen: process.env.RATE_LIMIT_FAIL_OPEN === "true"
    };
  } catch {
    return {
      healthy: false,
      latencyMs: null,
      poolMax: toPositiveInt(process.env.PG_POOL_MAX, 10),
      rateLimitFailOpen: process.env.RATE_LIMIT_FAIL_OPEN === "true"
    };
  }
}

function buildAlerts(input: Omit<CapacitySnapshot, "alerts" | "recommendation" | "generatedAt">): CapacityAlert[] {
  const alerts: CapacityAlert[] = [];

  if (!input.database.healthy) {
    alerts.push({
      id: "db-down",
      severity: "critical",
      title: "Database əlçatan deyil",
      message: "Admin panel DB health probe zamanı cavab ala bilmədi. Auth, ödəniş və digər yazma axınları risk altındadır.",
      recommendation: "Neon/Vercel bağlantısını, quota və son deploy env-lərini dərhal yoxlayın."
    });
  } else if ((input.database.latencyMs ?? 0) >= 800) {
    alerts.push({
      id: "db-latency",
      severity: "warning",
      title: "Database cavabı yavaşıyır",
      message: `DB health probe ${input.database.latencyMs} ms çəkdi. Bu, pik yük və ya region/pool problemi göstərə bilər.`,
      recommendation: "Yavaş query-ləri, region yerləşimini və pool limitlərini yoxlayın."
    });
  }

  if (!input.auction.connected) {
    alerts.push({
      id: "auction-disconnected",
      severity: "critical",
      title: "Auction API qoşulu deyil",
      message: "Ayrı auction service telemetriyası əlçatan deyil. Hot lot yükündə web fallback risklidir.",
      recommendation: "AUCTION_API_BASE_URL, internal secret və service deploy statusunu yoxlayın."
    });
  } else if (!input.auction.healthOk) {
    alerts.push({
      id: "auction-degraded",
      severity: "warning",
      title: "Auction service degraded görünür",
      message: "Auction API əlaqəlidir, amma health endpoint tam healthy qaytarmır.",
      recommendation: "Auction service logs, DB bağlantısı və Redis statusunu yoxlayın."
    });
  }

  if (input.auction.lockWaitAvgMs >= 250) {
    alerts.push({
      id: "lockwait-critical",
      severity: "critical",
      title: "Bid lock wait çox yüksəkdir",
      message: `Orta lock wait ${input.auction.lockWaitAvgMs} ms-dir. Hot lot contention artıb.`,
      recommendation: "Bid path optimizasiyası edin və Neon Scale hazırlığını başlayın."
    });
  } else if (input.auction.lockWaitAvgMs >= 100) {
    alerts.push({
      id: "lockwait-warning",
      severity: "warning",
      title: "Bid lock wait yüksəlir",
      message: `Orta lock wait ${input.auction.lockWaitAvgMs} ms-dir. Pik auksion vaxtı əlavə tuning lazım ola bilər.`,
      recommendation: "Redis co-location, query plan və bid path latency-ni yoxlayın."
    });
  }

  if (input.auction.viewerCount >= 120) {
    alerts.push({
      id: "viewer-burst",
      severity: "warning",
      title: "Canlı auksion izləyici sayı yüksəkdir",
      message: `Viewer count ${input.auction.viewerCount}-ə çatıb. Bu hot lot burst siqnalıdır.`,
      recommendation: "Auction API və Redis resurslarını izləyin, bid load test-i təkrarlayın."
    });
  }

  if (input.protectedApi.protectedRequests15m >= 3000) {
    alerts.push({
      id: "protected-pressure",
      severity: "warning",
      title: "Qorunan API təzyiqi yüksəlib",
      message: `Son 15 dəqiqədə ${input.protectedApi.protectedRequests15m} qorunan API sayğacı artımı qeydə alınıb.`,
      recommendation: "Login, OAuth, bid və payment axınlarında anomaliya və abuse təzyiqini yoxlayın."
    });
  }

  if (input.traffic.analytics24h >= 5000 || input.traffic.analytics1h >= 800) {
    alerts.push({
      id: "traffic-growth",
      severity: "info",
      title: "Trafik proxy-si növbəti mərhələyə yaxınlaşır",
      message: `Analytics event proxy-si son 24 saatda ${input.traffic.analytics24h}, son 1 saatda ${input.traffic.analytics1h} qeydə çatıb.`,
      recommendation: "Neon Launch ilə davam edin, amma next-stage load test və Scale hazırlığını planlaşdırın."
    });
  }

  return alerts;
}

function buildRecommendation(alerts: CapacityAlert[]): CapacitySnapshot["recommendation"] {
  const criticalCount = alerts.filter((item) => item.severity === "critical").length;
  const warningCount = alerts.filter((item) => item.severity === "warning").length;

  if (criticalCount > 0) {
    return {
      status: "critical",
      label: "Təcili müdaxilə",
      detail: "Kritik siqnallar var. İnfra və DB limitlərini dərhal yoxlayın; Scale və ya əlavə tuning gecikdirilməməlidir."
    };
  }
  if (warningCount >= 2) {
    return {
      status: "prepare_scale",
      label: "Növbəti mərhələyə hazırlaş",
      detail: "Launch hələ işləyir, amma yük siqnalları artır. Pool tuning, load test və Scale hazırlığı başlanmalıdır."
    };
  }
  if (warningCount === 1 || alerts.some((item) => item.severity === "info")) {
    return {
      status: "tune_soon",
      label: "İzləmə və tuning et",
      detail: "Sistem sabitdir, amma böyümə siqnalları görünür. Launch qalır, lakin növbəti ölçü mərhələsi üçün hazırlıq edin."
    };
  }
  return {
    status: "launch_ok",
    label: "Launch kifayətdir",
    detail: "Hazırkı tətbiq siqnalları Neon Launch və mövcud pool ayarları ilə davam etməyin normal olduğunu göstərir."
  };
}

export async function getCapacitySnapshot(): Promise<CapacitySnapshot> {
  const [overview, database, traffic, protectedApi, auctionTelemetry] = await Promise.all([
    getAdminOverview(),
    probeDatabaseHealth(),
    queryTrafficMetrics(),
    queryProtectedApiMetrics(),
    getAuctionServiceTelemetry().catch(() => ({ connected: false, healthOk: false }))
  ]);

  const snapshotBase = {
    overview,
    database,
    traffic,
    protectedApi,
    auction: {
      connected: Boolean(auctionTelemetry.connected),
      healthOk: Boolean(auctionTelemetry.healthOk),
      acceptedBids: auctionTelemetry.metrics?.bids?.accepted ?? 0,
      rejectedBids: auctionTelemetry.metrics?.bids?.rejected ?? 0,
      viewerCount: auctionTelemetry.metrics?.realtime?.viewerCount ?? 0,
      lockWaitAvgMs: Math.round(auctionTelemetry.metrics?.bids?.lockWait?.avg ?? 0),
      lockWaitMaxMs: Math.round(auctionTelemetry.metrics?.bids?.lockWait?.max ?? 0)
    }
  };

  const alerts = buildAlerts(snapshotBase);
  const recommendation = buildRecommendation(alerts);

  return {
    generatedAt: new Date().toISOString(),
    ...snapshotBase,
    alerts,
    recommendation
  };
}
