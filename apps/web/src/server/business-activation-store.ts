import { randomUUID } from "node:crypto";
import { getPgPool } from "@/lib/postgres";
import { branchesFromLegacyCities } from "@/lib/business-branches";
import { createDealerProfile } from "@/server/dealer-store";
import { upsertBusinessPlanSubscription } from "@/server/business-plan-store";
import {
  approveServiceListingsBySupportRequestId,
  ensureServiceListingForSupportRequest
} from "@/server/service-listing-store";
import { updateAdminUserRole } from "@/server/admin-store";
import { syncListingTrustForDealerOwner } from "@/server/listing-trust-sync";

const BUSINESS_REQUEST_TYPES = new Set([
  "dealer_apply",
  "partnership",
  "parts_apply",
  "inspection_partner"
]);

export interface BusinessActivationResult {
  ok: boolean;
  activated: boolean;
  error?: string;
}

function trialWindow(): { startsAt: string; expiresAt: string; trialGrantedAt: string } {
  const now = new Date();
  const trialEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  return {
    startsAt: now.toISOString(),
    expiresAt: trialEnd.toISOString(),
    trialGrantedAt: now.toISOString()
  };
}

async function ensureDealerTrialSubscription(ownerUserId: string): Promise<boolean> {
  const pool = getPgPool();
  const existingSub = await pool.query<{ id: string }>(
    `SELECT id FROM business_plan_subscriptions
     WHERE owner_user_id = $1 AND business_type = 'dealer'
       AND status = 'active' AND (expires_at IS NULL OR expires_at >= NOW())
     LIMIT 1`,
    [ownerUserId]
  );
  if (existingSub.rows[0]) return false;

  const trial = trialWindow();
  await upsertBusinessPlanSubscription({
    ownerUserId,
    businessType: "dealer",
    planId: "baza",
    status: "active",
    startsAt: trial.startsAt,
    expiresAt: trial.expiresAt,
    trialGrantedAt: trial.trialGrantedAt
  });
  return true;
}

async function activateDealerRequest(input: {
  ownerUserId: string;
  metadata: Record<string, unknown> | null;
}): Promise<BusinessActivationResult> {
  const pool = getPgPool();
  const app = input.metadata?.dealerApplication as Record<string, unknown> | undefined;
  const businessName = (app?.businessName as string | undefined)?.trim() || "Dealer";
  const city = (app?.city as string | undefined)?.trim() || "Bakı";
  const voen = (app?.voen as string | undefined)?.trim() || null;
  const websiteUrl = (app?.website as string | undefined)?.trim() || null;
  const rawDescription = (app?.description as string | undefined)?.trim() || null;
  const logoUrl = (app?.logoUrl as string | undefined)?.trim() || null;
  const branchCities = Array.isArray(app?.branchCities)
    ? (app.branchCities as unknown[]).filter((item): item is string => typeof item === "string")
    : [];
  const branches = JSON.stringify(branchesFromLegacyCities(branchCities, city));
  const description = rawDescription;

  const existingProfile = await pool.query<{ id: string }>(
    `SELECT id FROM dealer_profiles WHERE owner_user_id = $1 LIMIT 1`,
    [input.ownerUserId]
  );

  let activated = false;
  if (!existingProfile.rows[0]) {
    await createDealerProfile({
      id: randomUUID(),
      ownerUserId: input.ownerUserId,
      name: businessName,
      city,
      voen,
      websiteUrl,
      description,
      logoUrl
    });
    await pool.query(
      `UPDATE dealer_profiles SET branches = $2::jsonb WHERE owner_user_id = $1`,
      [input.ownerUserId, branches]
    );
    activated = true;
  } else {
    await pool.query(
      `
        UPDATE dealer_profiles
        SET
          name = COALESCE($2, name),
          city = COALESCE($3, city),
          voen = COALESCE($4, voen),
          website_url = COALESCE($5, website_url),
          description = COALESCE($6, description),
          logo_url = COALESCE($7, logo_url),
          branches = COALESCE($8::jsonb, branches),
          verified = TRUE
        WHERE owner_user_id = $1
      `,
      [input.ownerUserId, businessName, city, voen, websiteUrl, description, logoUrl, branches]
    );
  }

  await updateAdminUserRole(input.ownerUserId, "dealer");
  if (await ensureDealerTrialSubscription(input.ownerUserId)) activated = true;
  await pool.query(`UPDATE dealer_profiles SET verified = TRUE WHERE owner_user_id = $1`, [input.ownerUserId]);
  await syncListingTrustForDealerOwner(input.ownerUserId);

  return { ok: true, activated };
}

