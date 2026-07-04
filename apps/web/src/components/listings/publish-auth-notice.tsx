import Link from "next/link";

export function PublishAuthNotice({
  isLoggedIn,
  loading,
  className = ""
}: {
  isLoggedIn: boolean;
  loading?: boolean;
  className?: string;
}) {
  if (loading || isLoggedIn) return null;

  return (
    <div
      className={`rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50/90 to-white px-4 py-4 text-sm text-amber-950 sm:px-5 ${className}`}
    >
      <p className="font-semibold text-amber-900">Hesab lazım deyil — hazırlıq üçün</p>
      <p className="mt-1 text-sm leading-relaxed text-amber-800/90">
        Şəkil yükləyib <strong>AI ilə doldur</strong> edə bilərsiniz. Yayımlamaq üçün son addımda daxil olun.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link href="/login?next=/publish" className="btn-primary px-4 py-2 text-xs">
          Daxil ol
        </Link>
        <Link href="/register?next=/publish" className="btn-secondary px-4 py-2 text-xs">
          Qeydiyyat
        </Link>
      </div>
    </div>
  );
}
