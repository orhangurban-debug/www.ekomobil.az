import { getAuctionApiBaseUrl } from "@/server/auction-runtime";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const baseUrl = getAuctionApiBaseUrl();
  if (!baseUrl) {
    return new Response(null, { status: 204 });
  }

  const upstream = await fetch(`${baseUrl}/api/auctions/${id}/stream`, {
    headers: {
      Accept: "text/event-stream"
    },
    cache: "no-store"
  });

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    }
  });
}
