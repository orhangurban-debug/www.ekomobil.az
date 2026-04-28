import { randomUUID } from "node:crypto";
import { ALL_BOOST_PACKAGES, type BoostType } from "@/lib/listing-boost-plans";
import { getPgPool } from "@/lib/postgres";

export interface ListingBoostActivationRecord {
  id: string;
  listingId: string;
  packageId: string;
  boostType: BoostType;
  startsAt: string;
  endsAt?: string;
  bumpsPerDay: number;
  createdAt: string;
}

interface ListingBoostActivationRow {
  id: string;
  listing_id: string;
  package_id: string;
  boost_type: string;
  starts_at: Date;
  ends_at: Date | null;
  bumps_per_day: number;
  created_at: Date;
}

function mapActivationRow(row: ListingBoostActivationRow): ListingBoostActivationRecord {
  return {
    id: row.id,
    listingId: row.listing_id,
    packageId: row.package_id,
    boostType: row.boost_type as BoostType,
    startsAt: row.starts_at.toISOString(),
    endsAt: row.ends_at?.toISOString(),
    bumpsPerDay: row.bumps_per_day,
    createdAt: row.created_at.toISOString()
  };
}

export async function ensureListingBoostTables(): Promise<void> {
  try {
    const pool = getPgPool();
    await pool.query(`
      CREATE TABLE IF NOT EXISTS listing_boost_activations (
        id             UUID PRIMARY KEY,
        listing_id     UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
        package_id     TEXT NOT NULL,
        boost_type     TEXT NOT NULL,
        starts_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        ends_at        TIMESTAMPTZ,
        bumps_per_day  INTEGER NOT NULL DEFAULT 0,
        created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS listing_boost_activations_listing_idx
        ON listing_boost_activations (listing_id);
      CREATE INDEX IF NOT EXISTS listing_boost_activations_active_idx
        ON listing_boost_activations (boost_type, starts_at, ends_at);
    `);
  } catch {
    // non-blocking safety net
  }
}

export function getBoostOrderSql(alias = "l"): string {
  return `CASE
    WHEN EXISTS (
      SELECT 1
      FROM listing_boost_activations lba
      WHERE lba.listing_id = ${alias}.id
        AND lba.boost_type = 'premium'
        AND lba.starts_at <= NOW()
        AND (lba.ends_at IS NULL OR lba.ends_at >= NOW())
    ) THEN 1
    WHEN EXISTS (
      SELECT 1
      FROM listing_boost_activations lba
      WHERE lba.listing_id = ${alias}.id
        AND lba.boost_type IN ('vip', 'premium')
        AND lba.starts_at <= NOW()
        AND (lba.ends_at IS NULL OR lba.ends_at >= NOW())
    ) THEN 2
    WHEN EXISTS (
      SELECT 1
      FROM listing_boost_activations lba
      WHERE lba.listing_id = ${alias}.id
        AND lba.boost_type = 'bump'
        AND lba.starts_at <= NOW()
        AND (lba.ends_at IS NULL OR lba.ends_at >= NOW())
    ) THEN 3
    ELSE 4
  END ASC`;
}

export function getBoostPackageById(packageId: string) {
  return ALL_BOOST_PACKAGES.find((item) => item.id === packageId);
}

export async function applyListingBoostPackage(input: {
  listingId: string;
  packageId: string;
}): Promise<{ ok: boolean; error?: string; activation?: ListingBoostActivationRecord }> {
  await ensureListingBoostTables();

  const pkg = getBoostPackageById(input.packageId);
  if (!pkg) {
    return { ok: false, error: "Boost paketi tapılmadı" };
  }

  try {
    const pool = getPgPool();

    const listingResult = await pool.query<{ id: string }>(
      `SELECT id FROM listings WHERE id = $1 LIMIT 1`,
      [input.listingId]
    );
    if (!listingResult.rows[0]) {
      return { ok: false, error: "Elan tapılmadı" };
    }

    // Immediate visibility bump for all boost purchases.
    await pool.query(
      `UPDATE listings
       SET created_at = NOW(),
           updated_at = NOW()
       WHERE id = $1`,
      [input.listingId]
    );

    if (pkg.durationDays === null) {
      // One-time bump package only refreshes ordering timestamp.
      return { ok: true };
    }

    const startsAt = new Date();
    const endsAt = new Date(startsAt);
    endsAt.setDate(endsAt.getDate() + pkg.durationDays);

    const result = await pool.query<ListingBoostActivationRow>(
      `INSERT INTO listing_boost_activations (
         id, listing_id, package_id, boost_type, starts_at, ends_at, bumps_per_day
       )
       VALUES ($1, $2, $3, $4, $5::timestamptz, $6::timestamptz, $7)
       RETURNING *`,
      [
        randomUUID(),
        input.listingId,
        pkg.id,
        pkg.type,
        startsAt.toISOString(),
        endsAt.toISOString(),
        pkg.bumpsPerDay
      ]
    );

    return { ok: true, activation: result.rows[0] ? mapActivationRow(result.rows[0]) : undefined };
  } catch {
    return { ok: false, error: "Boost tətbiq edilə bilmədi" };
  }
}
