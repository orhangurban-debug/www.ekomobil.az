import Link from "next/link";
import { redirect } from "next/navigation";
import { PlatformConsentForm } from "@/components/user/platform-consent-form";
import { getServerSessionUser } from "@/lib/auth";
import { hasRequiredPlatformConsents } from "@/server/user-consent-store";

export const metadata = {
  title: "Razılaşmalar | EkoMobil",
  description: "Platforma razılaşmalarını qəbul edin"
};

export default async function RegisterConsentPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");

  const hasConsent = await hasRequiredPlatformConsents(user.id);
  const params = await searchParams;
  const nextPath =
    typeof params.next === "string" && params.next.startsWith("/") && !params.next.startsWith("//")
      ? params.next
      : "/me";

  if (hasConsent) redirect(nextPath);

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-slate-900">Son addım: razılaşmalar</h1>
        <p className="mt-2 text-slate-500">Davam etmək üçün platforma qaydalarını qəbul edin</p>
      </div>
      <PlatformConsentForm nextPath={nextPath} source="oauth" />
      <p className="mt-6 text-center text-sm text-slate-500">
        <Link href="/legal" className="text-[#0057FF] hover:underline">
          Hüquqi məlumat və fırıldaqçılıqla mübarizə siyasəti
        </Link>
      </p>
    </div>
  );
}
