import { NextResponse } from "next/server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { requireApiRoles } from "@/lib/rbac";
import { createAdRequest, listAdRequests, updateAdRequestStatus, type AdRequestStatus } from "@/server/ad-request-store";
import { sendAdRequestConfirmation, sendAdRequestAdminAlert } from "@/lib/email";
import { getAdSlotsConfig } from "@/server/system-settings-store";

// ── Public: submit ad request ──────────────────────────────────────────────

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const limit = await checkRateLimit(`ad-request:${ip}`, 5, 3600);
  if (!limit.ok) return rateLimitResponse(limit.retryAfterSeconds ?? 3600);

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Yanlış sorğu formatı" }, { status: 400 });
  }

  const slotId = typeof body.slotId === "string" ? body.slotId.trim() : "";
  const companyName = typeof body.companyName === "string" ? body.companyName.trim() : "";
  const contactName = typeof body.contactName === "string" ? body.contactName.trim() : "";
  const contactEmail = typeof body.contactEmail === "string" ? body.contactEmail.trim() : "";

  if (!slotId || !companyName || !contactName || !contactEmail) {
    return NextResponse.json(
      { ok: false, error: "Slot, şirkət adı, əlaqə şəxsi və e-poçt tələb olunur" },
      { status: 400 }
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    return NextResponse.json({ ok: false, error: "Düzgün e-poçt ünvanı daxil edin" }, { status: 400 });
  }

  // Verify the slot exists (allow "general-inquiry" as a virtual slot for general questions)
  const config = await getAdSlotsConfig();
  const slot = slotId === "general-inquiry"
    ? { label: "Ümumi sorğu" }
    : config.slots.find((s) => s.id === slotId);
  if (!slot) {
    return NextResponse.json({ ok: false, error: "Seçilmiş slot tapılmadı" }, { status: 400 });
  }

  const record = await createAdRequest({
    slotId,
    companyName,
    contactName,
    contactEmail,
    contactPhone: typeof body.contactPhone === "string" ? body.contactPhone.trim() : undefined,
    websiteUrl: typeof body.websiteUrl === "string" ? body.websiteUrl.trim() : undefined,
    message: typeof body.message === "string" ? body.message.trim() : undefined,
    budgetAzn: typeof body.budgetAzn === "number" && body.budgetAzn > 0 ? body.budgetAzn : undefined,
    durationDays: typeof body.durationDays === "number" && body.durationDays > 0 ? body.durationDays : undefined,
    isWaitlist: body.isWaitlist === true
  });

  // Send emails (non-blocking — never fail the request because of email)
  const adminEmail = process.env.ADMIN_EMAIL ?? config.contactEmail ?? "reklam@ekomobil.az";
  await Promise.allSettled([
    sendAdRequestConfirmation({ to: contactEmail, contactName, companyName, slotLabel: slot.label }),
    sendAdRequestAdminAlert({ to: adminEmail, record, slotLabel: slot.label })
  ]);

  return NextResponse.json({ ok: true, id: record.id });
}

// ── Admin: list / update ───────────────────────────────────────────────────

export async function GET(req: Request) {
  const auth = requireApiRoles(req, ["admin", "support"]);
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const status = url.searchParams.get("status") as AdRequestStatus | null;
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
  const pageSize = 50;

  const result = await listAdRequests({
    status: status ?? undefined,
    limit: pageSize,
    offset: (page - 1) * pageSize
  });

  return NextResponse.json({ ok: true, ...result });
}

export async function PATCH(req: Request) {
  const auth = requireApiRoles(req, ["admin"]);
  if (!auth.ok) return auth.response;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Yanlış sorğu formatı" }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id : "";
  const status = typeof body.status === "string" ? (body.status as AdRequestStatus) : null;
  const adminNote = typeof body.adminNote === "string" ? body.adminNote : undefined;

  if (!id || !status) {
    return NextResponse.json({ ok: false, error: "id və status tələb olunur" }, { status: 400 });
  }

  const updated = await updateAdRequestStatus(id, status, adminNote);
  if (!updated) {
    return NextResponse.json({ ok: false, error: "Müraciət tapılmadı" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, record: updated });
}
