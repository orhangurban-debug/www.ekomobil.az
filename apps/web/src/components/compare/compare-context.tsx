"use client";

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";

interface CompareContextValue {
  ids: string[];
  toggle: (id: string) => void;
  clear: () => void;
}

const CompareContext = createContext<CompareContextValue | null>(null);

const STORAGE_KEY = "ekomobil_compare_ids";
const MAX_COMPARE = 4;

// Modul səviyyəli xarici store — localStorage ilə sinxron saxlanılır və
// useSyncExternalStore üçün stabil snapshot təqdim edir (effektdə setState problemi yoxdur).
let snapshot: string[] = [];
const serverSnapshot: string[] = [];
const listeners = new Set<() => void>();
let hydrated = false;

function emit() {
  for (const listener of listeners) listener();
}

function hydrateOnce() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        snapshot = (parsed as string[]).filter((item) => typeof item === "string").slice(0, MAX_COMPARE);
      }
    }
  } catch {
    // korlanmış storage — default boş siyahı
  }
}

function persist(next: string[]) {
  snapshot = next.slice(0, MAX_COMPARE);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // storage yazıla bilmədi — yalnız yaddaşda saxlanılır
  }
  emit();
}

function subscribe(listener: () => void) {
  hydrateOnce();
  listeners.add(listener);
  // Hidrasiyadan sonra dəyər dəyişmiş ola bilər — dərhal bildir.
  listener();
  return () => {
    listeners.delete(listener);
  };
}

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const ids = useSyncExternalStore(subscribe, () => snapshot, () => serverSnapshot);

  const value = useMemo<CompareContextValue>(
    () => ({
      ids,
      toggle: (id: string) => {
        const next = snapshot.includes(id)
          ? snapshot.filter((item) => item !== id)
          : [...snapshot, id];
        persist(next);
      },
      clear: () => persist([])
    }),
    [ids]
  );

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) throw new Error("useCompare must be used inside CompareProvider");
  return context;
}
