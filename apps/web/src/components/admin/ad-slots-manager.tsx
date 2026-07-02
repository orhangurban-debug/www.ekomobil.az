"use client";

import { useMemo, useState } from "react";
import type { AdCampaign, AdSlotItem, AdSlotsConfig } from "@/lib/ad-slots-config";
import { computeAdCampaignStatus } from "@/lib/ad-slots-config";
import { AdminReadOnlyBanner } from "@/components/admin/admin-read-only-banner";
import { AdminImageUpload } from "@/components/admin/admin-image-upload";

interface Props {
  initial: AdSlotsConfig;
  readOnly?: boolean;
}

const PAGE_LABELS: Record<AdSlotItem["page"], string> = {
  home: "Ana səhifə",
  listings: "Elanlar",
  parts: "Mağaza",
  global: "Ümumi"
};

function emptyCustom(): NonNullable<AdSlotItem["customContent"]> {
  return {
    logoText: "AD",
    headline: "",
    sub: "",
    cta: "Ətraflı",
    href: "/",
    accent: "#0057FF"
  };
}

function emptyCampaign(): AdCampaign {
  return {
    advertiserName: "",
    imageUrl: "",
    linkUrl: "",
    budgetAzn: 0,
    dailyRateAzn: 0,
    startDate: new Date().toISOString().slice(0, 10),
    active: false
  };
}

