"use client";

import { useState } from "react";

interface Entitlements {
  canUseDescription: boolean;
  canUseLogo: boolean;
  canUseCover: boolean;
  canUseWhatsapp: boolean;
  canUseWebsite: boolean;
  canUseAddress: boolean;
  canUseWorkingHours: boolean;
}

interface ProfileState {
  name: string;
  city: string;
  logoUrl?: string;
  coverUrl?: string;
  description?: string;
  whatsappPhone?: string;
  websiteUrl?: string;
  address?: string;
  workingHours?: string;
  showWhatsapp: boolean;
  showWebsite: boolean;
}

export function DealerProfileSettingsForm({
  initialProfile,
  entitlements
}: {
  initialProfile: ProfileState;
  entitlements: Entitlements;
}) {
  const [profile, setProfile] = useState<ProfileState>(initialProfile);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/dealer/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile)
      });
      const payload = (await response.json()) as { ok: boolean; error?: string; profile?: ProfileState };
      if (!response.ok || !payload.ok || !payload.profile) {
        setMessage(payload.error ?? "Profil yadda saxlanmadı.");
        return;
      }
      setProfile(payload.profile);
      setMessage("Profil uğurla yeniləndi.");
    } catch {
      setMessage("Profil yadda saxlanmadı.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card p-5">
      <h2 className="text-base font-semibold text-slate-900">Salon/Mağaza profil ayarları</h2>
      <p className="mt-1 text-xs text-slate-500">
        Bəzi sahələr planınıza görə açılır. Public profildə yalnız aktiv icazə sahələri görünür.
      </p>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ad</span>
          <input className="input-field" value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Şəhər</span>
          <input className="input-field" value={profile.city} onChange={(e) => setProfile((p) => ({ ...p, city: e.target.value }))} />
        </label>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Loqo URL</span>
          <input
            className="input-field"
            disabled={!entitlements.canUseLogo}
            value={profile.logoUrl ?? ""}
            onChange={(e) => setProfile((p) => ({ ...p, logoUrl: e.target.value }))}
            placeholder="https://..."
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cover URL</span>
          <input
            className="input-field"
            disabled={!entitlements.canUseCover}
            value={profile.coverUrl ?? ""}
            onChange={(e) => setProfile((p) => ({ ...p, coverUrl: e.target.value }))}
            placeholder={entitlements.canUseCover ? "https://..." : "Korporativ/Şəbəkə plan"}
          />
        </label>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">WhatsApp nömrəsi</span>
          <input
            className="input-field"
            disabled={!entitlements.canUseWhatsapp}
            value={profile.whatsappPhone ?? ""}
            onChange={(e) => setProfile((p) => ({ ...p, whatsappPhone: e.target.value }))}
            placeholder={entitlements.canUseWhatsapp ? "+994..." : "Peşəkar plan+"}
          />
          <label className="mt-1 inline-flex items-center gap-2 text-xs text-slate-500">
            <input
              type="checkbox"
              checked={profile.showWhatsapp}
              disabled={!entitlements.canUseWhatsapp}
              onChange={(e) => setProfile((p) => ({ ...p, showWhatsapp: e.target.checked }))}
            />
            Public profildə WhatsApp düyməsini göstər
          </label>
        </label>
        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Website URL</span>
          <input
            className="input-field"
            disabled={!entitlements.canUseWebsite}
            value={profile.websiteUrl ?? ""}
            onChange={(e) => setProfile((p) => ({ ...p, websiteUrl: e.target.value }))}
            placeholder={entitlements.canUseWebsite ? "https://..." : "Peşəkar plan+"}
          />
          <label className="mt-1 inline-flex items-center gap-2 text-xs text-slate-500">
            <input
              type="checkbox"
              checked={profile.showWebsite}
              disabled={!entitlements.canUseWebsite}
              onChange={(e) => setProfile((p) => ({ ...p, showWebsite: e.target.checked }))}
            />
            Public profildə website linkini göstər
          </label>
        </label>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ünvan</span>
          <input
            className="input-field"
            disabled={!entitlements.canUseAddress}
            value={profile.address ?? ""}
            onChange={(e) => setProfile((p) => ({ ...p, address: e.target.value }))}
            placeholder={entitlements.canUseAddress ? "Salon/mağaza ünvanı" : "Korporativ/Şəbəkə plan"}
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">İş saatları</span>
          <input
            className="input-field"
            disabled={!entitlements.canUseWorkingHours}
            value={profile.workingHours ?? ""}
            onChange={(e) => setProfile((p) => ({ ...p, workingHours: e.target.value }))}
            placeholder={entitlements.canUseWorkingHours ? "B.e-B.ş 10:00-19:00" : "Peşəkar plan+"}
          />
        </label>
      </div>

      <label className="mt-4 block space-y-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Təsvir</span>
        <textarea
          className="input-field min-h-[96px]"
          disabled={!entitlements.canUseDescription}
          value={profile.description ?? ""}
          onChange={(e) => setProfile((p) => ({ ...p, description: e.target.value }))}
          placeholder="Salon/mağaza haqqında qısa məlumat"
        />
      </label>

      <div className="mt-4 flex items-center gap-3">
        <button type="button" className="btn-primary" disabled={saving} onClick={save}>
          {saving ? "Yadda saxlanılır..." : "Profili yenilə"}
        </button>
        {message && <span className="text-sm text-slate-600">{message}</span>}
      </div>
    </div>
  );
}
