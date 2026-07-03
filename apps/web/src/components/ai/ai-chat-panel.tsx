"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ListingCardData } from "@/components/listings/listing-card";

interface Message {
  role: "user" | "assistant";
  content: string;
  listings?: ListingCardData[];
  resultHref?: string;
  imagePreviewUrl?: string;
}

function toCardData(item: {
  id: string;
  title: string;
  priceAzn: number;
  city: string;
  year: number;
  mileageKm: number;
  fuelType: string;
  transmission: string;
  trustScore: number;
  vinVerified: boolean;
  sellerVerified: boolean;
  mediaComplete: boolean;
  priceInsight?: string;
  mileageFlagSeverity?: string;
  planType?: string;
  listingKind?: string;
}): ListingCardData {
  return {
    id: item.id,
    title: item.title,
    priceAzn: item.priceAzn,
    city: item.city,
    year: item.year,
    mileageKm: item.mileageKm,
    fuelType: item.fuelType,
    transmission: item.transmission,
    trustScore: item.trustScore,
    vinVerified: item.vinVerified,
    sellerVerified: item.sellerVerified,
    mediaComplete: item.mediaComplete,
    priceInsight: (item.priceInsight as ListingCardData["priceInsight"]) ?? "market_rate",
    mileageFlagSeverity: item.mileageFlagSeverity as ListingCardData["mileageFlagSeverity"],
    planType: item.planType as ListingCardData["planType"],
    listingKind: item.listingKind === "part" ? "part" : "vehicle"
  };
}

async function fileToDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Şəkil oxuna bilmədi"));
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Şəkil oxuna bilmədi"));
    };
    reader.readAsDataURL(file);
  });
}

