"use client";

import { useState } from "react";
import Image from "next/image";

interface Props {
  urls: string[];
  title: string;
}

export function ListingGallery({ urls, title }: Props) {
  const [active, setActive] = useState(0);

  if (urls.length === 0) {
    return (
      <div className="card overflow-hidden">
        <div className="flex h-80 items-center justify-center bg-slate-100">
          <svg className="h-24 w-24 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 10h1l1-4h12l1 4h1a1 1 0 010 2h-.5M3 10a1 1 0 000 2h.5M6 14a2 2 0 104 0m4 0a2 2 0 104 0" />
          </svg>
        </div>
      </div>
    );
  }

  const mainUrl = urls[active] ?? urls[0];

  return (
    <div className="space-y-2">
      {/* Main image */}
      <div className="card overflow-hidden">
        <div className="relative h-80 bg-slate-100">
          <Image
            key={mainUrl}
            src={mainUrl}
            alt={title}
            fill
            unoptimized={mainUrl.startsWith("data:")}
            className="object-cover transition-opacity duration-200"
            sizes="(max-width: 1024px) 100vw, 66vw"
            priority
          />
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
                onClick={() => setActive((prev) => (prev - 1 + urls.length) % urls.length)}
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/60"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                aria-label="Növbəti şəkil"
                onClick={() => setActive((prev) => (prev + 1) % urls.length)}
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
                i === active ? "border-brand-500" : "border-slate-200 hover:border-slate-400"
              }`}
            >
              <Image
                src={url}
                alt={`${title} — ${i + 1}`}
                fill
                unoptimized={url.startsWith("data:")}
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
