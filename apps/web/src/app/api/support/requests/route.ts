import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/auth";
import { getPgPool } from "@/lib/postgres";
import { getClientIp } from "@/lib/rate-limit";
import { defaultPriorityForRequestType } from "@/lib/support-admin";
import { createPendingServiceListing } from "@/server/service-listing-store";

const ALLOWED_TYPES = new Set([
  "question",
  "problem",
  "complaint",
  "partnership",
  "dealer_apply",
  "parts_apply",
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

async function insertSupportRequest(input: {
  id: string;
  requestType: string;
  subject: string;
  message: string;
  priority: string;
  reporterUserId: string | null;
  reporterName: string | null;
  reporterEmail: string | null;
  reporterPhone: string | null;
  listingId: string | null;
  reporterIp: string | null;
  reporterUserAgent: string | null;
  metadata: Record<string, unknown>;
}): Promise<void> {
  const pool = getPgPool();
  try {
    await pool.query(
      `INSERT INTO support_requests (
        id, request_type, subject, message, status, priority, source,
        reporter_user_id, reporter_name, reporter_email, reporter_phone, listing_id,
        reporter_ip, reporter_user_agent, metadata, last_activity_at
      )
      VALUES ($1, $2, $3, $4, 'new', $5, 'web', $6, $7, $8, $9, $10, $11, $12, $13::jsonb, NOW())`,
      [
        input.id,
        input.requestType,
        input.subject,
        input.message,
        input.priority,
        input.reporterUserId,
        input.reporterName,
        input.reporterEmail,
        input.reporterPhone,
        input.listingId,
        input.reporterIp,
        input.reporterUserAgent,
        JSON.stringify(input.metadata)
      ]
    );
  } catch {
    await pool.query(
      `INSERT INTO support_requests (
        id, request_type, subject, message, status, priority, source,
        reporter_user_id, reporter_name, reporter_email, reporter_phone, listing_id, metadata, last_activity_at
      )
      VALUES ($1, $2, $3, $4, 'new', $5, 'web', $6, $7, $8, $9, $10, $11::jsonb, NOW())`,
      [
        input.id,
        input.requestType,
        input.subject,
        input.message,
        input.priority,
        input.reporterUserId,
        input.reporterName,
        input.reporterEmail,
        input.reporterPhone,
        input.listingId,
        JSON.stringify(input.metadata)
      ]
    );
  }
}

interface ServicePartnerDraft {
  providerType?: string;
  name?: string;
  city?: string;
  branchCities?: string[];
  address?: string;
  mapUrl?: string;
  about?: string;
  services?: string[];
  certifications?: string[];
  imageUrls?: string[];
  phone?: string;
  whatsapp?: string;
}

interface DealerApplicationDraft {
  businessType?: "dealer" | "parts_store";
  businessName?: string;
  voen?: string | null;
  city?: string;
  phone?: string;
  website?: string | null;
  description?: string | null;
  logoUrl?: string | null;
  branchCities?: string[];
}

const BUSINESS_REQUEST_TYPES = new Set([
  "dealer_apply",
  "parts_apply",
  "inspection_partner",
  "partnership"
]);

export async function POST(req: Request) {
  const body = (await req.json()) as {
    requestType?: string;
    subject?: string;
    message?: string;
    name?: string;
    email?: string;
    phone?: string;
    listingId?: string;
    servicePartner?: ServicePartnerDraft;
    dealerApplication?: DealerApplicationDraft;
  };
  if (!body.subject?.trim() || !body.message?.trim()) {
    return NextResponse.json({ ok: false, error: "Mövzu və müraciət mətni mütləqdir." }, { status: 400 });
  }
  const requestType = ALLOWED_TYPES.has(body.requestType ?? "") ? (body.requestType as string) : "question";
  const priority = defaultPriorityForRequestType(requestType);
  const reporterIp = getClientIp(req);
  const reporterUserAgent = req.headers.get("user-agent")?.slice(0, 512) ?? null;

  let reporterUserId = getOptionalUserIdFromCookie(req);
  let reporterEmail = body.email?.trim() || null;
  let reporterName = body.name?.trim() || null;

  if (BUSINESS_REQUEST_TYPES.has(requestType)) {
    if (!reporterUserId) {
      return NextResponse.json(
        { ok: false, error: "Biznes müraciəti üçün hesabınıza daxil olun." },
        { status: 401 }
      );
    }
    try {
      const pool = getPgPool();
      const userRow = await pool.query<{ email: string; phone: string | null }>(
        `SELECT email, phone FROM users WHERE id = $1 LIMIT 1`,
        [reporterUserId]
      );
      const account = userRow.rows[0];
      reporterEmail = reporterEmail || account?.email?.trim() || null;
      if (!reporterEmail) {
        return NextResponse.json(
          { ok: false, error: "Biznes müraciəti üçün hesab e-poçtu tələb olunur." },
          { status: 400 }
        );
      }
      if (!reporterName) {
        const profileRow = await pool.query<{ full_name: string | null }>(
          `SELECT full_name FROM user_profiles WHERE user_id = $1 LIMIT 1`,
          [reporterUserId]
        );
        reporterName = profileRow.rows[0]?.full_name?.trim() || account?.email?.split("@")[0] || "İstifadəçi";
      }
      if (!body.phone?.trim() && account?.phone) {
        body.phone = account.phone;
      }
    } catch {
      return NextResponse.json(
        { ok: false, error: "Hesab məlumatları yoxlanıla bilmədi." },
        { status: 500 }
      );
    }
  }

  const metadata: Record<string, unknown> = {
    referer: req.headers.get("referer") ?? null,
    acceptLanguage: req.headers.get("accept-language")?.slice(0, 128) ?? null,
    reporterIp: reporterIp || null,
    reporterUserAgent
  };
  if (body.dealerApplication) {
    metadata.dealerApplication = {
      businessType:  body.dealerApplication.businessType ?? "dealer",
      businessName:  body.dealerApplication.businessName?.trim() || null,
      voen:          body.dealerApplication.voen?.trim() || null,
      city:          body.dealerApplication.city?.trim() || null,
      phone:         body.dealerApplication.phone?.trim() || null,
      website:       body.dealerApplication.website?.trim() || null,
      description:   body.dealerApplication.description?.trim() || null,
      logoUrl:       body.dealerApplication.logoUrl?.trim() || null,
      branchCities:  Array.isArray(body.dealerApplication.branchCities)
        ? body.dealerApplication.branchCities.filter((city): city is string => typeof city === "string")
        : [],
    };
  }
  if (body.servicePartner) {
    metadata.servicePartner = {
      providerType: body.servicePartner.providerType?.trim() || null,
      name: body.servicePartner.name?.trim() || null,
      city: body.servicePartner.city?.trim() || null,
      branchCities: Array.isArray(body.servicePartner.branchCities)
        ? body.servicePartner.branchCities.filter((city): city is string => typeof city === "string")
        : [],
      address: body.servicePartner.address?.trim() || null,
      mapUrl: body.servicePartner.mapUrl?.trim() || null,
      about: body.servicePartner.about?.trim() || null,
      services: Array.isArray(body.servicePartner.services)
        ? body.servicePartner.services.filter((item): item is string => typeof item === "string")
        : [],
      certifications: Array.isArray(body.servicePartner.certifications)
        ? body.servicePartner.certifications.filter((item): item is string => typeof item === "string")
        : [],
      imageUrls: Array.isArray(body.servicePartner.imageUrls)
        ? body.servicePartner.imageUrls.filter((item): item is string => typeof item === "string")
        : [],
      phone: body.servicePartner.phone?.trim() || null,
      whatsapp: body.servicePartner.whatsapp?.trim() || null
    };
  }
  const supportRequestId = randomUUID();
  try {
    await insertSupportRequest({
      id: supportRequestId,
      requestType,
      subject: body.subject.trim(),
      message: body.message.trim(),
      priority,
      reporterUserId,
      reporterName,
      reporterEmail,
      reporterPhone: body.phone?.trim() || null,
      listingId: body.listingId?.trim() || null,
      reporterIp: reporterIp || null,
      reporterUserAgent,
      metadata
    });

    let serviceSlug: string | null = null;
    if (requestType === "inspection_partner" && body.servicePartner) {
      const draft = body.servicePartner;
      if (draft.providerType?.trim() && draft.name?.trim() && draft.city?.trim() && draft.phone?.trim()) {
        try {
          const result = await createPendingServiceListing({
            supportRequestId,
            ownerUserId: reporterUserId ?? undefined,
            name: draft.name.trim(),
            providerType: draft.providerType.trim(),
            city: draft.city.trim(),
            branchCities: Array.isArray(draft.branchCities)
              ? draft.branchCities.filter((city): city is string => typeof city === "string")
              : undefined,
            address: draft.address?.trim() || undefined,
            mapUrl: draft.mapUrl?.trim() || undefined,
            about: draft.about?.trim() || "",
            services: Array.isArray(draft.services) ? draft.services.filter((s) => typeof s === "string") : [],
            certifications: Array.isArray(draft.certifications)
              ? draft.certifications.filter((s) => typeof s === "string")
              : undefined,
            imageUrls: Array.isArray(draft.imageUrls) ? draft.imageUrls.filter((s) => typeof s === "string") : undefined,
            phone: draft.phone.trim(),
            whatsapp: draft.whatsapp?.trim() || undefined
          });
          serviceSlug = result.slug;
        } catch (error) {
          console.error("Failed to create service listing", error);
        }
      }
    }

    return NextResponse.json({
      ok: true,
      id: supportRequestId,
      serviceSlug,
      message: serviceSlug
        ? "Müraciətiniz qəbul edildi. Profil admin təsdiqindən sonra aktiv olacaq."
        : "Müraciətiniz qəbul edildi."
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Müraciət göndərilə bilmədi. Yenidən cəhd edin." }, { status: 500 });
  }
}
