"use client";

import { useState } from "react";

const PROVIDER_TYPES = [
  { value: "inspection_company", label: "Ekspertiza şirkəti" },
  { value: "official_service", label: "Rəsmi servis mərkəzi" },
  { value: "dealer_service", label: "Diler servis mərkəzi" },
  { value: "other", label: "Digər" }
] as const;

export function InspectionPartnerApplicationForm() {
  const [providerType, setProviderType] = useState<(typeof PROVIDER_TYPES)[number]["value"]>("inspection_company");
  const [companyName, setCompanyName] = useState("");
  const [city, setCity] = useState("");
  const [services, setServices] = useState("");
  const [licenseInfo, setLicenseInfo] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!companyName.trim() || !contactName.trim() || !email.trim() || !phone.trim()) {
      setIsError(true);
      setFeedback("Şirkət adı, əlaqə şəxsi, email və telefon mütləqdir.");
      return;
    }

    const typeLabel = PROVIDER_TYPES.find((item) => item.value === providerType)?.label ?? providerType;
    const subject = `[Inspection Partner] ${companyName.trim()} • ${typeLabel}`;
    const message = [
      `Provider type: ${typeLabel}`,
      `Company name: ${companyName.trim()}`,
      `City: ${city.trim() || "-"}`,
      `Services: ${services.trim() || "-"}`,
      `License/certification: ${licenseInfo.trim() || "-"}`,
      `Contact person: ${contactName.trim()}`,
      `Email: ${email.trim()}`,
      `Phone: ${phone.trim()}`,
      `Additional notes: ${notes.trim() || "-"}`
    ].join("\n");

    setSubmitting(true);
    setFeedback(null);
    setIsError(false);
    try {
      const response = await fetch("/api/support/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestType: "inspection_partner",
          subject,
          message,
          name: contactName.trim(),
          email: email.trim(),
          phone: phone.trim()
        })
      });
      const payload = (await response.json()) as { ok: boolean; error?: string; message?: string };
      if (!response.ok || !payload.ok) {
        setIsError(true);
        setFeedback(payload.error ?? "Müraciət göndərilə bilmədi.");
        return;
      }
      setIsError(false);
      setFeedback("Müraciət qəbul edildi. Tərəfdaşlıq komandamız sizinlə əlaqə saxlayacaq.");
      setCompanyName("");
      setCity("");
      setServices("");
      setLicenseInfo("");
      setContactName("");
      setEmail("");
      setPhone("");
      setNotes("");
      setProviderType("inspection_company");
    } catch {
      setIsError(true);
      setFeedback("Server xətası baş verdi. Yenidən cəhd edin.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Ekspertiza və rəsmi servis partnyor qeydiyyatı</h2>
      <p className="mt-2 text-sm text-slate-600">
        Platformaya qoşulub yoxlama xidmətlərinizi təqdim etmək üçün formu doldurun. Müraciətlər ops/admin komandasına
        birbaşa düşür və yoxlanışdan sonra əlaqə saxlanılır.
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mərkəz tipi</span>
          <select className="input-field" value={providerType} onChange={(e) => setProviderType(e.target.value as typeof providerType)}>
            {PROVIDER_TYPES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Şirkət adı</span>
          <input className="input-field" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Məs: AutoCheck MMC" />
        </label>

        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Şəhər</span>
          <input className="input-field" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Bakı" />
        </label>

        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Əlaqə şəxsi</span>
          <input className="input-field" value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Ad Soyad" />
        </label>

        <label className="space-y-1 md:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Xidmətlər</span>
          <textarea
            className="input-field min-h-24"
            value={services}
            onChange={(e) => setServices(e.target.value)}
            placeholder="Məs: 220 bənd yoxlama, boya ölçümü, ECU diaqnostika, yol testi, rəsmi raport"
          />
        </label>

        <label className="space-y-1 md:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Lisenziya / sertifikasiya məlumatı</span>
          <input
            className="input-field"
            value={licenseInfo}
            onChange={(e) => setLicenseInfo(e.target.value)}
            placeholder="Məs: ISO, servis akkreditasiyası, qeydiyyat nömrəsi"
          />
        </label>

        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</span>
          <input className="input-field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="info@company.az" />
        </label>

        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Telefon</span>
          <input className="input-field" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+994..." />
        </label>

        <label className="space-y-1 md:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Əlavə qeydlər</span>
          <textarea
            className="input-field min-h-20"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Filiallar, iş saatları, SLA və s."
          />
        </label>
      </div>

      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
        Qeyd: EkoMobil tərəfdaş yoxlama mərkəzlərini platformada göstərsə də, konkret texniki diaqnostika nəticəsinə görə
        hüquqi zəmanət vermir.
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "Göndərilir..." : "Partnyor müraciəti göndər"}
        </button>
        {feedback && <span className={`text-sm ${isError ? "text-rose-600" : "text-emerald-700"}`}>{feedback}</span>}
      </div>
    </form>
  );
}
