import { randomUUID } from "node:crypto";
import { getPgPool } from "@/lib/postgres";
import { sendInvoiceEmail } from "@/lib/email";

export type InvoicePaymentType = "listing_plan" | "business_plan" | "auction_deposit" | "listing_boost";

export interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  userId: string;
  userEmail: string;
  userName: string;
  paymentType: InvoicePaymentType;
  paymentId: string;
  amountAzn: number;
  description: string;
  paymentReference?: string;
  emailSentAt?: string;
  emailError?: string;
  issuedAt: string;
  createdAt: string;
}

interface InvoiceRow {
  id: string;
  invoice_number: string;
  user_id: string;
  user_email: string;
  user_name: string;
  payment_type: string;
  payment_id: string;
  amount_azn: number;
  description: string;
  payment_reference: string | null;
  email_sent_at: Date | null;
  email_error: string | null;
  issued_at: Date;
  created_at: Date;
}

function mapRow(row: InvoiceRow): InvoiceRecord {
  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    userId: row.user_id,
    userEmail: row.user_email,
    userName: row.user_name,
    paymentType: row.payment_type as InvoicePaymentType,
    paymentId: row.payment_id,
    amountAzn: Number(row.amount_azn),
    description: row.description,
    paymentReference: row.payment_reference ?? undefined,
    emailSentAt: row.email_sent_at?.toISOString(),
    emailError: row.email_error ?? undefined,
    issuedAt: row.issued_at.toISOString(),
    createdAt: row.created_at.toISOString()
  };
}

export async function ensureInvoicesTable(): Promise<void> {
  try {
    const pool = getPgPool();
    await pool.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        invoice_number     TEXT NOT NULL UNIQUE,
        user_id            UUID NOT NULL,
        user_email         TEXT NOT NULL,
        user_name          TEXT NOT NULL DEFAULT '',
        payment_type       TEXT NOT NULL,
        payment_id         TEXT NOT NULL,
        amount_azn         NUMERIC(10,2) NOT NULL,
        description        TEXT NOT NULL DEFAULT '',
        payment_reference  TEXT,
        email_sent_at      TIMESTAMPTZ,
        email_error        TEXT,
        issued_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS invoices_user_id_idx ON invoices(user_id);
      CREATE INDEX IF NOT EXISTS invoices_payment_id_idx ON invoices(payment_id);
      CREATE INDEX IF NOT EXISTS invoices_issued_at_idx ON invoices(issued_at DESC);
    `);
  } catch {
    // table may already exist in slightly different form; continue
  }
}

async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  try {
    const pool = getPgPool();
    const result = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM invoices WHERE invoice_number LIKE $1`,
      [`INV-${year}-%`]
    );
    const seq = Number(result.rows[0]?.count ?? 0) + 1;
    return `INV-${year}-${String(seq).padStart(5, "0")}`;
  } catch {
    return `INV-${year}-${randomUUID().slice(0, 8).toUpperCase()}`;
  }
}

export async function createInvoice(input: {
  userId: string;
  userEmail: string;
  userName: string;
  paymentType: InvoicePaymentType;
  paymentId: string;
  amountAzn: number;
  description: string;
  paymentReference?: string;
}): Promise<InvoiceRecord | null> {
  await ensureInvoicesTable();
  const id = randomUUID();
  const invoiceNumber = await generateInvoiceNumber();
  const issuedAt = new Date().toISOString();

  try {
    const pool = getPgPool();
    const result = await pool.query<InvoiceRow>(
      `INSERT INTO invoices (
         id, invoice_number, user_id, user_email, user_name,
         payment_type, payment_id, amount_azn, description,
         payment_reference, issued_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (invoice_number) DO NOTHING
       RETURNING *`,
      [
        id,
        invoiceNumber,
        input.userId,
        input.userEmail,
        input.userName,
        input.paymentType,
        input.paymentId,
        input.amountAzn,
        input.description,
        input.paymentReference ?? null,
        issuedAt
      ]
    );
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  } catch {
    return null;
  }
}

