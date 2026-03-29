import { randomUUID } from "node:crypto";
import { getPgPool } from "@/lib/postgres";
import { getAuctionListingsMemory } from "@/server/auction-memory";
import { assertAuctionMemoryFallbackAllowed } from "@/server/auction-runtime";
import { recordAuctionAuditLog } from "@/server/auction-store";

type ReminderSeverity = "upcoming" | "overdue";
type ReminderType = "confirmation_step" | "discipline_payment";

interface AuctionSlaCandidateRow {
  id: string;
  title_snapshot: string;
  status: string;
  updated_at: Date;
}

interface AuctionSlaReminderRow {
  id: string;
  auction_id: string;
  reminder_key: string;
  reminder_type: string;
  auction_status: string;
  severity: string;
  due_at: Date;
  triggered_at: Date;
  message: string;
  delivery_channel: string;
  created_at: Date;
  title_snapshot?: string;
}

export interface AuctionSlaReminderRecord {
  id: string;
  auctionId: string;
  titleSnapshot?: string;
  reminderKey: string;
  reminderType: ReminderType;
  auctionStatus: string;
  severity: ReminderSeverity;
  dueAt: string;
  triggeredAt: string;
  message: string;
  deliveryChannel: string;
}

export interface AuctionSlaReminderSweepSummary {
  scanned: number;
  candidates: number;
  created: number;
  skipped: number;
}

const CONFIRMATION_SLA_HOURS = Number(process.env.AUCTION_SLA_CONFIRMATION_HOURS ?? "24");
const PAYMENT_SLA_HOURS = Number(process.env.AUCTION_SLA_PAYMENT_HOURS ?? "12");
const UPCOMING_WINDOW_MINUTES = Number(process.env.AUCTION_SLA_REMINDER_LEAD_MINUTES ?? "60");

const globalForAuctionSla = globalThis as unknown as {
  ekomobilSlaReminderKeys?: Set<string>;
  ekomobilSlaReminders?: AuctionSlaReminderRecord[];
};

function getSlaReminderKeysMemory(): Set<string> {
  if (!globalForAuctionSla.ekomobilSlaReminderKeys) {
    globalForAuctionSla.ekomobilSlaReminderKeys = new Set<string>();
  }
  return globalForAuctionSla.ekomobilSlaReminderKeys;
}

function getSlaRemindersMemory(): AuctionSlaReminderRecord[] {
  if (!globalForAuctionSla.ekomobilSlaReminders) {
    globalForAuctionSla.ekomobilSlaReminders = [];
  }
  return globalForAuctionSla.ekomobilSlaReminders;
}

function mapReminderRow(row: AuctionSlaReminderRow): AuctionSlaReminderRecord {
  return {
    id: row.id,
    auctionId: row.auction_id,
    titleSnapshot: row.title_snapshot,
    reminderKey: row.reminder_key,
    reminderType: row.reminder_type as ReminderType,
    auctionStatus: row.auction_status,
    severity: row.severity as ReminderSeverity,
    dueAt: row.due_at.toISOString(),
    triggeredAt: row.triggered_at.toISOString(),
    message: row.message,
    deliveryChannel: row.delivery_channel
  };
}

function resolveSlaForStatus(status: string): { type: ReminderType; hours: number } | null {
  if (status === "ended_pending_confirmation" || status === "buyer_confirmed" || status === "seller_confirmed") {
    return { type: "confirmation_step", hours: CONFIRMATION_SLA_HOURS };
  }
  if (status === "no_show" || status === "seller_breach") {
    return { type: "discipline_payment", hours: PAYMENT_SLA_HOURS };
  }
  return null;
}

function buildReminderMessage(input: { status: string; type: ReminderType; severity: ReminderSeverity }): string {
  if (input.type === "confirmation_step") {
    if (input.severity === "upcoming") {
      return `Təsdiq mərhələsi üçün SLA yaxınlaşır (${input.status}).`;
    }
    return `Təsdiq mərhələsi üçün SLA keçib (${input.status}).`;
  }
  if (input.severity === "upcoming") {
    return `Intizam ödənişi mərhələsi üçün SLA yaxınlaşır (${input.status}).`;
  }
  return `Intizam ödənişi mərhələsi üçün SLA keçib (${input.status}).`;
}

function buildReminderEvents(candidate: AuctionSlaCandidateRow, now: Date): Array<{
  reminderKey: string;
  reminderType: ReminderType;
  severity: ReminderSeverity;
  dueAt: Date;
  message: string;
}> {
  const rule = resolveSlaForStatus(candidate.status);
  if (!rule) return [];

  const dueAt = new Date(candidate.updated_at.getTime() + rule.hours * 60 * 60 * 1000);
  const deltaMs = dueAt.getTime() - now.getTime();
  const deltaMinutes = Math.floor(deltaMs / (60 * 1000));
  if (deltaMinutes > UPCOMING_WINDOW_MINUTES) return [];

  const severity: ReminderSeverity = deltaMinutes <= 0 ? "overdue" : "upcoming";
  const reminderKey = `${candidate.status}:${severity}`;
  return [
    {
      reminderKey,
      reminderType: rule.type,
      severity,
      dueAt,
      message: buildReminderMessage({
        status: candidate.status,
        type: rule.type,
        severity
      })
    }
  ];
}

