"use client";

import { useEffect, useRef, useState } from "react";

const NAV_ITEMS = [
  { href: "#listings", label: "Elan planları" },
  { href: "#boost", label: "İrəlilətmə" },
  { href: "#dealer", label: "Salonlar" },
  { href: "#parts-store", label: "Hissə mağazası" },
  { href: "#services", label: "Servislər" },
  { href: "#auction", label: "Auksion haqları" }
];

const SECTION_IDS = NAV_ITEMS.map((item) => item.href.slice(1));

export function PricingNav() {
  const [activeId, setActiveId] = useState<string>(SECTION_IDS[0]);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const handleIntersect: IntersectionObserverCallback = (entries) => {
      // Find the topmost visible section
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

      if (visible.length > 0) {
        setActiveId(visible[0].target.id);
      }
    };

    observerRef.current = new IntersectionObserver(handleIntersect, {
      rootMargin: "-20% 0px -60% 0px",
      threshold: 0
    });

    SECTION_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <nav className="sticky top-20 z-10 -mx-1 flex flex-wrap justify-center gap-2 rounded-2xl border border-slate-200/80 bg-white/90 px-3 py-3 shadow-sm backdrop-blur">
      {NAV_ITEMS.map((item) => {
        const id = item.href.slice(1);
        const isActive = activeId === id;
        return (
          <a
            key={item.href}
            href={item.href}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium shadow-sm transition-all duration-200 ${
              isActive
                ? "border-[#0891B2] bg-[#0891B2] text-white shadow-[#0891B2]/20"
                : "border-slate-200 bg-white text-slate-600 hover:-translate-y-0.5 hover:border-[#0891B2]/40 hover:text-[#0891B2]"
            }`}
          >
            {item.label}
          </a>
        );
      })}
    </nav>
  );
}
