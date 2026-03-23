import { NextResponse } from "next/server";
import { startManualReview } from "@/server/review-store";
import { requireApiRoles } from "@/lib/rbac";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, context: Params) {
  const auth = requireApiRoles(req, ["admin", "support"]);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const updated = await startManualReview(id, auth.user.id);
  if (!updated) {
    return NextResponse.json({ ok: false, error: "Review case not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, item: updated });
}
