import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/auth";
import { getPgPool } from "@/lib/postgres";

const ALLOWED_TYPES = new Set(["question", "problem", "complaint", "partnership", "other"]);

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
  try {
    const pool = getPgPool();
    await pool.query(
      `INSERT INTO support_requests (
        id, request_type, subject, message, status, priority, source,
        reporter_user_id, reporter_name, reporter_email, reporter_phone, listing_id, last_activity_at
      )
      VALUES ($1, $2, $3, $4, 'new', 'normal', 'web', $5, $6, $7, $8, $9, NOW())`,
      [
        randomUUID(),
        requestType,
        body.subject.trim(),
        body.message.trim(),
        getOptionalUserIdFromCookie(req),
        body.name?.trim() || null,
        body.email?.trim() || null,
        body.phone?.trim() || null,
        body.listingId?.trim() || null
      ]
    );
    return NextResponse.json({ ok: true, message: "Müraciətiniz qəbul edildi. Qısa zamanda cavab veriləcək." });
  } catch {
    return NextResponse.json({ ok: false, error: "Müraciət göndərilə bilmədi. Yenidən cəhd edin." }, { status: 500 });
  }
}
