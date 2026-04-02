import { randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { getPgPool } from "@/lib/postgres";
import { ensureSeedData, createUuidLikeId } from "@/server/bootstrap-seed";

export interface UserRecord {
  id: string;
  email: string;
  role: "admin" | "support" | "dealer" | "viewer";
  emailVerified: boolean;
  phone?: string;
}

export interface UserProfileRecord {
  userId: string;
  fullName?: string;
  city?: string;
  avatarUrl?: string;
  bio?: string;
}

export interface GoogleOAuthIdentity {
  providerUserId: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
}

function mapUser(row: {
  id: string;
  email: string;
  role: string;
  email_verified: boolean;
  phone: string | null;
}): UserRecord {
  return {
    id: row.id,
    email: row.email,
    role: row.role as UserRecord["role"],
    emailVerified: row.email_verified,
    phone: row.phone ?? undefined
  };
}

export function hashPassword(password: string): string {
  const salt = randomUUID();
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hashed] = stored.split(":");
  if (!salt || !hashed) return false;
  const candidate = scryptSync(password, salt, 64).toString("hex");
  return timingSafeEqual(Buffer.from(candidate, "hex"), Buffer.from(hashed, "hex"));
}

export async function authenticateUserFromStore(email: string, password: string): Promise<UserRecord | null> {
  try {
    await ensureSeedData();
    const pool = getPgPool();
    const result = await pool.query<{
      id: string;
      email: string;
      role: string;
      email_verified: boolean;
      phone: string | null;
      password_hash: string;
    }>(
      `
        SELECT id, email, role, email_verified, phone, password_hash
        FROM users
        WHERE email = $1
        LIMIT 1
      `,
      [email]
    );
    const row = result.rows[0];
    if (!row || !verifyPassword(password, row.password_hash)) return null;
    return mapUser(row);
  } catch {
    return null;
  }
}

