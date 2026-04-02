import { randomUUID } from "node:crypto";
import { getPgPool } from "@/lib/postgres";

export interface AuctionNotificationRecord {
  id: string;
  userId: string;
  auctionId?: string;
  type: string;
  title: string;
  message: string;
  ctaHref?: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

interface AuctionNotificationRow {
  id: string;
  user_id: string;
  auction_id: string | null;
  type: string;
  title: string;
  message: string;
  cta_href: string | null;
  is_read: boolean;
  created_at: Date;
  read_at: Date | null;
}

function mapRow(row: AuctionNotificationRow): AuctionNotificationRecord {
  return {
    id: row.id,
    userId: row.user_id,
    auctionId: row.auction_id ?? undefined,
    type: row.type,
    title: row.title,
    message: row.message,
    ctaHref: row.cta_href ?? undefined,
    isRead: row.is_read,
    createdAt: row.created_at.toISOString(),
    readAt: row.read_at?.toISOString() ?? undefined,
  };
}

export async function createAuctionNotification(input: {
  userId: string;
  auctionId?: string;
  type: string;
  title: string;
  message: string;
  ctaHref?: string;
}): Promise<void> {
  const pool = getPgPool();
  await pool.query(
    `INSERT INTO auction_user_notifications (id, user_id, auction_id, type, title, message, cta_href)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      randomUUID(),
      input.userId,
      input.auctionId ?? null,
      input.type,
      input.title,
      input.message,
      input.ctaHref ?? null
    ]
  );
}

export async function listAuctionNotificationsForUser(
  userId: string,
  limit = 20
): Promise<AuctionNotificationRecord[]> {
  try {
    const pool = getPgPool();
    const result = await pool.query<AuctionNotificationRow>(
      `SELECT *
       FROM auction_user_notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows.map(mapRow);
  } catch {
    return [];
  }
}

export async function markAuctionNotificationRead(notificationId: string, userId: string): Promise<void> {
  const pool = getPgPool();
  await pool.query(
    `UPDATE auction_user_notifications
     SET is_read = TRUE, read_at = NOW()
     WHERE id = $1 AND user_id = $2`,
    [notificationId, userId]
  );
}
