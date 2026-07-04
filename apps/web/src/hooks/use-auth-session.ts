"use client";

import { useEffect, useState } from "react";

export interface AuthSessionUser {
  id: string;
  email: string;
  role: string;
}

export function useAuthSession() {
  const [user, setUser] = useState<AuthSessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => res.json())
      .then((data: { ok: boolean; user?: AuthSessionUser | null }) => {
        if (cancelled || !data.ok) return;
        setUser(data.user ?? null);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { user, loading, isLoggedIn: Boolean(user) };
}
