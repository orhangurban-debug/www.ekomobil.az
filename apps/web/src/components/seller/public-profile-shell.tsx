import Image from "next/image";
import type { ReactNode } from "react";
import type { TrustBadge } from "@/lib/seller-trust";
import type { PublicProfileKind } from "@/lib/seller-trust";
import { isShareableMapUrl, normalizeMapUrl } from "@/lib/business-branches";
import {
  BusinessBranchesDisplay,
  type BusinessLocationCard
} from "@/components/business/business-branches-display";
import { PublicTrustSummary } from "@/components/seller/trust-badges";

const TYPE_LABEL: Record<PublicProfileKind, string> = {
  store: "Mağaza",
  dealer: "Salon",
  private: "Fərdi satıcı"
};

function formatMemberSince(iso: string | null | undefined): string {
  if (!iso) return "Məlum deyil";
  return new Date(iso).toLocaleDateString("az-AZ", { year: "numeric", month: "long" });
}

function digitsOnly(phone: string): string {
  return phone.replace(/[^\d]/g, "");
}

function telHref(phone: string): string {
  const digits = digitsOnly(phone);
  if (!digits) return `tel:${phone}`;
  return phone.trim().startsWith("+") ? `tel:+${digits}` : `tel:${digits}`;
}

/** Hide empty or placeholder bios that hurt professional appearance. */
export function isMeaningfulDescription(text: string | null | undefined): boolean {
  const value = text?.trim() ?? "";
  if (value.length < 12) return false;
  const weak = new Set(["sahibkar", "satıcı", "magaza", "mağaza", "salon", "dealer", "store"]);
  return !weak.has(value.toLowerCase());
}

function ProfileAvatar({
  name,
  logoUrl,
  avatarUrl
}: {
  name: string;
  logoUrl?: string | null;
  avatarUrl?: string | null;
}) {
  const imgUrl = logoUrl ?? avatarUrl;
  const initials = name
    .split(" ")
    .map((w) => w[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (imgUrl) {
    return (
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl ring-4 ring-white shadow-md sm:h-24 sm:w-24">
        <Image src={imgUrl} alt={name} fill className="object-cover" sizes="96px" />
      </div>
    );
  }

  return (
    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-[#0057FF] text-2xl font-bold text-white shadow-md ring-4 ring-white sm:h-24 sm:w-24">
      {initials || "EK"}
    </div>
  );
}

export interface PublicProfileShellProps {
  name: string;
  profileKind: PublicProfileKind;
  verified?: boolean;
  city?: string | null;
  memberSince?: string | null;
  coverUrl?: string | null;
  logoUrl?: string | null;
  avatarUrl?: string | null;
  description?: string | null;
  phone?: string | null;
  whatsappPhone?: string | null;
  websiteUrl?: string | null;
  showWhatsapp?: boolean;
  showWebsite?: boolean;
  workingHours?: string | null;
  address?: string | null;
  mapUrl?: string | null;
  locations?: BusinessLocationCard[];
  trustBadges: TrustBadge[];
  listingCount: number;
  /** Extra chips under identity (e.g. SLA) */
  metaChips?: ReactNode;
  children: ReactNode;
}

export function PublicProfileShell({
  name,
  profileKind,
  verified = false,
  city,
  memberSince,
  coverUrl,
  logoUrl,
  avatarUrl,
  description,
  phone,
  whatsappPhone,
  websiteUrl,
  showWhatsapp = false,
  showWebsite = false,
  workingHours,
  address,
  mapUrl,
  locations = [],
  trustBadges,
  listingCount,
  metaChips,
  children
}: PublicProfileShellProps) {
  const callPhone = phone?.trim() || (showWhatsapp ? whatsappPhone?.trim() : "") || "";
  const waPhone = showWhatsapp ? whatsappPhone?.trim() || phone?.trim() || "" : "";
  const mapHref = mapUrl && isShareableMapUrl(mapUrl) ? normalizeMapUrl(mapUrl) : undefined;
  const about = isMeaningfulDescription(description) ? description!.trim() : null;
  const showLocations = locations.length > 0;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Cover */}
      <div className="relative h-36 w-full overflow-hidden sm:h-44">
        {coverUrl ? (
          <>
            <Image
              src={coverUrl}
              alt=""
              fill
              className="object-cover object-center"
              sizes="100vw"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/45 via-slate-900/10 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-700 to-[#003d99]">
            <div
              className="absolute inset-0 opacity-[0.12]"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 15% 40%, white 1px, transparent 1px), radial-gradient(circle at 85% 25%, white 1px, transparent 1px)",
                backgroundSize: "36px 36px"
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 to-transparent" />
          </div>
        )}
      </div>

      {/* Identity + CTAs */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="-mt-10 flex flex-col gap-5 pb-6 sm:-mt-12 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <ProfileAvatar name={name} logoUrl={logoUrl} avatarUrl={avatarUrl} />
              <div className="min-w-0 pb-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                    {name}
                  </h1>
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                      profileKind === "store"
                        ? "bg-slate-900 text-white"
                        : profileKind === "dealer"
                          ? "bg-[#0057FF] text-white"
                          : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {TYPE_LABEL[profileKind]}
                  </span>
                  {verified && (
                    <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Təsdiqlənmiş
                    </span>
                  )}
                </div>

                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                  {city && (
                    <span className="inline-flex items-center gap-1">
                      <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                      {city}
                    </span>
                  )}
                  <span>Üzv: {formatMemberSince(memberSince)}</span>
                  {metaChips}
                </div>

                {(workingHours || address || mapHref) && (
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                    {workingHours && <span>{workingHours}</span>}
                    {address && <span>{address}</span>}
                    {mapHref && (
                      <a
                        href={mapHref}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-[#0057FF] hover:underline"
                      >
                        Xəritədə aç
                      </a>
                    )}
                  </div>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  {callPhone && (
                    <a
                      href={telHref(callPhone)}
                      className="inline-flex items-center justify-center rounded-lg bg-[#0057FF] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0046CC]"
                    >
                      Zəng et
                    </a>
                  )}
                  {waPhone && (
                    <a
                      href={`https://wa.me/${digitsOnly(waPhone)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
                    >
                      WhatsApp
                    </a>
                  )}
                  {showWebsite && websiteUrl && (
                    <a
                      href={websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Vebsayt
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-stretch gap-4 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 sm:min-w-[220px]">
              <div className="text-center">
                <p className="text-2xl font-bold tabular-nums text-slate-900">{listingCount}</p>
                <p className="text-[11px] text-slate-500">Aktiv elan</p>
              </div>
              {trustBadges.length > 0 && (
                <div className="flex-1 border-l border-slate-200 pl-4">
                  <PublicTrustSummary badges={trustBadges} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {about && (
          <section>
            <h2 className="mb-2 text-sm font-semibold text-slate-900">Haqqında</h2>
            <p className="max-w-3xl text-sm leading-relaxed text-slate-600">{about}</p>
          </section>
        )}

        {showLocations && (
          <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
            <BusinessBranchesDisplay locations={locations} />
          </section>
        )}

        {children}
      </div>
    </div>
  );
}
