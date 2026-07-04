import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeListingImages } from "@/lib/ai/listing-vision";
import {
  incrementListingAiUsage,
  maxImagesForRequest,
  resolveListingAiQuota,
  type AiAnalysisContext
} from "@/lib/ai/listing-ai-quota";
import { getServerSessionUser } from "@/lib/auth";
import { getClientIp } from "@/lib/rate-limit";

const bodySchema = z.object({
  analysisContext: z.enum(["vehicle", "part", "part_bulk", "service"]),
  listingKind: z.enum(["vehicle", "part", "service"]).optional(),
  imageUrls: z.array(z.string().min(10)).min(1).max(50),
  bulkMode: z.boolean().optional(),
  planType: z.enum(["free", "standard", "vip"]).optional(),
  servicePlanGroup: z.enum(["official", "inspection", "mechanic"]).optional(),
  servicePlanId: z.string().optional(),
  providerTypeHint: z.string().optional()
});

function listingKindFromContext(context: AiAnalysisContext): "vehicle" | "part" | "service" {
  if (context === "service") return "service";
  if (context === "vehicle") return "vehicle";
  return "part";
}

export async function GET(req: Request) {
  const sessionUser = await getServerSessionUser();
  const url = new URL(req.url);
  const context = (url.searchParams.get("context") ?? "vehicle") as AiAnalysisContext;
  const planType = url.searchParams.get("planType") as "free" | "standard" | "vip" | null;
  const servicePlanGroup = url.searchParams.get("servicePlanGroup") as
    | "official"
    | "inspection"
    | "mechanic"
    | null;
  const servicePlanId = url.searchParams.get("servicePlanId") ?? undefined;

  const quota = await resolveListingAiQuota({
    userId: sessionUser?.id ?? null,
    userRole: sessionUser?.role,
    ip: getClientIp(req),
    context,
    planType: planType ?? undefined,
    servicePlanGroup: servicePlanGroup ?? undefined,
    servicePlanId
  });

  return NextResponse.json({
    ok: true,
    quota: {
      context: quota.context,
      remaining: quota.remaining,
      dailyLimit: quota.dailyLimit,
      maxImages: quota.maxImages,
      maxBulkImages: quota.maxBulkImages,
      planLabel: quota.planLabel,
      singleListingOnly: quota.singleListingOnly,
      requiresAuth: quota.requiresAuth
    }
  });
}

export async function POST(req: Request) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { ok: false, error: "AI analiz hazırda aktiv deyil (GEMINI_API_KEY)." },
      { status: 503 }
    );
  }

  const sessionUser = await getServerSessionUser();
  const ip = getClientIp(req);

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Yanlış JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Yanlış sorğu" },
      { status: 400 }
    );
  }

  const { analysisContext, bulkMode } = parsed.data;

  if (analysisContext === "vehicle" && bulkMode) {
    return NextResponse.json(
      { ok: false, error: "Avtomobil elanında toplu şəkil analizi dəstəklənmir. Hər avtomobil üçün ayrı elan yaradın." },
      { status: 400 }
    );
  }

  if ((analysisContext === "part_bulk" || bulkMode) && analysisContext === "vehicle") {
    return NextResponse.json({ ok: false, error: "Yanlış analiz konteksti." }, { status: 400 });
  }

  const effectiveBulk = analysisContext === "part_bulk" || Boolean(bulkMode);

  const quota = await resolveListingAiQuota({
    userId: sessionUser?.id ?? null,
    userRole: sessionUser?.role,
    ip,
    context: analysisContext,
    planType: parsed.data.planType,
    servicePlanGroup: parsed.data.servicePlanGroup,
    servicePlanId: parsed.data.servicePlanId
  });

  if (quota.requiresAuth && !sessionUser) {
    return NextResponse.json(
      { ok: false, error: "AI analiz və elan yayımlamaq üçün hesaba daxil olmalısınız.", requiresAuth: true },
      { status: 401 }
    );
  }

  if (!quota.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: `Günlük AI analiz limitiniz dolub (${quota.planLabel}: ${quota.dailyLimit}/gün). Sabah yenidən cəhd edin.`,
        remaining: 0,
        limit: quota.dailyLimit,
        planLabel: quota.planLabel
      },
      { status: 429 }
    );
  }

  const imageCap = maxImagesForRequest(quota, effectiveBulk);
  if (parsed.data.imageUrls.length > imageCap) {
    return NextResponse.json(
      {
        ok: false,
        error: `Plan limitiniz üzrə bu analizdə maksimum ${imageCap} şəkil göndərilə bilər (${quota.planLabel}).`
      },
      { status: 400 }
    );
  }

  const listingKind = parsed.data.listingKind ?? listingKindFromContext(analysisContext);
  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
  const result = await analyzeListingImages({
    listingKind,
    imageUrls: parsed.data.imageUrls,
    bulkMode: effectiveBulk,
    maxImages: quota.maxImages,
    maxBulkImages: quota.maxBulkImages,
    providerTypeHint: parsed.data.providerTypeHint,
    appBaseUrl
  });

  if (!result) {
    return NextResponse.json(
      { ok: false, error: "Şəkillər analiz edilə bilmədi. Daha aydın foto çəkin və yenidən cəhd edin." },
      { status: 422 }
    );
  }

  await incrementListingAiUsage(quota.identifier);

  return NextResponse.json({
    ok: true,
    result,
    quota: {
      remaining: Math.max(0, quota.remaining - 1),
      dailyLimit: quota.dailyLimit,
      planLabel: quota.planLabel,
      maxImages: quota.maxImages,
      maxBulkImages: quota.maxBulkImages,
      singleListingOnly: quota.singleListingOnly
    }
  });
}
