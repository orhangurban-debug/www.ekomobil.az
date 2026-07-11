import { getPgPool } from "@/lib/postgres";
import { getDealerPlanById, shouldArchiveDealerListings, type DealerPlanId } from "@/lib/dealer-plans";
import { getPartsStorePlanById, shouldArchivePartsListings, type PartsStorePlanId } from "@/lib/parts-store-plans";
import type { BusinessType } from "@/server/business-plan-store";

export async function archiveListingsPastBusinessGracePeriod(): Promise<{
  dealerArchived: number;
  partsArchived: number;
}> {
  const pool = getPgPool();
  const subs = await pool.query<{
    owner_user_id: string;
    business_type: BusinessType;
    plan_id: string;
    expires_at: Date;
    status: string;
  }>(
    `SELECT owner_user_id, business_type, plan_id, expires_at, status
     FROM business_plan_subscriptions
     WHERE expires_at IS NOT NULL
       AND (status = 'expired' OR (status = 'active' AND expires_at < NOW()))`
  );

  let dealerArchived = 0;
  let partsArchived = 0;

  for (const sub of subs.rows) {
    if (sub.business_type === "dealer") {
      const plan = getDealerPlanById(sub.plan_id as DealerPlanId);
      if (!plan || !shouldArchiveDealerListings(sub.expires_at, plan)) continue;

      const result = await pool.query(
        `UPDATE listings l
         SET status = 'archived', updated_at = NOW()
         FROM dealer_profiles dp
         WHERE l.dealer_profile_id = dp.id
           AND dp.owner_user_id = $1
           AND l.status = 'active'
           AND COALESCE(l.listing_kind, 'vehicle') = 'vehicle'`,
        [sub.owner_user_id]
      );
      dealerArchived += result.rowCount ?? 0;
      continue;
    }

    const plan = getPartsStorePlanById(sub.plan_id as PartsStorePlanId);
    if (!plan || !shouldArchivePartsListings(sub.expires_at, plan)) continue;

    const result = await pool.query(
      `UPDATE listings
       SET status = 'archived', updated_at = NOW()
       WHERE owner_user_id = $1
         AND listing_kind = 'part'
         AND status = 'active'`,
      [sub.owner_user_id]
    );
    partsArchived += result.rowCount ?? 0;
  }

  return { dealerArchived, partsArchived };
}
