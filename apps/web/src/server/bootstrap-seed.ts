import { randomUUID, scryptSync } from "node:crypto";
import { getPgPool } from "@/lib/postgres";
import { demoLeads, demoListingsDetailed } from "@/lib/demo-marketplace";

let seeded = false;

function hashPassword(password: string): string {
  const salt = "ekomobil-static-salt";
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

export async function ensureSeedData(): Promise<void> {
  if (seeded) return;

  const pool = getPgPool();
  const client = await pool.connect();
  try {
    const listingCount = await client.query<{ count: string }>("SELECT COUNT(*)::text as count FROM listings");
    if (Number(listingCount.rows[0]?.count ?? "0") > 0) {
      seeded = true;
      return;
    }

    await client.query("BEGIN");

    await client.query(
      `
        INSERT INTO users (id, email, password_hash, role, email_verified)
        VALUES
          ('11111111-1111-1111-1111-111111111111', 'admin@ekomobil.az', $1, 'admin', true),
          ('22222222-2222-2222-2222-222222222222', 'support@ekomobil.az', $2, 'support', true),
          ('33333333-3333-3333-3333-333333333333', 'dealer@ekomobil.az', $3, 'dealer', true),
          ('44444444-4444-4444-4444-444444444444', 'viewer@ekomobil.az', $4, 'viewer', true)
        ON CONFLICT (email) DO NOTHING
      `,
      [
        hashPassword("Admin123!"),
        hashPassword("Support123!"),
        hashPassword("Dealer123!"),
        hashPassword("Viewer123!")
      ]
    );

    await client.query(
      `
        INSERT INTO user_profiles (user_id, full_name, city)
        VALUES
          ('11111111-1111-1111-1111-111111111111', 'Admin User', 'Bakı'),
          ('22222222-2222-2222-2222-222222222222', 'Support User', 'Bakı'),
          ('33333333-3333-3333-3333-333333333333', 'Premium Dealer', 'Bakı'),
          ('44444444-4444-4444-4444-444444444444', 'Viewer User', 'Bakı')
        ON CONFLICT (user_id) DO NOTHING
      `
    );

    await client.query(
      `
        INSERT INTO dealer_profiles (id, owner_user_id, name, city, verified, response_sla_minutes)
        VALUES ('dealer-1', '33333333-3333-3333-3333-333333333333', 'Eko Premium Motors', 'Bakı', true, 15)
        ON CONFLICT (id) DO NOTHING
      `
    );

    for (const listing of demoListingsDetailed) {
      await client.query(
        `
          INSERT INTO listings (
            id, owner_user_id, dealer_profile_id, title, description, make, model, year, city, price_azn,
            mileage_km, fuel_type, transmission, vin, status, seller_type, created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
          ON CONFLICT (id) DO NOTHING
        `,
        [
          listing.id,
          listing.sellerType === "dealer" ? "33333333-3333-3333-3333-333333333333" : "11111111-1111-1111-1111-111111111111",
          listing.dealerProfileId ?? null,
          listing.title,
          listing.description,
          listing.make,
          listing.model,
          listing.year,
          listing.city,
          listing.priceAzn,
          listing.mileageKm,
          listing.fuelType,
          listing.transmission,
          listing.vin,
          listing.status,
          listing.sellerType,
          listing.createdAt,
          listing.updatedAt
        ]
      );

      await client.query(
        `
          INSERT INTO listing_trust_signals (
            listing_id, trust_score, vin_verified, seller_verified, media_complete, mileage_flag_severity,
            mileage_flag_message, service_history_summary, risk_summary, last_verified_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
          ON CONFLICT (listing_id) DO NOTHING
        `,
        [
          listing.id,
          listing.trustScore,
          listing.vinVerified,
          listing.sellerVerified,
          listing.mediaComplete,
          listing.mileageFlagSeverity ?? null,
          listing.mileageFlagMessage ?? null,
          listing.serviceHistorySummary ?? null,
          listing.riskSummary ?? null,
          listing.lastVerifiedAt ?? null
        ]
      );

      for (const record of listing.serviceRecords) {
        await client.query(
          `
            INSERT INTO listing_service_records (id, listing_id, source_type, service_date, mileage_km, summary)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (id) DO NOTHING
          `,
          [record.id, listing.id, record.sourceType, record.serviceDate, record.mileageKm, record.summary]
        );
      }
    }

    for (const lead of demoLeads) {
      await client.query(
        `
          INSERT INTO leads (
            id, listing_id, dealer_profile_id, customer_name, customer_phone, note, stage, source, response_time_minutes, created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (id) DO NOTHING
        `,
        [
          lead.id,
          lead.listingId,
          lead.dealerProfileId ?? null,
          lead.customerName,
          lead.customerPhone ?? null,
          lead.note ?? null,
          lead.stage,
          lead.source,
          lead.responseTimeMinutes ?? null,
          lead.createdAt,
          lead.updatedAt
        ]
      );
    }

    await client.query("COMMIT");
    seeded = true;
  } catch {
    await client.query("ROLLBACK").catch(() => undefined);
  } finally {
    client.release();
  }
}

export function buildSavedSearchName(query: Record<string, unknown>): string {
  const parts = [query.city, query.make, query.minPrice && `${query.minPrice}+₼`, query.maxPrice && `${query.maxPrice}-₼`]
    .filter(Boolean)
    .map(String);
  return parts.length > 0 ? parts.join(" · ") : "Yeni axtarış";
}

export function createUuidLikeId(): string {
  return randomUUID();
}