async function tryInsertReminder(input: {
  auctionId: string;
  auctionStatus: string;
  reminderKey: string;
  reminderType: ReminderType;
  severity: ReminderSeverity;
  dueAt: Date;
  message: string;
}): Promise<boolean> {
  const dbId = randomUUID();
  try {
    const pool = getPgPool();
    const result = await pool.query<{ id: string }>(
      `INSERT INTO auction_sla_reminders (
         id, auction_id, reminder_key, reminder_type, auction_status, severity, due_at, message
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (auction_id, reminder_key) DO NOTHING
       RETURNING id`,
      [
        dbId,
        input.auctionId,
        input.reminderKey,
        input.reminderType,
        input.auctionStatus,
        input.severity,
        input.dueAt,
        input.message
      ]
    );
    return Boolean(result.rows[0]?.id);
  } catch (error) {
    assertAuctionMemoryFallbackAllowed(error);
    const key = `${input.auctionId}:${input.reminderKey}`;
    const seen = getSlaReminderKeysMemory();
    if (seen.has(key)) return false;
    seen.add(key);
    getSlaRemindersMemory().unshift({
      id: dbId,
      auctionId: input.auctionId,
      reminderKey: input.reminderKey,
      reminderType: input.reminderType,
      auctionStatus: input.auctionStatus,
      severity: input.severity,
      dueAt: input.dueAt.toISOString(),
      triggeredAt: new Date().toISOString(),
      message: input.message,
      deliveryChannel: "ops_audit"
    });
    return true;
  }
}

async function listSlaCandidates(): Promise<AuctionSlaCandidateRow[]> {
  try {
    const pool = getPgPool();
    const result = await pool.query<AuctionSlaCandidateRow>(
      `SELECT id, title_snapshot, status, updated_at
       FROM auction_listings
       WHERE status IN ('ended_pending_confirmation', 'buyer_confirmed', 'seller_confirmed', 'no_show', 'seller_breach')
       ORDER BY updated_at DESC
       LIMIT 120`
    );
    return result.rows;
  } catch (error) {
    assertAuctionMemoryFallbackAllowed(error);
    return getAuctionListingsMemory()
      .filter((entry) =>
        ["ended_pending_confirmation", "buyer_confirmed", "seller_confirmed", "no_show", "seller_breach"].includes(
          entry.status
        )
      )
      .map((entry) => ({
        id: entry.id,
        title_snapshot: entry.titleSnapshot,
        status: entry.status,
        updated_at: new Date(entry.updatedAt)
      }));
  }
}

export async function runAuctionSlaReminderSweep(now = new Date()): Promise<AuctionSlaReminderSweepSummary> {
  const candidates = await listSlaCandidates();
  let created = 0;
  let skipped = 0;
  let scanned = 0;

  for (const item of candidates) {
    const reminders = buildReminderEvents(item, now);
    if (reminders.length === 0) continue;
    scanned += 1;
    for (const reminder of reminders) {
      const inserted = await tryInsertReminder({
        auctionId: item.id,
        auctionStatus: item.status,
        reminderKey: reminder.reminderKey,
        reminderType: reminder.reminderType,
        severity: reminder.severity,
        dueAt: reminder.dueAt,
        message: reminder.message
      });
      if (!inserted) {
        skipped += 1;
        continue;
      }
      created += 1;
      await recordAuctionAuditLog({
        auctionId: item.id,
        actionType: `sla_reminder_${reminder.severity}`,
        detail: reminder.message
      });
    }
  }

  return {
    scanned,
    candidates: candidates.length,
    created,
    skipped
  };
}

export async function listRecentAuctionSlaReminders(limit = 30): Promise<AuctionSlaReminderRecord[]> {
  const safeLimit = Math.max(1, Math.min(100, limit));
  try {
    const pool = getPgPool();
    const result = await pool.query<AuctionSlaReminderRow>(
      `SELECT r.*, al.title_snapshot
       FROM auction_sla_reminders r
       JOIN auction_listings al ON al.id = r.auction_id
       ORDER BY r.triggered_at DESC
       LIMIT $1`,
      [safeLimit]
    );
    return result.rows.map(mapReminderRow);
  } catch (error) {
    assertAuctionMemoryFallbackAllowed(error);
    return getSlaRemindersMemory().slice(0, safeLimit);
  }
}
