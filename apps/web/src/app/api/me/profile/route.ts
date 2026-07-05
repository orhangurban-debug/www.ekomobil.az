import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth";
import { getPgPool } from "@/lib/postgres";
import { ensureSeedData } from "@/server/bootstrap-seed";

interface ProfileUpdateInput {
  fullName?: string;
  city?: string;
  bio?: string;
  avatarUrl?: string;
  storeName?: string;
  storeLogoUrl?: string;
  storeCoverUrl?: string;
  storeDescription?: string;
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function PUT(req: Request) {
  const user = await getServerSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Daxil olun." }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as ProfileUpdateInput;

  const fullName = typeof body.fullName === "string" ? body.fullName.trim().slice(0, 80) : undefined;
  const city = typeof body.city === "string" ? body.city.trim().slice(0, 60) : undefined;
  const bio = typeof body.bio === "string" ? body.bio.trim().slice(0, 300) : undefined;
  const storeName = typeof body.storeName === "string" ? body.storeName.trim().slice(0, 80) : undefined;
  const storeDescription = typeof body.storeDescription === "string" ? body.storeDescription.trim().slice(0, 500) : undefined;

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

    // Upsert user_profiles with all provided fields
    await pool.query(
      `INSERT INTO user_profiles (user_id, full_name, city, bio, avatar_url, store_name, store_logo_url, store_cover_url, store_description, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         full_name         = COALESCE($2, user_profiles.full_name),
         city              = COALESCE($3, user_profiles.city),
         bio               = COALESCE($4, user_profiles.bio),
         avatar_url        = CASE WHEN $5::text IS NOT NULL THEN $5 ELSE user_profiles.avatar_url END,
         store_name        = COALESCE($6, user_profiles.store_name),
         store_logo_url    = CASE WHEN $7::text IS NOT NULL THEN $7 ELSE user_profiles.store_logo_url END,
         store_cover_url   = CASE WHEN $8::text IS NOT NULL THEN $8 ELSE user_profiles.store_cover_url END,
         store_description = COALESCE($9, user_profiles.store_description),
         updated_at        = NOW()`,
      [user.id, fullName ?? null, city ?? null, bio ?? null, avatarUrl ?? null,
       storeName ?? null, storeLogoUrl ?? null, storeCoverUrl ?? null, storeDescription ?? null]
    );

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Profil yenilənərkən xəta baş verdi." }, { status: 500 });
  }
}
