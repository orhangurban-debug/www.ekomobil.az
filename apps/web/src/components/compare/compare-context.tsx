"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

interface CompareContextValue {
  ids: string[];
  toggle: (id: string) => void;
  clear: () => void;
}

const CompareContext = createContext<CompareContextValue | null>(null);

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    const raw = window.localStorage.getItem("ekomobil_compare_ids");
    if (!raw) return [];
    try {
      return JSON.parse(raw) as string[];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    window.localStorage.setItem("ekomobil_compare_ids", JSON.stringify(ids.slice(0, 4)));
  }, [ids]);

  const value = useMemo<CompareContextValue>(() => ({
    ids,
    toggle: (id: string) =>
      setIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id].slice(0, 4))),
    clear: () => setIds([])
  }), [ids]);

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) throw new Error("useCompare must be used inside CompareProvider");
  return context;
}
