import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/auth";
import { getPgPool } from "@/lib/postgres";
import { getClientIp } from "@/lib/rate-limit";
import { defaultPriorityForRequestType } from "@/lib/support-admin";

const ALLOWED_TYPES = new Set([
  "question",
  "problem",
  "complaint",
  "partnership",
  "inspection_partner",
  "data_export",
  "data_rectification",
  "data_deletion",
  "data_processing_objection",
  "other"
]);

function getOptionalUserIdFromCookie(req: Request): string | null {
  const cookieHeader = req.headers.get("cookie") || "";
  const parts = cookieHeader.split(";").map((entry) => entry.trim());
  const tokenPair = parts.find((entry) => entry.startsWith("ekomobil_session="));
  const token = tokenPair ? decodeURIComponent(tokenPair.split("=")[1] || "") : "";
  if (!token) return null;
  const user = verifySessionToken(token);
  return user?.id ?? null;
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    requestType?: string;
    subject?: string;
    message?: string;
    name?: string;
    email?: string;
    phone?: string;
    listingId?: string;
  };
  if (!body.subject?.trim() || !body.message?.trim()) {
    return NextResponse.json({ ok: false, error: "Mövzu və müraciət mətni mütləqdir." }, { status: 400 });
  }
  const requestType = ALLOWED_TYPES.has(body.requestType ?? "") ? (body.requestType as string) : "question";
  const priority = defaultPriorityForRequestType(requestType);
  const reporterIp = getClientIp(req);
  const reporterUserAgent = req.headers.get("user-agent")?.slice(0, 512) ?? null;
  const metadata = {
    referer: req.headers.get("referer") ?? null,
    acceptLanguage: req.headers.get("accept-language")?.slice(0, 128) ?? null
  };
  try {
    const pool = getPgPool();
    await pool.query(
      `INSERT INTO support_requests (
        id, request_type, subject, message, status, priority, source,
        reporter_user_id, reporter_name, reporter_email, reporter_phone, listing_id,
        reporter_ip, reporter_user_agent, metadata, last_activity_at
      )
      VALUES ($1, $2, $3, $4, 'new', $5, 'web', $6, $7, $8, $9, $10, $11, $12, $13::jsonb, NOW())`,
      [
        randomUUID(),
        requestType,
        body.subject.trim(),
        body.message.trim(),
        priority,
        getOptionalUserIdFromCookie(req),
        body.name?.trim() || null,
        body.email?.trim() || null,
        body.phone?.trim() || null,
        body.listingId?.trim() || null,
        reporterIp || null,
        reporterUserAgent,
        JSON.stringify(metadata)
      ]
    );
    return NextResponse.json({ ok: true, message: "Müraciətiniz qəbul edildi. Qısa zamanda cavab veriləcək." });
  } catch {
    return NextResponse.json({ ok: false, error: "Müraciət göndərilə bilmədi. Yenidən cəhd edin." }, { status: 500 });
  }
}