const CAMPAIGN_STATE_META: Record<string, { label: string; cls: string }> = {
  live: { label: "Efirdə", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  scheduled: { label: "Planlanıb", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  expired: { label: "Müddəti bitib", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  paused: { label: "Dayandırılıb", cls: "bg-slate-100 text-slate-600 border-slate-200" },
  not_configured: { label: "Tamamlanmayıb", cls: "bg-slate-100 text-slate-500 border-slate-200" }
};

export function AdSlotsManager({ initial, readOnly = false }: Props) {
  const [config, setConfig] = useState<AdSlotsConfig>(initial);
  const [expandedId, setExpandedId] = useState<string | null>(initial.slots[0]?.id ?? null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<string, AdSlotItem[]>();
    for (const slot of config.slots) {
      const key = slot.page;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(slot);
    }
    return map;
  }, [config.slots]);

  const pricingSummary = useMemo(
    () =>
      config.slots
        .filter((s) => s.enabled)
        .reduce((sum, s) => sum + s.priceAznPerMonth, 0),
    [config.slots]
  );

  function updateSlot(id: string, patch: Partial<AdSlotItem>) {
    setConfig((prev) => ({
      ...prev,
      slots: prev.slots.map((slot) => (slot.id === id ? { ...slot, ...patch } : slot))
    }));
  }

  function updateCustom(id: string, patch: Partial<NonNullable<AdSlotItem["customContent"]>>) {
    setConfig((prev) => ({
      ...prev,
      slots: prev.slots.map((slot) =>
        slot.id === id
          ? {
              ...slot,
              customContent: { ...(slot.customContent ?? emptyCustom()), ...patch }
            }
          : slot
      )
    }));
  }

  function updateCampaign(id: string, patch: Partial<AdCampaign>) {
    setConfig((prev) => ({
      ...prev,
      slots: prev.slots.map((slot) =>
        slot.id === id
          ? { ...slot, campaign: { ...(slot.campaign ?? emptyCampaign()), ...patch } }
          : slot
      )
    }));
  }

  async function save() {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/ad-slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      });
      const data = (await response.json()) as { ok: boolean; config?: AdSlotsConfig; error?: string };
      if (!response.ok || !data.ok || !data.config) {
        setMessage(data.error ?? "Saxlama uğursuz oldu.");
        return;
      }
      setConfig(data.config);
      setMessage("Reklam slotları uğurla saxlanıldı.");
    } catch {
      setMessage("Şəbəkə xətası — yenidən cəhd edin.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {readOnly && <AdminReadOnlyBanner />}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Aktiv slotlar</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {config.slots.filter((s) => s.enabled).length}
            <span className="text-base font-normal text-slate-400"> / {config.slots.length}</span>
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Paket qiyməti (aktiv)</p>
          <p className="mt-1 text-2xl font-bold text-[#0891B2]">{pricingSummary.toLocaleString("az-AZ")} ₼</p>
          <p className="text-xs text-slate-400">aylıq, bütün aktiv slotlar</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Əlaqə</p>
          <input
            type="email"
            disabled={readOnly}
            value={config.contactEmail}
            onChange={(e) => setConfig((prev) => ({ ...prev, contactEmail: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 disabled:bg-slate-50"
            placeholder="reklam@ekomobil.az"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-slate-900">Qiymət şərtləri</h3>
        <textarea
          disabled={readOnly}
          value={config.pricingNotes}
          onChange={(e) => setConfig((prev) => ({ ...prev, pricingNotes: e.target.value }))}
          rows={3}
          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 disabled:bg-slate-50"
        />
      </div>

      {Array.from(grouped.entries()).map(([page, slots]) => (
        <div key={page} className="space-y-3">
          <h3 className="px-1 text-sm font-semibold uppercase tracking-wide text-slate-500">
            {PAGE_LABELS[page as AdSlotItem["page"]] ?? page}
          </h3>
          <div className="space-y-2">
            {slots.map((slot) => {
              const expanded = expandedId === slot.id;
              const custom = slot.customContent ?? emptyCustom();
              return (
                <div key={slot.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : slot.id)}
                    className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900">{slot.label}</p>
                      <p className="text-xs text-slate-400">
                        {slot.size} · {slot.priceAznPerMonth} ₼/ay
                        {slot.mode === "campaign" && slot.campaign?.advertiserName
                          ? ` · ${slot.campaign.advertiserName}`
                          : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      {slot.mode === "campaign" && (() => {
                        const meta =
                          CAMPAIGN_STATE_META[computeAdCampaignStatus(slot.campaign).state] ??
                          CAMPAIGN_STATE_META.not_configured;
                        return (
                          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${meta.cls}`}>
                            {meta.label}
                          </span>
                        );
                      })()}
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          slot.enabled ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {slot.enabled ? "Aktiv" : "Deaktiv"}
                      </span>
                      <span className="text-slate-400">{expanded ? "▲" : "▼"}</span>
                    </div>
                  </button>

                  {expanded && (
                    <div className="space-y-4 border-t border-slate-100 px-4 py-4">
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <label className="flex items-center gap-2 text-sm text-slate-700">
                          <input
                            type="checkbox"
                            disabled={readOnly}
                            checked={slot.enabled}
                            onChange={(e) => updateSlot(slot.id, { enabled: e.target.checked })}
                            className="rounded border-slate-300"
                          />
                          Slot aktivdir
                        </label>
                        <label className="block text-sm">
                          <span className="text-slate-500">Rejim</span>
                          <select
                            disabled={readOnly}
                            value={slot.mode}
                            onChange={(e) =>
                              updateSlot(slot.id, {
                                mode: e.target.value as AdSlotItem["mode"],
                                customContent:
                                  e.target.value === "custom" ? slot.customContent ?? emptyCustom() : slot.customContent,
                                campaign:
                                  e.target.value === "campaign" ? slot.campaign ?? emptyCampaign() : slot.campaign
                              })
                            }
                            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 disabled:bg-slate-50"
                          >
                            <option value="placeholder">Boş yer (placeholder)</option>
                            <option value="campaign">Ödənişli reklam (şəkil + büdcə)</option>
                            <option value="demo">Demo reklam</option>
                            <option value="custom">Fərdi məzmun</option>
                          </select>
                        </label>
                        <label className="block text-sm">
                          <span className="text-slate-500">Aylıq qiymət (₼)</span>
                          <input
                            type="number"
                            min={0}
                            disabled={readOnly}
                            value={slot.priceAznPerMonth}
                            onChange={(e) =>
                              updateSlot(slot.id, { priceAznPerMonth: Math.max(0, Number(e.target.value) || 0) })
                            }
                            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 disabled:bg-slate-50"
                          />
                        </label>
                        <label className="block text-sm sm:col-span-2 lg:col-span-1">
                          <span className="text-slate-500">Qiymət qeydi</span>
                          <input
                            type="text"
                            disabled={readOnly}
                            value={slot.priceNote}
                            onChange={(e) => updateSlot(slot.id, { priceNote: e.target.value })}
                            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 disabled:bg-slate-50"
                          />
                        </label>
                      </div>

                      <label className="block text-sm">
                        <span className="text-slate-500">Placeholder mətni</span>
                        <input
                          type="text"
                          disabled={readOnly || slot.mode !== "placeholder"}
                          value={slot.placeholderText}
                          onChange={(e) => updateSlot(slot.id, { placeholderText: e.target.value })}
                          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 disabled:bg-slate-50"
                        />
                      </label>

                      {slot.mode === "custom" && (
                        <div className="grid gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4 sm:grid-cols-2">
                          <label className="block text-sm">
                            <span className="text-slate-500">Loqo mətni</span>
                            <input
                              disabled={readOnly}
                              value={custom.logoText}
                              onChange={(e) => updateCustom(slot.id, { logoText: e.target.value })}
                              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
                            />
                          </label>
                          <label className="block text-sm">
                            <span className="text-slate-500">Başlıq</span>
                            <input
                              disabled={readOnly}
                              value={custom.headline}
                              onChange={(e) => updateCustom(slot.id, { headline: e.target.value })}
                              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
                            />
                          </label>
                          <label className="block text-sm sm:col-span-2">
                            <span className="text-slate-500">Alt mətn</span>
                            <input
                              disabled={readOnly}
                              value={custom.sub}
                              onChange={(e) => updateCustom(slot.id, { sub: e.target.value })}
                              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
                            />
                          </label>
                          <label className="block text-sm">
                            <span className="text-slate-500">CTA düyməsi</span>
                            <input
                              disabled={readOnly}
                              value={custom.cta}
                              onChange={(e) => updateCustom(slot.id, { cta: e.target.value })}
                              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
                            />
                          </label>
                          <label className="block text-sm">
                            <span className="text-slate-500">Link (href)</span>
                            <input
                              disabled={readOnly}
                              value={custom.href}
                              onChange={(e) => updateCustom(slot.id, { href: e.target.value })}
                              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
                            />
                          </label>
                          <label className="block text-sm">
                            <span className="text-slate-500">Accent rəngi</span>
                            <input
                              type="color"
                              disabled={readOnly}
                              value={custom.accent}
                              onChange={(e) => updateCustom(slot.id, { accent: e.target.value })}
                              className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white"
                            />
                          </label>
                        </div>
                      )}

                      {slot.mode === "campaign" && (() => {
                        const campaign = slot.campaign ?? emptyCampaign();
                        const status = computeAdCampaignStatus(campaign);
                        const meta = CAMPAIGN_STATE_META[status.state] ?? CAMPAIGN_STATE_META.not_configured;
                        return (
                          <div className="space-y-4 rounded-xl border border-[#0891B2]/20 bg-[#0891B2]/5 p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${meta.cls}`}>
                                {meta.label}
                              </span>
                              <div className="text-xs text-slate-500">
                                Müddət: <span className="font-semibold text-slate-800">{status.durationDays} gün</span>
                                {status.endDate && (
                                  <>
                                    {" "}· bitir: <span className="font-semibold text-slate-800">{status.endDate}</span>
                                  </>
                                )}
                                {status.state === "live" && (
                                  <>
                                    {" "}· qalıb: <span className="font-semibold text-emerald-700">{status.daysRemaining} gün</span>
                                  </>
                                )}
                              </div>
                            </div>

                            <AdminImageUpload
                              value={campaign.imageUrl}
                              folder="ad-creatives"
                              disabled={readOnly}
                              label={`Reklam şəkli (${slot.size})`}
                              onChange={(url) => updateCampaign(slot.id, { imageUrl: url })}
                            />

                            <div className="grid gap-3 sm:grid-cols-2">
                              <label className="block text-sm">
                                <span className="text-slate-500">Reklamverən</span>
                                <input
                                  disabled={readOnly}
                                  value={campaign.advertiserName}
                                  onChange={(e) => updateCampaign(slot.id, { advertiserName: e.target.value })}
                                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
                                  placeholder="Şirkət adı"
                                />
                              </label>
                              <label className="block text-sm">
                                <span className="text-slate-500">Keçid linki (href)</span>
                                <input
                                  disabled={readOnly}
                                  value={campaign.linkUrl}
                                  onChange={(e) => updateCampaign(slot.id, { linkUrl: e.target.value })}
                                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
                                  placeholder="https://..."
                                />
                              </label>
                              <label className="block text-sm">
                                <span className="text-slate-500">Büdcə (₼)</span>
                                <input
                                  type="number"
                                  min={0}
                                  disabled={readOnly}
                                  value={campaign.budgetAzn}
                                  onChange={(e) => updateCampaign(slot.id, { budgetAzn: Math.max(0, Number(e.target.value) || 0) })}
                                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
                                />
                              </label>
                              <label className="block text-sm">
                                <span className="text-slate-500">Gündəlik tarif (₼/gün)</span>
                                <input
                                  type="number"
                                  min={0}
                                  disabled={readOnly}
                                  value={campaign.dailyRateAzn}
                                  onChange={(e) => updateCampaign(slot.id, { dailyRateAzn: Math.max(0, Number(e.target.value) || 0) })}
                                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
                                />
                              </label>
                              <label className="block text-sm">
                                <span className="text-slate-500">Başlama tarixi</span>
                                <input
                                  type="date"
                                  disabled={readOnly}
                                  value={campaign.startDate}
                                  onChange={(e) => updateCampaign(slot.id, { startDate: e.target.value })}
                                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
                                />
                              </label>
                              <label className="flex items-end gap-2 text-sm">
                                <input
                                  type="checkbox"
                                  disabled={readOnly}
                                  checked={campaign.active}
                                  onChange={(e) => updateCampaign(slot.id, { active: e.target.checked })}
                                  className="mb-2.5 rounded border-slate-300"
                                />
                                <span className="mb-2 text-slate-700">Kampaniya aktiv (efirə buraxılsın)</span>
                              </label>
                            </div>

                            <p className="text-xs text-slate-500">
                              Müddət avtomatik hesablanır: büdcə ÷ gündəlik tarif. Bitəndə reklam avtomatik sönür və slot yenidən boş yerə (placeholder) qayıdır.
                            </p>
                          </div>
                        );
                      })()}

                      <p className="text-xs text-slate-400">Slot ID: {slot.id}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {message && (
        <p className={`text-sm ${message.includes("uğurla") ? "text-emerald-600" : "text-red-600"}`}>{message}</p>
      )}

      {!readOnly && (
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="rounded-xl bg-[#0891B2] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0891B2]/90 disabled:opacity-60"
        >
          {busy ? "Saxlanılır..." : "Dəyişiklikləri saxla"}
        </button>
      )}
    </div>
  );
}
