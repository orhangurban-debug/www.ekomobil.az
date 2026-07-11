import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth";
import { updateServiceInquiryStage, type ServiceInquiryStage } from "@/server/service-inquiry-store";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: Request, context: Params) {
  const user = await getServerSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Daxil olun." }, { status: 401 });
  }

  let body: { stage?: ServiceInquiryStage; note?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Keçərsiz sorğu" }, { status: 400 });
  }

  const { id } = await context.params;
  if (!body.stage) {
    return NextResponse.json({ ok: false, error: "Stage tələb olunur." }, { status: 400 });
  }

  const updated = await updateServiceInquiryStage({
    inquiryId: id,
    ownerUserId: user.id,
    stage: body.stage,
    note: body.note
  });

  if (!updated) {
    return NextResponse.json({ ok: false, error: "Sorğu tapılmadı." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
