"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthSession } from "@/hooks/use-auth-session";

/** Elan yayımlama səhifələri — daxil olmayan istifadəçini login-ə yönləndirir */
export function useRequireAuth(returnPath: string) {
  const router = useRouter();
  const { user, isLoggedIn, loading } = useAuthSession();

  useEffect(() => {
    if (!loading && !isLoggedIn) {
      router.replace(`/login?next=${encodeURIComponent(returnPath)}`);
    }
  }, [isLoggedIn, loading, returnPath, router]);

  return { user, isLoggedIn, loading, ready: !loading && isLoggedIn };
}
