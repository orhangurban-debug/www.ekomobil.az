import Link from "next/link";
import { redirect } from "next/navigation";
import { SupportRequestForm } from "@/components/support/support-request-form";
import { PrivacyControls } from "@/components/user/privacy-controls";
import { getServerSessionUser } from "@/lib/auth";

export default async function MePrivacyPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login?next=/me/privacy");

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Məxfilik və məlumat hüquqları</h1>
          <p className="mt-1 text-sm text-slate-500">
            Hesab məlumatlarınız üzrə ixrac, düzəliş, silinmə və emala etiraz sorğularını bu səhifədən idarə edin.
          </p>
        </div>
        <Link href="/me" className="btn-secondary text-sm">
          Profile qayıt
        </Link>
      </div>

      <div className="space-y-6">
        <PrivacyControls />
        <SupportRequestForm
          initialRequestType="data_export"
          initialSubject="Məlumat hüquqları ilə bağlı əlavə sorğu"
        />
      </div>
    </div>
  );
}
