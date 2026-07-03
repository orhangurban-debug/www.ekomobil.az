import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth";
import { listListings } from "@/server/listing-store";
import { extractSearchParams, generateChatReply, isForbiddenChatTopic, CHAT_FORBIDDEN_TOPIC_REPLY } from "@/lib/ai/gemini";
import { checkAiLimit, incrementAiUsage } from "@/lib/ai/limits";

function hashIp(ip: string): string {
  let h = 0;
  for (let i = 0; i < ip.length; i++) {
    h = (h << 5) - h + ip.charCodeAt(i);
    h |= 0;
  }
  return `ip-${Math.abs(h).toString(36)}`;
}

export async function POST(req: Request) {
  const body = (await req.json()) as { message?: string };
  const message = body.message?.trim();
  if (!message) {
    return NextResponse.json({ ok: false, error: "Mesaj tələb olunur." }, { status: 400 });
  }

  const user = await getServerSessionUser();
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "127.0.0.1";
  const identifier = user ? `user-${user.id}` : hashIp(ip);

  const limit = await checkAiLimit(identifier, !!user);
  if (!limit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: `Gündəlik limit (${limit.limit}) keçildi. Sabah yenidən cəhd edin.`,
        limitExceeded: true
      },
      { status: 429 }
    );
  }

  // Hard server-side refusal before ever calling Gemini — prevents off-topic
  // (e.g. medical) questions from consuming AI quota or getting a model-generated answer.
  if (isForbiddenChatTopic(message)) {
    await incrementAiUsage(identifier);
    return Response.json({
      ok: true,
      message: CHAT_FORBIDDEN_TOPIC_REPLY,
      listings: [],
      remaining: limit.remaining - 1
    });
  }

  try {
    let searchParams = await extractSearchParams(message);
    const hasPartIntent = /ehtiyyat hiss|hissə|detal|zapçast|запчаст/i.test(message);
    const hasSearchIntent = Object.keys(searchParams).length > 0 || 
      /axtar|tap|göstər|bax|ol|var|budcet|qiymət|manat|min|max|marka|model|şəhər|avtomobil|masin/i.test(message) ||
      hasPartIntent;

    if (hasSearchIntent && Object.keys(searchParams).length === 0 && message.length >= 3) {
      searchParams = { search: message, listingKind: hasPartIntent ? "part" : undefined };
    } else if (hasPartIntent && !searchParams.listingKind) {
      searchParams = { ...searchParams, listingKind: "part" };
    }

    let searchResult: Awaited<ReturnType<typeof listListings>> | null = null;
    let listingsContext = "";

    if (hasSearchIntent && Object.keys(searchParams).length > 0) {
      searchResult = await listListings({
        ...searchParams,
        page: 1,
        pageSize: 6,
        sort: searchParams.sort ?? "trust_desc"
      });
      if (searchResult.items.length > 0) {
        listingsContext = searchResult.items
          .map((l) => `- ${l.title} | ${l.priceAzn.toLocaleString()} ₼ | ${l.year} | ${l.mileageKm} km | /listings/${l.id}`)
          .join("\n");
      }
    }

    const reply = await generateChatReply(message, listingsContext);
    await incrementAiUsage(identifier);

    return Response.json({
      ok: true,
      message: reply,
      listings: searchResult?.items ?? [],
      remaining: limit.remaining - 1
    });
  } catch (e) {
    console.error("AI chat error:", e);
    return NextResponse.json(
      { ok: false, error: "Xəta baş verdi. Yenidən cəhd edin." },
      { status: 500 }
    );
  }
}

export async function GET() {
  const user = await getServerSessionUser();
  const identifier = user ? `user-${user.id}` : "anon";
  const limit = await checkAiLimit(identifier, !!user);
  return Response.json({
    ok: true,
    remaining: limit.remaining,
    limit: limit.limit
  });
}
