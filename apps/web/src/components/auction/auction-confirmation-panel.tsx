"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AuctionStatus } from "@/lib/auction";
import { getNoShowPenaltyAzn, getSellerBreachPenaltyAzn } from "@/lib/auction-fees";

export function AuctionConfirmationPanel({
  auctionId,
  auctionStatus,
  canActAsBuyer,
  canActAsSeller,
  canRelist,
  listingId,
  listingPriceAzn
}: {
  auctionId: string;
  auctionStatus: AuctionStatus;
  canActAsBuyer: boolean;
  canActAsSeller: boolean;
  canRelist: boolean;
  listingId?: string;
  listingPriceAzn?: number;
}) {
  const router = useRouter();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [relistResult, setRelistResult] = useState<{
    newAuctionId: string;
    lotCheckoutUrl: string;
    bondCheckoutUrl?: string;
  } | null>(null);

  const settlementOpen = ["ended_pending_confirmation", "buyer_confirmed", "seller_confirmed"].includes(auctionStatus);

  async function submit(actorRole: "buyer" | "seller", outcome: "confirmed" | "no_show" | "seller_breach" | "disputed") {
    setLoadingAction(`${actorRole}-${outcome}`);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch(`/api/auctions/${auctionId}/confirm-sale`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actorRole,
          outcome,
          note:
            outcome === "confirmed"
              ? "Əməliyyat off-platform tamamlandı"
              : outcome === "no_show"
                ? "Qalib tərəf SLA daxilində növbəti addımı tamamlamadı"
                : outcome === "seller_breach"
                  ? "Satıcı qalib təklifdən sonra satış öhdəliyini yerinə yetirmədi"
                  : "Tərəflər arasında mübahisə yarandı"
        })
      });
      const payload = (await response.json()) as { ok: boolean; error?: string };
      if (!payload.ok) {
        setError(payload.error || "Əməliyyat alınmadı.");
        return;
      }
      setMessage("Status yeniləndi.");
      router.refresh();
    } catch {
      setError("Əməliyyat zamanı şəbəkə xətası baş verdi.");
    } finally {
      setLoadingAction(null);
    }
  }

  async function startSellerBreachPenaltyCheckout() {
    setLoadingAction("seller-breach-payment");
    setMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/payments/auction-seller-breach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auctionId })
      });
      const payload = (await response.json()) as { ok: boolean; error?: string; checkoutUrl?: string };
      if (!payload.ok || !payload.checkoutUrl) {
        setError(payload.error || "Checkout yaradıla bilmədi.");
        return;
      }
      router.push(payload.checkoutUrl);
    } catch {
      setError("Checkout yaradılarkən şəbəkə xətası baş verdi.");
    } finally {
      setLoadingAction(null);
    }
  }

  async function startNoShowPenaltyCheckout() {
    setLoadingAction("no-show-payment");
    setMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/payments/auction-no-show", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auctionId })
      });
      const payload = (await response.json()) as { ok: boolean; error?: string; checkoutUrl?: string };
      if (!payload.ok || !payload.checkoutUrl) {
        setError(payload.error || "Checkout yaradıla bilmədi.");
        return;
      }
      router.push(payload.checkoutUrl);
    } catch {
      setError("Checkout yaradılarkən şəbəkə xətası baş verdi.");
    } finally {
      setLoadingAction(null);
    }
  }

  async function relistAuction() {
    setLoadingAction("relist-auction");
    setMessage(null);
    setError(null);
    setRelistResult(null);

    try {
      const response = await fetch(`/api/auctions/${auctionId}/relist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const payload = (await response.json()) as {
        ok: boolean;
        error?: string;
        auction?: { id: string };
        lotCheckoutUrl?: string;
        bondCheckoutUrl?: string;
      };

      if (!payload.ok || !payload.auction?.id || !payload.lotCheckoutUrl) {
        setError(payload.error || "Yenidən auksion üçün lot yaradıla bilmədi.");
        return;
      }

      setRelistResult({
        newAuctionId: payload.auction.id,
        lotCheckoutUrl: payload.lotCheckoutUrl,
        bondCheckoutUrl: payload.bondCheckoutUrl
      });
      setMessage("Yeni lot yaradıldı. Aşağıdakı ödəniş addımlarını tamamlayın.");
      router.refresh();
    } catch {
      setError("Yenidən lot yaradılarkən şəbəkə xətası baş verdi.");
    } finally {
      setLoadingAction(null);
    }
  }

  if (!canActAsBuyer && !canActAsSeller) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-[#141419] p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-white">Satış nəticəsini təsdiqlə</h2>
      <p className="mt-2 text-sm text-white/50">
        Burada əsas satış ödənişi deyil, yalnız satış nəticəsi qeyd olunur. Avtomobilin tam məbləği birbaşa tərəflər arasında ödənir.
        EkoMobil bu prosesə görə tərəflər arası mübahisələrdə məsuliyyət daşımır.
      </p>

      {auctionStatus === "seller_breach" && canActAsBuyer && (
        <div className="mt-4 rounded-xl alert-warning border p-4 text-sm text-amber-950">
          <p className="font-medium">Satıcı öhdəliyi pozulması qeydə alındı.</p>
          <p className="mt-2 text-amber-200/90">
            EkoMobil hər iki tərəfin öhdəliyini ciddi qoruyur. Satıcı öhdəliyini yerinə yetirmədikdə platforma
            satıcı öhdəlik haqqı (hissə üçün {getSellerBreachPenaltyAzn("part")} ₼, avtomobil üçün{" "}
            {getSellerBreachPenaltyAzn("vehicle")} ₼) tətbiq edir. Ödəniş <strong>satıcı</strong> tərəfindən edilməlidir;
            aşağıdakı ödəniş linkini satıcı ilə paylaşın. Bu məbləğ avtomobilin qiyməti deyil — platforma
            öhdəliyinə görə tətbiq edilən haqdır.
          </p>
          <button
            type="button"
            onClick={() => void startSellerBreachPenaltyCheckout()}
            disabled={Boolean(loadingAction)}
            className="btn-primary mt-4 w-full justify-center sm:w-auto"
          >
            {loadingAction === "seller-breach-payment" ? "Hazırlanır..." : "Satıcı öhdəlik haqqı — ödəniş səhifəsi"}
          </button>
        </div>
      )}

      {auctionStatus === "no_show" && canActAsSeller && (
        <div className="mt-4 rounded-xl alert-warning border p-4 text-sm text-amber-950">
          <p className="font-medium">Alıcı öhdəliyi pozulması qeydə alındı.</p>
          <p className="mt-2 text-amber-200/90">
            EkoMobil hər iki tərəfin öhdəliyini ciddi qoruyur. Qalib alıcı öhdəliyini yerinə yetirmədikdə platforma
            alıcı öhdəlik haqqı (hissə üçün {getNoShowPenaltyAzn("part")} ₼, avtomobil üçün{" "}
            {getNoShowPenaltyAzn("vehicle")} ₼) tətbiq edir. Ödəniş <strong>qalib alıcı</strong> tərəfindən edilməlidir;
            aşağıdakı ödəniş linkini alıcı ilə paylaşın. Bu məbləğ avtomobilin qiyməti deyil — platforma
            öhdəliyinə görə tətbiq edilən haqdır.
          </p>
          <button
            type="button"
            onClick={() => void startNoShowPenaltyCheckout()}
            disabled={Boolean(loadingAction)}
            className="btn-primary mt-4 w-full justify-center sm:w-auto"
          >
            {loadingAction === "no-show-payment" ? "Hazırlanır..." : "Alıcı öhdəlik haqqı — ödəniş səhifəsi"}
          </button>
        </div>
      )}

      {settlementOpen && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {canActAsBuyer && (
            <>
              <button
                type="button"
                onClick={() => submit("buyer", "confirmed")}
                disabled={Boolean(loadingAction)}
                className="btn-primary justify-center"
              >
                {loadingAction === "buyer-confirmed" ? "Göndərilir..." : "Alıcı kimi təsdiqlə"}
              </button>
              <button
                type="button"
                onClick={() => submit("buyer", "disputed")}
                disabled={Boolean(loadingAction)}
                className="btn-secondary justify-center"
              >
                Mübahisə bildir
              </button>
              <button
                type="button"
                onClick={() => submit("buyer", "seller_breach")}
                disabled={Boolean(loadingAction)}
                className="btn-secondary justify-center sm:col-span-2 border-amber-300 text-amber-200 hover:bg-amber-500/10"
              >
                {loadingAction === "buyer-seller_breach" ? "Göndərilir..." : "Satıcı satış öhdəliyini pozub"}
              </button>
            </>
          )}

          {canActAsSeller && (
            <>
              <button
                type="button"
                onClick={() => submit("seller", "confirmed")}
                disabled={Boolean(loadingAction)}
                className="btn-primary justify-center"
              >
                {loadingAction === "seller-confirmed" ? "Göndərilir..." : "Satıcı kimi təsdiqlə"}
              </button>
              <button
                type="button"
                onClick={() => submit("seller", "no_show")}
                disabled={Boolean(loadingAction)}
                className="btn-secondary justify-center"
              >
                Alıcı öhdəliyini pozduğunu bildir
              </button>
            </>
          )}
        </div>
      )}

      {!settlementOpen && auctionStatus !== "seller_breach" && auctionStatus !== "no_show" && (canActAsBuyer || canActAsSeller) && (
        <p className="mt-4 text-sm text-white/50">
          Bu auksion üçün təsdiq pəncərəsi bağlanıb. Əlavə əməliyyat yoxdursa, ops və ya dəstək ilə əlaqə saxlayın.
        </p>
      )}

      {canRelist && (
        <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-white/80">
            Bu lotu yenidən auksiona çıxara bilərsiniz. Yeni lot{" "}
            <strong>cari elan qiymətinizdən</strong> başlayacaq
            {typeof listingPriceAzn === "number" ? (
              <> ({listingPriceAzn.toLocaleString("az-AZ")} ₼)</>
            ) : null}
            .
          </p>
          <p className="mt-2 text-sm text-white/65">
            Qiyməti endirmək istəyirsinizsə, əvvəlcə elanı redaktə edin, sonra yenidən auksiona çıxarın.
          </p>
          {listingId && (
            <Link
              href={`/listings/${listingId}`}
              className="mt-2 inline-block text-sm font-medium text-[#0057FF] hover:underline"
            >
              Elan qiymətini redaktə et →
            </Link>
          )}
          <button
            type="button"
            onClick={() => void relistAuction()}
            disabled={Boolean(loadingAction)}
            className="btn-secondary mt-3 w-full justify-center sm:w-auto"
          >
            {loadingAction === "relist-auction" ? "Hazırlanır..." : "Yenidən auksiona çıxar"}
          </button>
        </div>
      )}

      {relistResult && (
        <div className="mt-4 rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm text-emerald-300">
          <p className="font-semibold">Yeni lot yaradıldı: {relistResult.newAuctionId}</p>
          <p className="mt-1 text-emerald-300">Lot aktivləşməsi üçün ödəniş addımlarını tamamlayın.</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              className="btn-primary justify-center"
              onClick={() => router.push(relistResult.lotCheckoutUrl)}
            >
              Lot haqqına keç
            </button>
            {relistResult.bondCheckoutUrl && (
              <button
                type="button"
                className="btn-secondary justify-center"
                onClick={() => router.push(relistResult.bondCheckoutUrl!)}
              >
                Satıcı girovunu ödə
              </button>
            )}
          </div>
        </div>
      )}

      {message && (
        <div className="mt-4 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {message}
        </div>
      )}
      {error && (
        <div className="mt-4 rounded-xl alert-danger border px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}
    </div>
  );
}
