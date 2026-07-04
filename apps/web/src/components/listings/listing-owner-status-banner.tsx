import type { ListingStatus } from "@/lib/marketplace-types";

type ListingOwnerStatusBannerProps = {
  status: ListingStatus;
  paymentSuccess?: boolean;
  rejectionNote?: string;
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
    title: "Elan bloklanıb",
    body: "Elan hazırda ictimai axtarışda görünmür. Ətraflı məlumat üçün dəstək ilə əlaqə saxlayın.",
    cls: "border-violet-500/25 bg-violet-500/10 text-violet-800"
  }
};

export function ListingOwnerStatusBanner({ status, paymentSuccess, rejectionNote }: ListingOwnerStatusBannerProps) {
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
          {status === "rejected" && rejectionNote && (
            <div className="mt-3 rounded-lg border border-red-200 bg-white/70 px-3 py-2 text-xs">
              <p className="font-semibold text-red-700">Admin qeydi:</p>
              <p className="mt-0.5 text-red-800">{rejectionNote}</p>
            </div>
          )}
          {status === "inactive" && rejectionNote && (
            <div className="mt-3 rounded-lg border border-violet-200 bg-white/70 px-3 py-2 text-xs">
              <p className="font-semibold text-violet-700">Blok səbəbi:</p>
              <p className="mt-0.5 text-violet-800">{rejectionNote}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
