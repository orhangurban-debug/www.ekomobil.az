"use client";

import { useState } from "react";
import { ListingPhoto } from "@/components/listings/listing-photo";

interface Props {
  urls: string[];
  title: string;
  fit?: "cover" | "contain";
}

export function ListingGallery({ urls, title, fit = "cover" }: Props) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  if (urls.length === 0) {
    return (
      <div className="card overflow-hidden">
        <div className="flex h-80 items-center justify-center bg-white/60">
          <svg className="h-24 w-24 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 10h1l1-4h12l1 4h1a1 1 0 010 2h-.5M3 10a1 1 0 000 2h.5M6 14a2 2 0 104 0m4 0a2 2 0 104 0" />
          </svg>
        </div>
      </div>
    );
  }

  const mainUrl = urls[active] ?? urls[0];

  return (
    <div className="space-y-2">
      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={() => setLightbox(false)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            onClick={() => setLightbox(false)}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          {urls.length > 1 && (
            <button type="button" onClick={(e) => { e.stopPropagation(); setActive((prev) => (prev - 1 + urls.length) % urls.length); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
            </button>
          )}
          <div className="max-h-[90vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={mainUrl} alt={title} className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain shadow-2xl" />
          </div>
          {urls.length > 1 && (
            <button type="button" onClick={(e) => { e.stopPropagation(); setActive((prev) => (prev + 1) % urls.length); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
            </button>
          )}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white/60">{active + 1} / {urls.length}</div>
        </div>
      )}

      {/* Main image */}
      <div className="card overflow-hidden">
        <div
          className={`relative h-80 cursor-zoom-in ${fit === "contain" ? "bg-slate-50" : "bg-white/60"}`}
          onClick={() => setLightbox(true)}
          title="Böyüt"
        >
          <ListingPhoto
            key={mainUrl}
            src={mainUrl}
            alt={title}
            fill
            className={`${fit === "contain" ? "object-contain p-2" : "object-cover"} transition-opacity duration-200`}
            sizes="(max-width: 1024px) 100vw, 66vw"
            priority
          />
          {/* Expand hint */}
          <div className="absolute right-3 top-3 rounded-full bg-black/40 p-1.5 text-white opacity-60 hover:opacity-100">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"/>
            </svg>
          </div>
          {urls.length > 1 && (
            <div className="absolute bottom-3 right-3 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white">
              {active + 1} / {urls.length}
            </div>
          )}
          {/* Prev / Next arrows */}
          {urls.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Əvvəlki şəkil"
                onClick={(e) => { e.stopPropagation(); setActive((prev) => (prev - 1 + urls.length) % urls.length); }}
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/60"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                aria-label="Növbəti şəkil"
                onClick={(e) => { e.stopPropagation(); setActive((prev) => (prev + 1) % urls.length); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/60"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Thumbnails */}
      {urls.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {urls.map((url, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              className={`relative h-20 w-28 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                i === active ? "border-[#0057FF]" : "border-slate-900/10 hover:border-slate-900/25"
              }`}
            >
              <ListingPhoto
                src={url}
                alt={`${title} — ${i + 1}`}
                fill
                showWatermark={false}
                className="object-cover"
                sizes="112px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