export function AiChatPanel() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [limitExceeded, setLimitExceeded] = useState(false);
  const [imageSearching, setImageSearching] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    fetch("/api/ai/chat")
      .then((r) => r.json())
      .then((d) => d.ok && d.remaining !== undefined && setRemaining(d.remaining));
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const msg = input.trim();
    if (!msg || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setLoading(true);
    setLimitExceeded(false);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg })
      });
      const data = (await res.json()) as {
        ok: boolean;
        message?: string;
        listings?: unknown[];
        remaining?: number;
        error?: string;
        limitExceeded?: boolean;
      };

      if (data.limitExceeded) setLimitExceeded(true);
      if (data.remaining !== undefined) setRemaining(data.remaining);

      if (data.ok && data.message) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.message!,
            listings: Array.isArray(data.listings)
              ? data.listings.map((l) => toCardData(l as Parameters<typeof toCardData>[0]))
              : undefined
          }
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.error || "Xəta baş verdi. Yenidən cəhd edin."
          }
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Bağlantı xətası. Yenidən cəhd edin." }
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleImageSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || imageSearching || loading) return;

    setImageSearching(true);
    setLimitExceeded(false);
    try {
      const dataUrl = await fileToDataUrl(file);
      setMessages((prev) => [
        ...prev,
        { role: "user", content: "📷 Şəkillə axtarış", imagePreviewUrl: dataUrl }
      ]);

      const res = await fetch("/api/ai/search-by-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl: dataUrl })
      });
      const data = (await res.json()) as {
        ok: boolean;
        listings?: unknown[];
        resultHref?: string;
        remaining?: number;
        error?: string;
        limitExceeded?: boolean;
      };

      if (data.limitExceeded) setLimitExceeded(true);
      if (data.remaining !== undefined) setRemaining(data.remaining);

      if (data.ok) {
        const listings = Array.isArray(data.listings)
          ? data.listings.map((l) => toCardData(l as Parameters<typeof toCardData>[0]))
          : [];
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              listings.length > 0
                ? `Şəklə əsasən ${listings.length} oxşar elan tapdım.`
                : "Şəklə uyğun elan tapılmadı, amma oxşar axtarış nəticələrinə baxa bilərsiniz.",
            listings,
            resultHref: data.resultHref
          }
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.error || "Şəkil analiz edilə bilmədi." }
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Şəkil yüklənərkən xəta baş verdi. Yenidən cəhd edin." }
      ]);
    } finally {
      setImageSearching(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#0057FF] text-white shadow-lg transition hover:bg-[#0046CC]"
        aria-label="AI köməkçi"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>

      {open && (
        <div className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] left-4 right-4 z-40 flex h-[28rem] w-auto flex-col overflow-hidden rounded-2xl border border-slate-900/10 bg-white/95 shadow-xl backdrop-blur-xl sm:left-auto sm:right-6 sm:h-[32rem] sm:w-[26rem]">
          <div className="flex items-center justify-between border-b border-slate-900/10 bg-[#0057FF] px-4 py-3">
            <span className="font-semibold text-slate-900">EkoMobil köməkçi</span>
            {remaining !== null && (
              <span className="text-xs text-slate-900">{remaining} sual qaldı</span>
            )}
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Bağla"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded text-slate-900 hover:bg-slate-900/20"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-8 text-sm text-slate-500">
                <p className="font-medium text-slate-700">Avtomobil və ehtiyyat hissəsi axtarışına kömək edə bilərəm.</p>
                <p className="mt-2">Məsələn:</p>
                <ul className="mt-2 space-y-1 text-left max-w-xs mx-auto">
                  <li>• &quot;25 min manata etibarlı Toyota&quot;</li>
                  <li>• &quot;Bakıda avtomat Hyundai&quot;</li>
                  <li>• &quot;Corolla üçün əyləc diski&quot;</li>
                </ul>
                <p className="mt-2">və ya 📷 düyməsi ilə şəkil yükləyib oxşar elan tapa bilərsiniz.</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
                {m.imagePreviewUrl && (
                  <img
                    src={m.imagePreviewUrl}
                    alt="Yüklənən şəkil"
                    className="ml-auto mb-1 h-20 w-20 rounded-xl object-cover border border-slate-900/10"
                  />
                )}
                <div
                  className={`inline-block max-w-[90%] rounded-2xl px-4 py-2 text-sm ${
                    m.role === "user"
                      ? "bg-[#0057FF] text-white"
                      : "bg-white/63 text-slate-900"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.content}</div>
                </div>
                {m.listings && m.listings.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {m.listings.slice(0, 3).map((l) => (
                      <Link
                        key={l.id}
                        href={`/listings/${l.id}`}
                        className="block rounded-xl border border-slate-900/10 bg-white/60 p-3 text-left transition hover:border-[#0057FF]/40 hover:shadow"
                      >
                        <div className="font-medium text-slate-900 truncate">{l.title}</div>
                        <div className="text-sm font-semibold text-[#0057FF]">
                          {l.priceAzn.toLocaleString()} ₼
                        </div>
                        <div className="text-xs text-slate-500">
                          {l.listingKind === "part" ? l.city : `${l.year} • ${l.mileageKm.toLocaleString()} km`}
                        </div>
                      </Link>
                    ))}
                    <Link
                      href={m.resultHref ?? "/listings"}
                      className="block text-center text-sm text-[#0057FF] hover:underline"
                    >
                      Bütün nəticələrə bax →
                    </Link>
                  </div>
                )}
              </div>
            ))}
            {(loading || imageSearching) && (
              <div className="flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "0ms" }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "150ms" }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: "300ms" }} />
              </div>
            )}
            {limitExceeded && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-700">
                Gündəlik limitə çatdınız. Sabah yenidən cəhd edin.
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="border-t border-slate-900/10 p-3">
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelected}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading || imageSearching || (remaining !== null && remaining <= 0)}
                title="Şəkillə axtar"
                aria-label="Şəkillə axtar"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-900/10 bg-white/60 text-slate-600 transition hover:border-[#0057FF]/40 hover:text-[#0057FF] disabled:opacity-50"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 17a4 4 0 100-8 4 4 0 000 8z" />
                </svg>
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Nə axtarırsınız?"
                disabled={loading || imageSearching || (remaining !== null && remaining <= 0)}
                className="flex-1 rounded-xl border border-slate-900/10 bg-white/60 px-4 py-2.5 text-base text-slate-900 outline-none focus:border-[#0057FF] disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || imageSearching || !input.trim() || (remaining !== null && remaining <= 0)}
                className="rounded-xl bg-[#0057FF] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#0046CC] disabled:opacity-50"
              >
                Göndər
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
