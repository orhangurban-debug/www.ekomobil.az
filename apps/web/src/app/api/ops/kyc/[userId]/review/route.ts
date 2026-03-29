import { NextResponse } from "next/server";
import { requireApiRoles } from "@/lib/rbac";
import { deepKycReviewSchema, parseOrThrow, ValidationError } from "@/lib/validate";
import { reviewDeepKyc } from "@/server/user-kyc-store";

export async function POST(req: Request, context: { params: Promise<{ userId: string }> }) {
  const auth = requireApiRoles(req, ["admin", "support"]);
  if (!auth.ok) return auth.response;

  const { userId } = await context.params;
  if (!userId || !/^[0-9a-f-]{36}$/.test(userId)) {
    return NextResponse.json({ ok: false, error: "Keçərsiz user ID" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Yanlış sorğu formatı." }, { status: 400 });
  }

  let parsed;
  try {
    const payload = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
    parsed = parseOrThrow(deepKycReviewSchema, { ...payload, userId });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof ValidationError ? err.message : "Yanlış məlumat." },
      { status: 400 }
    );
  }

  const profile = await reviewDeepKyc({
    reviewerUserId: auth.user.id,
    userId: parsed.userId,
    decision: parsed.decision,
    note: parsed.note
  });
  if (!profile) {
    return NextResponse.json({ ok: false, error: "KYC müraciəti tapılmadı" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, profile });
}