async function activatePartsStoreRequest(input: {
  ownerUserId: string;
  metadata: Record<string, unknown> | null;
}): Promise<BusinessActivationResult> {
  const pool = getPgPool();
  const app = input.metadata?.dealerApplication as Record<string, unknown> | undefined;
  const businessName = (app?.businessName as string | undefined)?.trim() || null;
  const city = (app?.city as string | undefined)?.trim() || null;
  const rawDescription = (app?.description as string | undefined)?.trim() || null;
  const logoUrl = (app?.logoUrl as string | undefined)?.trim() || null;
  const branchCities = Array.isArray(app?.branchCities)
    ? (app.branchCities as unknown[]).filter((item): item is string => typeof item === "string")
    : [];
  const storeBranches = JSON.stringify(branchesFromLegacyCities(branchCities, city ?? undefined));
  const storeDescription = rawDescription;

  const existingSub = await pool.query<{ id: string }>(
    `SELECT id FROM business_plan_subscriptions
     WHERE owner_user_id = $1 AND business_type = 'parts_store'
       AND status = 'active' AND (expires_at IS NULL OR expires_at >= NOW())
     LIMIT 1`,
    [input.ownerUserId]
  );

  let activated = false;
  if (!existingSub.rows[0]) {
    const trial = trialWindow();
    await upsertBusinessPlanSubscription({
      ownerUserId: input.ownerUserId,
      businessType: "parts_store",
      planId: "baza",
      status: "active",
      startsAt: trial.startsAt,
      expiresAt: trial.expiresAt,
      trialGrantedAt: trial.trialGrantedAt
    });
    activated = true;
  }

  if (businessName || logoUrl || storeDescription || city) {
    await pool.query(
      `INSERT INTO user_profiles (user_id, store_name, store_logo_url, store_description, store_branches, city, updated_at)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         store_name = COALESCE(EXCLUDED.store_name, user_profiles.store_name),
         store_logo_url = CASE WHEN EXCLUDED.store_logo_url IS NOT NULL THEN EXCLUDED.store_logo_url ELSE user_profiles.store_logo_url END,
         store_description = COALESCE(EXCLUDED.store_description, user_profiles.store_description),
         store_branches = COALESCE(EXCLUDED.store_branches, user_profiles.store_branches),
         city = COALESCE(EXCLUDED.city, user_profiles.city),
         updated_at = NOW()`,
      [input.ownerUserId, businessName, logoUrl, storeDescription, storeBranches, city]
    );
  }

  return { ok: true, activated };
}

async function activateServicePartnerRequest(requestId: string): Promise<BusinessActivationResult> {
  const ensured = await ensureServiceListingForSupportRequest(requestId);
  if (!ensured.listingId) {
    return {
      ok: false,
      activated: false,
      error:
        "Servis profili yaradıla bilmədi. Müraciət mətnində və ya metadata-da kifayət qədər məlumat yoxdur."
    };
  }

  const approval = await approveServiceListingsBySupportRequestId(requestId);
  return {
    ok: true,
    activated: approval.approvedCount > 0 || ensured.created
  };
}

export function isBusinessSupportRequestType(requestType: string): boolean {
  return BUSINESS_REQUEST_TYPES.has(requestType);
}

export async function activateBusinessSupportRequest(requestId: string): Promise<BusinessActivationResult> {
  const pool = getPgPool();
  const reqRow = await pool.query<{
    request_type: string;
    reporter_user_id: string | null;
    metadata: Record<string, unknown> | null;
  }>(
    `SELECT request_type, reporter_user_id, metadata FROM support_requests WHERE id = $1 LIMIT 1`,
    [requestId]
  );
  const req = reqRow.rows[0];
  if (!req) {
    return { ok: false, activated: false, error: "Müraciət tapılmadı." };
  }

  if (!isBusinessSupportRequestType(req.request_type)) {
    return { ok: true, activated: false };
  }

  if (!req.reporter_user_id && req.request_type !== "inspection_partner") {
    return {
      ok: false,
      activated: false,
      error: "Müraciətçi hesabı tapılmadı. İstifadəçi login olmadan biznes hesabı aktivləşdirilə bilməz."
    };
  }

  try {
    if (req.request_type === "dealer_apply" || req.request_type === "partnership") {
      return await activateDealerRequest({
        ownerUserId: req.reporter_user_id!,
        metadata: req.metadata
      });
    }
    if (req.request_type === "parts_apply") {
      return await activatePartsStoreRequest({
        ownerUserId: req.reporter_user_id!,
        metadata: req.metadata
      });
    }
    if (req.request_type === "inspection_partner") {
      return await activateServicePartnerRequest(requestId);
    }
    return { ok: true, activated: false };
  } catch (error) {
    console.error("[business-activation] failed:", error);
    return {
      ok: false,
      activated: false,
      error: "Biznes hesabı aktivləşdirilərkən xəta baş verdi."
    };
  }
}
