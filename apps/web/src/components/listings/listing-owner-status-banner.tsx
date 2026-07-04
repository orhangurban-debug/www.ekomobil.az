import type { ListingStatus } from "@/lib/marketplace-types";

type ListingOwnerStatusBannerProps = {
  status: ListingStatus;
  paymentSuccess?: boolean;
};

const statusCopy: Partial<Record<ListingStatus, { title: string; body: string; cls: string }>> = {
  pending_review: {
    title: "Elan yoxlamada",
    body: "Admin təsdiqindən sonra elan aktivləşəcək və axtarışda görünəcək. Plan müddəti sayğacı aktiv olduqdan sonra başlayır.",
    cls: "border-amber-500/25 bg-amber-500/10 text-amber-800"
  },
  draft: {
    title: "Qaralama",
    body: "Ödənişi tamamladıqdan sonra elan yoxlamaya göndəriləcək.",
    cls: "border-slate-900/10 bg-white/63 text-slate-700"
  },
  rejected: {
    title: "Elan rədd edilib",
    body: "Düzəliş edib yenidən göndərə və ya dəstək ilə əlaqə saxla.",
    cls: "border-red-500/25 bg-red-500/10 text-red-800"
  },
  archived: {
    title: "Arxivdə",
    body: "Plan müddəti bitib. Yeniləmək üçün planı uzat və ya yenidən yayımla.",
    cls: "border-slate-900/10 bg-white/63 text-slate-600"
  },
  inactive: {
    title: "Deaktiv",
    body: "Elan hazırda ictimai axtarışda görünmür.",
    cls: "border-slate-900/10 bg-white/63 text-slate-600"
  }
};

export function ListingOwnerStatusBanner({ status, paymentSuccess }: ListingOwnerStatusBannerProps) {
  const copy = statusCopy[status];
  if (!copy && !paymentSuccess) return null;

  return (
    <div className="mb-6 space-y-3">
      {paymentSuccess && (
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800">
          <strong>Ödəniş qəbul edildi.</strong> Elanınız admin yoxlamasına göndərildi. Təsdiqdən sonra aktivləşəcək.
        </div>
      )}
      {copy && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${copy.cls}`}>
          <p className="font-semibold">{copy.title}</p>
          <p className="mt-1">{copy.body}</p>
        </div>
      )}
    </div>
  );
}
