import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth";
import {
  getAuctionInspectionReport,
  upsertAuctionInspectionReport
} from "@/server/auction-inspection-store";
import { getAuctionListing } from "@/server/auction-store";
import type { AuctionInspectionReportInput } from "@/lib/auction-inspection";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: auctionId } = await params;
  const report = await getAuctionInspectionReport(auctionId);
  return NextResponse.json({ ok: true, report });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: auctionId } = await params;
  const user = await getServerSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Daxil olmalısınız" }, { status: 401 });
  }

  const auction = await getAuctionListing(auctionId);
  if (!auction) {
    return NextResponse.json({ ok: false, error: "Auksion tapılmadı" }, { status: 404 });
  }
  if (auction.sellerUserId !== user.id && user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Yalnız lot sahibi hesabat verə bilər" }, { status: 403 });
  }
  if (!["draft", "scheduled"].includes(auction.status)) {
    return NextResponse.json(
      { ok: false, error: "Canlı lotun hesabatını artıq dəyişdirmək olmaz" },
      { status: 400 }
    );
  }

  const body = (await req.json().catch(() => ({}))) as Partial<AuctionInspectionReportInput>;
  const result = await upsertAuctionInspectionReport({
    ...body,
    auctionId,
    submittedByUserId: user.id
  } as AuctionInspectionReportInput);

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true, report: result.report });
}
