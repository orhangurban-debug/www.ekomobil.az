import type { MetadataRoute } from "next";
import { getPgPool } from "@/lib/postgres";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://ekomobil.az";

const STATIC_ROUTES: Array<{ path: string; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }> = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/listings", changeFrequency: "hourly", priority: 0.9 },
  { path: "/parts", changeFrequency: "hourly", priority: 0.85 },
  { path: "/auction", changeFrequency: "hourly", priority: 0.8 },
  { path: "/pricing", changeFrequency: "weekly", priority: 0.7 },
  { path: "/terms", changeFrequency: "monthly", priority: 0.5 },
  { path: "/privacy", changeFrequency: "monthly", priority: 0.5 },
  { path: "/rules", changeFrequency: "monthly", priority: 0.5 }
];

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const urls: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${APP_URL}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority
  }));

  try {
    const pool = getPgPool();

    const listings = await pool.query<{ id: string; updated_at: Date | string | null }>(
      `
        SELECT id, updated_at
        FROM listings
        WHERE status = 'active'
        ORDER BY updated_at DESC
        LIMIT 5000
      `
    );

    for (const row of listings.rows) {
      urls.push({
        url: `${APP_URL}/listings/${row.id}`,
        lastModified: row.updated_at ? new Date(row.updated_at) : now,
        changeFrequency: "daily",
        priority: 0.8
      });
    }

    const dealers = await pool.query<{ id: string; updated_at: Date | string | null }>(
      `
        SELECT id, updated_at
        FROM dealer_profiles
        ORDER BY updated_at DESC
        LIMIT 2000
      `
    );

    for (const row of dealers.rows) {
      urls.push({
        url: `${APP_URL}/dealers/${row.id}`,
        lastModified: row.updated_at ? new Date(row.updated_at) : now,
        changeFrequency: "weekly",
        priority: 0.6
      });
    }
  } catch {
    // Fall back to static URLs if database is temporarily unavailable.
  }

  return urls;
}
