"use client";

import Link from "next/link";

interface ListingFloatingCtaProps {
  title: string;
  priceAzn: number;
  city: string;
  year: number;
  telPhone?: string;
  whatsappPhone?: string;
  isPart: boolean;
}

export function ListingFloatingCta({
  title,
  priceAzn,
  city,
  year,
  telPhone,
  whatsappPhone,
  isPart
}: ListingFloatingCtaProps) {
  return (
    <div className="floating-cta">
      <p className="line-clamp-1 text-xs font-medium uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-1 text-2xl font-bold text-[#0057FF]">
        {priceAzn.toLocaleString("az-AZ")} ₼
      </p>
      <p className="mt-0.5 text-xs text-slate-400">{city} • {year}</p>
      <div className="mt-4 space-y-2">
        {telPhone ? (
          <a href={`tel:${telPhone}`} className="btn-primary w-full justify-center py-2.5 flex text-sm">
            Əlaqə saxla
          </a>
        ) : (
          <Link href="#seller-contact" className="btn-primary w-full justify-center py-2.5 flex text-sm">
            Əlaqə saxla
          </Link>
        )}
        {whatsappPhone && (
          <a
            href={`https://wa.me/${whatsappPhone}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary w-full justify-center py-2.5 flex text-sm"
          >
            WhatsApp
          </a>
        )}
        {!isPart && telPhone && (
          <a href={`tel:${telPhone}`} className="btn-secondary w-full justify-center py-2.5 flex text-sm">
            Zəng et
          </a>
        )}
      </div>
    </div>
  );
}
