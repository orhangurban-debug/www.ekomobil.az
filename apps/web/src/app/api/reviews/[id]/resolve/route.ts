import { NextResponse } from "next/server";
import { resolveManualReview } from "@/server/review-store";
import { requireApiRoles } from "@/lib/rbac";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, context: Params) {
  const auth = requireApiRoles(req, ["admin", "support"]);
  if (!auth.ok) return auth.response;

  const body = (await req.json()) as { resolutionNote?: string; status?: "approved" | "rejected" };
  const { id } = await context.params;

  const updated = await resolveManualReview(
    id,
    body.resolutionNote?.trim() || "Resolved by reviewer.",
    body.status === "rejected" ? "rejected" : "approved",
    auth.user.id
  );
  if (!updated) {
    return NextResponse.json({ ok: false, error: "Review case not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, item: updated });
}
