import Link from "next/link";
import type { Metadata } from "next";
import { InspectionPartnerApplicationForm } from "@/components/partners/inspection-partner-application-form";

export const metadata: Metadata = {
  title: "Ekspertiza və rəsmi servis tərəfdaşlığı | EkoMobil",
  description:
    "Ekspertiza şirkətləri və rəsmi servis mərkəzləri EkoMobil platformasında qeydiyyatdan keçib yoxlama xidmətləri təqdim edə bilər."
};

export default function InspectionPartnersPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <nav className="mb-6 text-sm text-slate-500">
        <Link href="/" className="hover:text-slate-900">
          Ana səhifə
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-900">Ekspertiza tərəfdaşlığı</span>
      </nav>

      <h1 className="text-3xl font-bold text-slate-900">Ekspertiza və rəsmi servis tərəfdaşlığı</h1>
      <p className="mt-2 text-sm text-slate-600">
        Platformada etibarlı yoxlama ekosistemi qurmaq üçün ekspertiza şirkətləri və rəsmi servis mərkəzlərini tərəfdaş
        kimi qəbul edirik.
      </p>

      <div className="mt-6 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700 md:grid-cols-3">
        <div>
          <div className="font-semibold text-slate-900">Nə qazanırsınız?</div>
          <p className="mt-1 text-xs">Platformada görünürlük, yeni müştəri axını və yoxlama nəticələrinin rəqəmsal paylaşımı.</p>
        </div>
        <div>
          <div className="font-semibold text-slate-900">Biz nə yoxlayırıq?</div>
          <p className="mt-1 text-xs">Mərkəz məlumatı, əlaqə, xidmət spektri, sertifikasiya/lisenziya və reputasiya uyğunluğu.</p>
        </div>
        <div>
          <div className="font-semibold text-slate-900">Hüquqi model</div>
          <p className="mt-1 text-xs">EkoMobil infrastruktur tərəfidir; texniki diaqnostika nəticəsinə birbaşa zəmanət vermir.</p>
        </div>
      </div>

      <div className="mt-6">
        <InspectionPartnerApplicationForm />
      </div>
    </div>
  );
}
