import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AuctionDocumentsManager } from "@/components/auction/auction-documents-manager";
import { getServerSessionUser } from "@/lib/auth";
import { getAuctionListingForRead } from "@/server/auction-read-model";

export default async function AuctionDocumentsPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [user, auction] = await Promise.all([getServerSessionUser(), getAuctionListingForRead(id)]);

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/auction/${id}/documents`)}`);
  }
  if (!auction) notFound();
  if (auction.sellerUserId !== user.id && user.role !== "admin" && user.role !== "support") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-slate-900">Giriş icazəsi yoxdur</h1>
        <p className="mt-2 text-sm text-slate-500">Bu lotun sənədlərini yalnız satıcı və ya ops idarə edə bilər.</p>
        <Link href="/auction" className="btn-primary mt-6 inline-flex justify-center">
          Auksiona qayıt
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <nav className="mb-6 text-sm text-slate-500">
        <Link href="/auction/sell" className="hover:text-slate-900">
          Lot yarat
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900">Sənədlər</span>
      </nav>
      <AuctionDocumentsManager auctionId={auction.id} lotTitle={auction.titleSnapshot} />
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href={`/auction/${auction.id}/confirm`} className="btn-secondary text-sm">
          Satış təsdiqi
        </Link>
        <Link href="/auction/sell" className="btn-secondary text-sm">
          Digər lot
        </Link>
      </div>
    </div>
  );
}
