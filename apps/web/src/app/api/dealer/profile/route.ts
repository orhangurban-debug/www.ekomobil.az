import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth";
import { getDealerProfileSettingsForOwner, updateDealerProfileSettings } from "@/server/dealer-store";
import { getEffectiveBusinessProfileEntitlements } from "@/server/business-plan-store";

export async function GET() {
  const user = await getServerSessionUser();
  if (!user || (user.role !== "dealer" && user.role !== "admin")) {
    return NextResponse.json({ ok: false, error: "Dealer access required." }, { status: 403 });
  }

  const profile = await getDealerProfileSettingsForOwner(user.id);
  if (!profile) {
    return NextResponse.json({ ok: false, error: "Dealer profile tapılmadı." }, { status: 404 });
  }
  const entitlements = await getEffectiveBusinessProfileEntitlements(user.id);
  return NextResponse.json({ ok: true, profile, entitlements });
}

export async function POST(req: Request) {
  const user = await getServerSessionUser();
  if (!user || (user.role !== "dealer" && user.role !== "admin")) {
    return NextResponse.json({ ok: false, error: "Dealer access required." }, { status: 403 });
  }

  const body = (await req.json()) as {
    name?: string;
    city?: string;
    logoUrl?: string;
    coverUrl?: string;
    description?: string;
    whatsappPhone?: string;
    websiteUrl?: string;
    address?: string;
    workingHours?: string;
    showWhatsapp?: boolean;
    showWebsite?: boolean;
  };

  const entitlements = await getEffectiveBusinessProfileEntitlements(user.id);
  const updated = await updateDealerProfileSettings({
    ownerUserId: user.id,
    ...body,
    entitlements
  });
  if (!updated) {
    return NextResponse.json({ ok: false, error: "Dealer profile tapılmadı." }, { status: 404 });
  }
  return NextResponse.json({ ok: true, profile: updated, entitlements });
}
