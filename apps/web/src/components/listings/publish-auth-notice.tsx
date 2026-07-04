import Link from "next/link";

/** Yalnız auth gate yüklənərkən göstərilir — elan yayımlamaq üçün daxil olmaq mütləqdir */
export function PublishAuthGate({ loading }: { loading?: boolean }) {
  if (!loading) return null;

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0057FF] border-t-transparent" />
      <p className="mt-4 text-sm text-slate-500">Hesab yoxlanılır…</p>
    </div>
  );
}

export function PublishLoginRequired({ returnPath }: { returnPath: string }) {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-slate-900/10 bg-white p-6 text-center shadow-sm">
      <p className="text-lg font-semibold text-slate-900">Elan yerləşdirmək üçün daxil olun</p>
      <p className="mt-2 text-sm text-slate-600">
        Qeydiyyatdan keçmiş istifadəçilər elan yarada bilər.
      </p>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Link href={`/login?next=${encodeURIComponent(returnPath)}`} className="btn-primary justify-center px-5 py-2.5 text-sm">
          Daxil ol
        </Link>
        <Link href={`/register?next=${encodeURIComponent(returnPath)}`} className="btn-secondary justify-center px-5 py-2.5 text-sm">
          Qeydiyyat
        </Link>
      </div>
    </div>
  );
}
