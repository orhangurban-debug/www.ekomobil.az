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
    <nav className="glass-panel sticky top-20 z-10 -mx-1 flex flex-wrap justify-center gap-2 px-3 py-3">
      {NAV_ITEMS.map((item) => {
        const id = item.href.slice(1);
        const isActive = activeId === id;
        return (
          <a
            key={item.href}
            href={item.href}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
              isActive
                ? "border-[#0057FF] bg-[#0057FF] text-white shadow-[0_4px_14px_rgba(0,87,255,0.35)]"
                : "border-white/10 bg-white/5 text-white/65 hover:-translate-y-0.5 hover:border-[#0057FF]/40 hover:text-[#0057FF]"
            }`}
          >
            {item.label}
          </a>
        );
      })}
    </nav>
  );
}