export async function createUserAccount(input: {
  email: string;
  password: string;
  role?: UserRecord["role"];
  fullName?: string;
  city?: string;
  phone?: string;
}): Promise<UserRecord> {
  await ensureSeedData();
  const pool = getPgPool();
  const client = await pool.connect();
  const userId = createUuidLikeId();

  try {
    await client.query("BEGIN");
    const created = await client.query<{
      id: string;
      email: string;
      role: string;
      email_verified: boolean;
      phone: string | null;
    }>(
      `
        INSERT INTO users (id, email, password_hash, role, email_verified, phone)
        VALUES ($1, $2, $3, $4, false, $5)
        RETURNING id, email, role, email_verified, phone
      `,
      [userId, input.email, hashPassword(input.password), input.role ?? "viewer", input.phone ?? null]
    );

    await client.query(
      `
        INSERT INTO user_profiles (user_id, full_name, city)
        VALUES ($1, $2, $3)
      `,
      [userId, input.fullName ?? null, input.city ?? null]
    );

    await client.query("COMMIT");
    return mapUser(created.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function upsertUserFromGoogle(input: GoogleOAuthIdentity): Promise<UserRecord> {
  await ensureSeedData();
  const pool = getPgPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const linked = await client.query<{
      id: string;
      email: string;
      role: string;
      email_verified: boolean;
      phone: string | null;
    }>(
      `
        SELECT u.id, u.email, u.role, u.email_verified, u.phone
        FROM user_oauth_accounts oa
        JOIN users u ON u.id = oa.user_id
        WHERE oa.provider = 'google' AND oa.provider_user_id = $1
        LIMIT 1
      `,
      [input.providerUserId]
    );
    if (linked.rows[0]) {
      await client.query(
        `UPDATE user_oauth_accounts SET last_login_at = NOW(), email_at_provider = $2
         WHERE provider = 'google' AND provider_user_id = $1`,
        [input.providerUserId, input.email]
      );
      await client.query(
        `UPDATE users SET email_verified = true WHERE id = $1`,
        [linked.rows[0].id]
      );
      await client.query("COMMIT");
      return mapUser({ ...linked.rows[0], email_verified: true });
    }

    const existing = await client.query<{
      id: string;
      email: string;
      role: string;
      email_verified: boolean;
      phone: string | null;
    }>(
      `SELECT id, email, role, email_verified, phone FROM users WHERE email = $1 LIMIT 1`,
      [input.email]
    );

    let user = existing.rows[0];
    if (!user) {
      const userId = createUuidLikeId();
      const randomPassword = randomUUID();
      const created = await client.query<{
        id: string;
        email: string;
        role: string;
        email_verified: boolean;
        phone: string | null;
      }>(
        `
          INSERT INTO users (id, email, password_hash, role, email_verified, phone)
          VALUES ($1, $2, $3, 'viewer', true, NULL)
          RETURNING id, email, role, email_verified, phone
        `,
        [userId, input.email, hashPassword(randomPassword)]
      );
      user = created.rows[0];
      await client.query(
        `
          INSERT INTO user_profiles (user_id, full_name, avatar_url)
          VALUES ($1, $2, $3)
          ON CONFLICT (user_id) DO UPDATE
          SET full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
              avatar_url = COALESCE(EXCLUDED.avatar_url, user_profiles.avatar_url),
              updated_at = NOW()
        `,
        [userId, input.fullName ?? null, input.avatarUrl ?? null]
      );
    } else {
      await client.query(`UPDATE users SET email_verified = true WHERE id = $1`, [user.id]);
      await client.query(
        `
          INSERT INTO user_profiles (user_id, full_name, avatar_url)
          VALUES ($1, $2, $3)
          ON CONFLICT (user_id) DO UPDATE
          SET full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
              avatar_url = COALESCE(EXCLUDED.avatar_url, user_profiles.avatar_url),
              updated_at = NOW()
        `,
        [user.id, input.fullName ?? null, input.avatarUrl ?? null]
      );
    }

    await client.query(
      `
        INSERT INTO user_oauth_accounts (id, user_id, provider, provider_user_id, email_at_provider)
        VALUES ($1, $2, 'google', $3, $4)
        ON CONFLICT (provider, provider_user_id) DO UPDATE
        SET user_id = EXCLUDED.user_id,
            email_at_provider = EXCLUDED.email_at_provider,
            last_login_at = NOW()
      `,
      [createUuidLikeId(), user.id, input.providerUserId, input.email]
    );

    await client.query("COMMIT");
    return mapUser({ ...user, email_verified: true });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getUserProfile(userId: string): Promise<(UserRecord & UserProfileRecord) | null> {
  await ensureSeedData();
  try {
    const pool = getPgPool();
    const result = await pool.query<{
      id: string;
      email: string;
      role: string;
      email_verified: boolean;
      phone: string | null;
      full_name: string | null;
      city: string | null;
      avatar_url: string | null;
      bio: string | null;
    }>(
      `
        SELECT
          u.id, u.email, u.role, u.email_verified, u.phone,
          p.full_name, p.city, p.avatar_url, p.bio
        FROM users u
        LEFT JOIN user_profiles p ON p.user_id = u.id
        WHERE u.id = $1
        LIMIT 1
      `,
      [userId]
    );
    const row = result.rows[0];
    if (!row) return null;
    return {
      ...mapUser(row),
      userId: row.id,
      fullName: row.full_name ?? undefined,
      city: row.city ?? undefined,
      avatarUrl: row.avatar_url ?? undefined,
      bio: row.bio ?? undefined
    };
  } catch {
    return null;
  }
}

export async function listUserFavorites(userId: string): Promise<string[]> {
  await ensureSeedData();
  try {
    const pool = getPgPool();
    const result = await pool.query<{ listing_id: string }>(
      `
        SELECT listing_id
        FROM favorites
        WHERE user_id = $1
        ORDER BY created_at DESC
      `,
      [userId]
    );
    return result.rows.map((row) => row.listing_id);
  } catch {
    return [];
  }
}

export async function toggleFavorite(userId: string, listingId: string): Promise<{ favorited: boolean }> {
  await ensureSeedData();
  const pool = getPgPool();
  const existing = await pool.query("SELECT 1 FROM favorites WHERE user_id = $1 AND listing_id = $2", [userId, listingId]);
  if ((existing.rowCount ?? 0) > 0) {
    await pool.query("DELETE FROM favorites WHERE user_id = $1 AND listing_id = $2", [userId, listingId]);
    return { favorited: false };
  }

  await pool.query(
    `
      INSERT INTO favorites (user_id, listing_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
    `,
    [userId, listingId]
  );
  return { favorited: true };
}

export async function listSavedSearches(userId: string): Promise<Array<{ id: string; name: string; queryParams: Record<string, unknown> }>> {
  await ensureSeedData();
  try {
    const pool = getPgPool();
    const result = await pool.query<{ id: string; name: string; query_params: Record<string, unknown> }>(
      `
        SELECT id, name, query_params
        FROM saved_searches
        WHERE user_id = $1
        ORDER BY created_at DESC
      `,
      [userId]
    );
    return result.rows.map((row) => ({ id: row.id, name: row.name, queryParams: row.query_params }));
  } catch {
    return [];
  }
}

export async function saveSearch(userId: string, input: { name: string; queryParams: Record<string, unknown> }): Promise<void> {
  await ensureSeedData();
  const pool = getPgPool();
  await pool.query(
    `
      INSERT INTO saved_searches (id, user_id, name, query_params)
      VALUES ($1, $2, $3, $4::jsonb)
    `,
    [createUuidLikeId(), userId, input.name, JSON.stringify(input.queryParams)]
  );
}

// ── Public seller profile ──────────────────────────────────────────────────

export interface PublicSellerProfile {
  userId: string;
  displayName: string;
  city: string | null;
  memberSince: string | null;
  activeListingCount: number;
  sellerVerified: boolean;
}

export async function getPublicSellerProfile(
  userId: string
): Promise<PublicSellerProfile | null> {
  try {
    await ensureSeedData();
    const pool = getPgPool();

    const userResult = await pool.query<{
      full_name: string | null;
      city: string | null;
      created_at: Date | null;
      email_verified: boolean;
    }>(
      `SELECT up.full_name, up.city, u.created_at, u.email_verified
       FROM users u
       LEFT JOIN user_profiles up ON up.user_id = u.id
       WHERE u.id = $1 LIMIT 1`,
      [userId]
    );
    const user = userResult.rows[0];
    if (!user) return null;

    const countResult = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text as count FROM listings
       WHERE owner_user_id = $1 AND status = 'active'`,
      [userId]
    );
    const activeListingCount = Number(countResult.rows[0]?.count ?? 0);

    return {
      userId,
      displayName: user.full_name ?? "EkoMobil İstifadəçisi",
      city: user.city,
      memberSince: user.created_at?.toISOString() ?? null,
      activeListingCount,
      sellerVerified: user.email_verified
    };
  } catch {
    return null;
  }
}
