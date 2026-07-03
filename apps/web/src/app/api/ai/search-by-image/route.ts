import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth";
import { listListings } from "@/server/listing-store";
import { analyzeImageForSearch } from "@/lib/ai/listing-vision";
import { checkAiLimit, incrementAiUsage } from "@/lib/ai/limits";

function hashIp(ip: string): string {
  let h = 0;
  for (let i = 0; i < ip.length; i++) {
    h = (h << 5) - h + ip.charCodeAt(i);
    h |= 0;
  }
  return `ip-${Math.abs(h).toString(36)}`;
}

const MAX_IMAGE_DATA_URL_LENGTH = 8_000_000; // ~6 MB raw, base64-inflated

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { imageDataUrl?: string };
  const imageDataUrl = body.imageDataUrl;
  if (!imageDataUrl || !imageDataUrl.startsWith("data:image/")) {
    return NextResponse.json({ ok: false, error: "Şəkil tələb olunur." }, { status: 400 });
  }
  if (imageDataUrl.length > MAX_IMAGE_DATA_URL_LENGTH) {
    return NextResponse.json({ ok: false, error: "Şəkil ölçüsü çox böyükdür." }, { status: 400 });
  }

  const user = await getServerSessionUser();
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "127.0.0.1";
  // Ayrıca "search" identifikatoru — chat mesaj kvotasından asılı olmasın.
  const identifier = `img-search-${user ? `user-${user.id}` : hashIp(ip)}`;

  const limit = await checkAiLimit(identifier, !!user);
  if (!limit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: `Gündəlik şəkillə axtarış limiti (${limit.limit}) keçildi. Sabah yenidən cəhd edin.`,
        limitExceeded: true
      },
      { status: 429 }
    );
  }

  try {
    const attributes = await analyzeImageForSearch({ imageDataUrl });
    if (!attributes) {
      return NextResponse.json(
        { ok: false, error: "Şəkil analiz edilə bilmədi. Başqa şəkillə cəhd edin." },
        { status: 422 }
      );
    }

    const isPart = attributes.kind === "part";
    const freeText = attributes.searchKeywords.join(" ").trim() || undefined;
    const searchResult = await listListings({
      listingKind: isPart ? "part" : "vehicle",
      make: !isPart ? attributes.make : undefined,
      partCategory: isPart ? attributes.partCategory : undefined,
      partBrand: isPart ? attributes.partBrand : undefined,
      search: freeText,
      page: 1,
      pageSize: 6,
      sort: "trust_desc"
    });

    const resultParams = new URLSearchParams();
    if (isPart) {
      if (attributes.partCategory) resultParams.set("partCategory", attributes.partCategory);
      if (attributes.partBrand) resultParams.set("partBrand", attributes.partBrand);
    } else {
      if (attributes.make) resultParams.set("make", attributes.make);
    }
    if (freeText) resultParams.set("q", freeText);
    const resultHref = `${isPart ? "/parts" : "/listings"}${resultParams.toString() ? `?${resultParams.toString()}` : ""}`;

    await incrementAiUsage(identifier);

    return NextResponse.json({
      ok: true,
      attributes,
      listings: searchResult.items,
      resultHref,
      remaining: limit.remaining - 1
    });
  } catch (e) {
    console.error("AI image search error:", e);
    return NextResponse.json({ ok: false, error: "Xəta baş verdi. Yenidən cəhd edin." }, { status: 500 });
  }
}
