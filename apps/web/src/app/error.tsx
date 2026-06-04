"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Render error boundary:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="max-w-md">
        <h1 className="text-2xl font-bold text-slate-900">Nəsə düz getmədi</h1>
        <p className="mt-3 text-slate-500">
          Səhifə yüklənərkən gözlənilməz xəta baş verdi. Bir az sonra yenidən cəhd edin.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button onClick={() => reset()} className="btn-primary">
            Yenidən cəhd et
          </button>
          <Link href="/" className="btn-secondary">
            Ana səhifə
          </Link>
        </div>
      </div>
    </div>
  );
}
