import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth";
import { getPgPool } from "@/lib/postgres";
import { ensureSeedData } from "@/server/bootstrap-seed";
import { getPartsStoreProfileEntitlements } from "@/server/business-plan-store";
import type { BusinessProfileEntitlements } from "@/server/business-plan-store";
import { normalizeMapUrl, sanitizeBusinessBranches } from "@/lib/business-branches";
import type { BusinessProfileBranch } from "@/lib/business-branches";

interface ProfileUpdateInput {
  fullName?: string;
  city?: string;
  bio?: string;
  avatarUrl?: string;
  storeName?: string;
  storeLogoUrl?: string;
  storeCoverUrl?: string;
  storeDescription?: string;
  storeWhatsappPhone?: string;
  storeWebsiteUrl?: string;
  storeAddress?: string;
  storeMapUrl?: string;
  storeBranches?: BusinessProfileBranch[];
  storeWorkingHours?: string;
  showStoreWhatsapp?: boolean;
  showStoreWebsite?: boolean;
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

function applyStoreEntitlements(
  body: ProfileUpdateInput,
  entitlements: BusinessProfileEntitlements
): ProfileUpdateInput {
  const next = { ...body };
  if (!entitlements.canUseLogo && "storeLogoUrl" in next) delete next.storeLogoUrl;
  if (!entitlements.canUseCover && "storeCoverUrl" in next) delete next.storeCoverUrl;
  if (!entitlements.canUseDescription && "storeDescription" in next) delete next.storeDescription;
  if (!entitlements.canUseWhatsapp) {
    delete next.storeWhatsappPhone;
    delete next.showStoreWhatsapp;
  }
  if (!entitlements.canUseWebsite) {
    delete next.storeWebsiteUrl;
    delete next.showStoreWebsite;
  }
  if (!entitlements.canUseAddress) delete next.storeAddress;
  if (!entitlements.canUseWorkingHours) delete next.storeWorkingHours;
  return next;
}

export async function PUT(req: Request) {
  const user = await getServerSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Daxil olun." }, { status: 401 });
  }

  const rawBody = (await req.json().catch(() => ({}))) as ProfileUpdateInput;
  const entitlements = await getPartsStoreProfileEntitlements(user.id);
  const body = applyStoreEntitlements(rawBody, entitlements);

  const fullName = typeof body.fullName === "string" ? body.fullName.trim().slice(0, 80) : undefined;
  const city = typeof body.city === "string" ? body.city.trim().slice(0, 60) : undefined;
  const bio = typeof body.bio === "string" ? body.bio.trim().slice(0, 300) : undefined;
  const storeName = typeof body.storeName === "string" ? body.storeName.trim().slice(0, 80) : undefined;
  const storeDescription = typeof body.storeDescription === "string" ? body.storeDescription.trim().slice(0, 500) : undefined;
  const storeWhatsappPhone = typeof body.storeWhatsappPhone === "string" ? body.storeWhatsappPhone.trim().slice(0, 30) : undefined;
  const storeWebsiteUrl = typeof body.storeWebsiteUrl === "string" ? body.storeWebsiteUrl.trim().slice(0, 200) : undefined;
  const storeAddress = typeof body.storeAddress === "string" ? body.storeAddress.trim().slice(0, 200) : undefined;
  const storeMapUrl = typeof body.storeMapUrl === "string" ? normalizeMapUrl(body.storeMapUrl) : undefined;
  const storeBranches =
    body.storeBranches !== undefined
      ? JSON.stringify(sanitizeBusinessBranches(body.storeBranches, city))
      : undefined;
  const storeWorkingHours = typeof body.storeWorkingHours === "string" ? body.storeWorkingHours.trim().slice(0, 120) : undefined;
  const showStoreWhatsapp = typeof body.showStoreWhatsapp === "boolean" ? body.showStoreWhatsapp : undefined;
  const showStoreWebsite = typeof body.showStoreWebsite === "boolean" ? body.showStoreWebsite : undefined;

  const avatarUrl =
    typeof body.avatarUrl === "string"
      ? body.avatarUrl.trim() === "" ? null : isValidUrl(body.avatarUrl.trim()) ? body.avatarUrl.trim() : undefined
      : undefined;

  const storeLogoUrl =
    typeof body.storeLogoUrl === "string"
      ? body.storeLogoUrl.trim() === "" ? null : isValidUrl(body.storeLogoUrl.trim()) ? body.storeLogoUrl.trim() : undefined
      : undefined;

  const storeCoverUrl =
    typeof body.storeCoverUrl === "string"
      ? body.storeCoverUrl.trim() === "" ? null : isValidUrl(body.storeCoverUrl.trim()) ? body.storeCoverUrl.trim() : undefined
      : undefined;

  try {
    await ensureSeedData();
    const pool = getPgPool();

    await pool.query(
      `INSERT INTO user_profiles (
         user_id, full_name, city, bio, avatar_url, store_name, store_logo_url, store_cover_url,
         store_description, store_whatsapp_phone, store_website_url, store_address, store_map_url, store_branches, store_working_hours,
         show_store_whatsapp, show_store_website, updated_at
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14::jsonb,$15,$16,$17,NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         full_name = COALESCE($2, user_profiles.full_name),
         city = COALESCE($3, user_profiles.city),
         bio = COALESCE($4, user_profiles.bio),
         avatar_url = CASE WHEN $5::text IS NOT NULL THEN $5 ELSE user_profiles.avatar_url END,
         store_name = COALESCE($6, user_profiles.store_name),
         store_logo_url = CASE WHEN $7::text IS NOT NULL THEN $7 ELSE user_profiles.store_logo_url END,
         store_cover_url = CASE WHEN $8::text IS NOT NULL THEN $8 ELSE user_profiles.store_cover_url END,
         store_description = COALESCE($9, user_profiles.store_description),
         store_whatsapp_phone = COALESCE($10, user_profiles.store_whatsapp_phone),
         store_website_url = COALESCE($11, user_profiles.store_website_url),
         store_address = COALESCE($12, user_profiles.store_address),
         store_map_url = COALESCE($13, user_profiles.store_map_url),
         store_branches = COALESCE($14::jsonb, user_profiles.store_branches),
         store_working_hours = COALESCE($15, user_profiles.store_working_hours),
         show_store_whatsapp = COALESCE($16, user_profiles.show_store_whatsapp),
         show_store_website = COALESCE($17, user_profiles.show_store_website),
         updated_at = NOW()`,
      [
        user.id,
        fullName ?? null,
        city ?? null,
        bio ?? null,
        avatarUrl ?? null,
        storeName ?? null,
        storeLogoUrl ?? null,
        storeCoverUrl ?? null,
        storeDescription ?? null,
        storeWhatsappPhone ?? null,
        storeWebsiteUrl ?? null,
        storeAddress ?? null,
        storeMapUrl ?? null,
        storeBranches ?? null,
        storeWorkingHours ?? null,
        showStoreWhatsapp ?? null,
        showStoreWebsite ?? null
      ]
    );

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Profil yenilənərkən xəta baş verdi." }, { status: 500 });
  }
}
