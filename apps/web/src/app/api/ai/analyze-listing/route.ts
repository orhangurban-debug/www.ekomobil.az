import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeListingImages } from "@/lib/ai/listing-vision";
import { checkListingAiLimit, incrementListingAiUsage } from "@/lib/ai/analysis-limits";
import { getServerSessionUser } from "@/lib/auth";
import { getClientIp } from "@/lib/rate-limit";

const bodySchema = z.object({
  listingKind: z.enum(["vehicle", "part"]),
  imageUrls: z.array(z.string().min(10)).min(1).max(30),
  bulkMode: z.boolean().optional()
});

export async function GET() {
  const sessionUser = await getServerSessionUser();
  const ip = "preview";
  const limit = await checkListingAiLimit(sessionUser?.id ?? null, ip);
  return NextResponse.json({
    ok: true,
    remaining: limit.remaining,
    limit: limit.limit,
    requiresAuth: false
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
  const usage = await checkListingAiLimit(sessionUser?.id ?? null, ip);
  if (!usage.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: "Günlük AI analiz limitiniz dolub. Sabah yenidən cəhd edin.",
        remaining: 0,
        limit: usage.limit
      },
      { status: 429 }
    );
  }

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

  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
  const result = await analyzeListingImages({
    listingKind: parsed.data.listingKind,
    imageUrls: parsed.data.imageUrls,
    bulkMode: parsed.data.bulkMode,
    appBaseUrl
  });

  if (!result) {
    return NextResponse.json(
      { ok: false, error: "Şəkillər analiz edilə bilmədi. Daha aydın foto çəkin və yenidən cəhd edin." },
      { status: 422 }
    );
  }

  await incrementListingAiUsage(usage.identifier);

  return NextResponse.json({
    ok: true,
    result,
    remaining: Math.max(0, usage.remaining - 1),
    limit: usage.limit
  });
}
