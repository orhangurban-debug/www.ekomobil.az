import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getPgPool } from "@/lib/postgres";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    listingId?: string;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    preferredDate?: string;
    note?: string;
  };

  if (!body.customerName?.trim() || !body.customerPhone?.trim()) {
    return NextResponse.json(
      { ok: false, error: "Ad və telefon tələb olunur." },
      { status: 400 }
    );
  }

  try {
    const pool = getPgPool();
    const id = randomUUID();
    await pool.query(
      `
        INSERT INTO inspection_requests (
          id, listing_id, customer_name, customer_phone, customer_email, preferred_date, note, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
      `,
      [
        id,
        body.listingId?.trim() || null,
        body.customerName.trim(),
        body.customerPhone.trim(),
        body.customerEmail?.trim() || null,
        body.preferredDate?.trim() || null,
        body.note?.trim() || null
      ]
    );
    return NextResponse.json({
      ok: true,
      message: "Ekspertiza sorğusu qeydə alındı."
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Sorğu qeydə alınmadı. Yenidən cəhd edin." },
      { status: 500 }
    );
  }
}