export async function getInvoice(invoiceId: string): Promise<InvoiceRecord | null> {
  await ensureInvoicesTable();
  try {
    const pool = getPgPool();
    const result = await pool.query<InvoiceRow>(
      `SELECT * FROM invoices WHERE id = $1 LIMIT 1`,
      [invoiceId]
    );
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  } catch {
    return null;
  }
}

export async function getInvoiceByPaymentId(paymentId: string): Promise<InvoiceRecord | null> {
  await ensureInvoicesTable();
  try {
    const pool = getPgPool();
    const result = await pool.query<InvoiceRow>(
      `SELECT * FROM invoices WHERE payment_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [paymentId]
    );
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  } catch {
    return null;
  }
}

export async function listInvoicesForUser(userId: string, limit = 50): Promise<InvoiceRecord[]> {
  await ensureInvoicesTable();
  try {
    const pool = getPgPool();
    const result = await pool.query<InvoiceRow>(
      `SELECT * FROM invoices WHERE user_id = $1 ORDER BY issued_at DESC LIMIT $2`,
      [userId, limit]
    );
    return result.rows.map(mapRow);
  } catch {
    return [];
  }
}

export async function listAllInvoices(limit = 100, offset = 0): Promise<InvoiceRecord[]> {
  await ensureInvoicesTable();
  try {
    const pool = getPgPool();
    const result = await pool.query<InvoiceRow>(
      `SELECT * FROM invoices ORDER BY issued_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows.map(mapRow);
  } catch {
    return [];
  }
}

export async function countAllInvoices(): Promise<number> {
  await ensureInvoicesTable();
  try {
    const pool = getPgPool();
    const result = await pool.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM invoices`);
    return Number(result.rows[0]?.count ?? 0);
  } catch {
    return 0;
  }
}

const PAYMENT_TYPE_LABELS: Record<InvoicePaymentType, string> = {
  listing_plan: "Elan planı",
  business_plan: "Biznes planı",
  auction_deposit: "Auksion depoziti",
  listing_boost: "Elan boost paketi"
};

export async function issueAndSendInvoice(input: {
  userId: string;
  userEmail: string;
  userName: string;
  paymentType: InvoicePaymentType;
  paymentId: string;
  amountAzn: number;
  description: string;
  paymentReference?: string;
  appBaseUrl: string;
}): Promise<{ ok: boolean; invoice?: InvoiceRecord; emailError?: string }> {
  const existing = await getInvoiceByPaymentId(input.paymentId);
  if (existing) {
    return { ok: true, invoice: existing };
  }

  const invoice = await createInvoice(input);
  if (!invoice) {
    return { ok: false };
  }

  const invoiceUrl = `${input.appBaseUrl}/me/invoices/${invoice.id}`;
  const issuedDate = new Date(invoice.issuedAt).toLocaleDateString("az-AZ", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  const emailResult = await sendInvoiceEmail({
    to: input.userEmail,
    invoiceNumber: invoice.invoiceNumber,
    invoiceDate: issuedDate,
    customerName: input.userName,
    customerEmail: input.userEmail,
    items: [
      {
        description: `${PAYMENT_TYPE_LABELS[input.paymentType]} – ${input.description}`,
        quantity: 1,
        unitPriceAzn: input.amountAzn,
        totalAzn: input.amountAzn
      }
    ],
    totalAzn: input.amountAzn,
    paymentReference: input.paymentReference,
    invoiceUrl
  });

  try {
    const pool = getPgPool();
    if (emailResult.ok) {
      await pool.query(
        `UPDATE invoices SET email_sent_at = NOW() WHERE id = $1`,
        [invoice.id]
      );
      invoice.emailSentAt = new Date().toISOString();
    } else {
      await pool.query(
        `UPDATE invoices SET email_error = $2 WHERE id = $1`,
        [invoice.id, emailResult.error ?? "Naməlum xəta"]
      );
      invoice.emailError = emailResult.error;
    }
  } catch {
    // non-critical
  }

  return {
    ok: true,
    invoice,
    emailError: emailResult.ok ? undefined : emailResult.error
  };
}
