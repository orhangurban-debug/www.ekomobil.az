"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useConfirm } from "@/components/ui/confirm-dialog-provider";
import { useToast } from "@/components/ui/toast-provider";

type UserRole = "admin" | "support" | "dealer" | "viewer";
type UserStatus = "active" | "suspended" | "review";

interface UserData {
  id: string;
  email: string;
  role: UserRole;
  userAccountStatus: string;
  penaltyBalanceAzn: number;
  fullName?: string;
  city?: string;
  phone?: string;
}

export function AdminUserEditPanel({
  user,
  canEditRoles,
  canDelete
}: {
  user: UserData;
  canEditRoles: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    fullName: user.fullName ?? "",
    city: user.city ?? "",
    phone: user.phone ?? "",
    role: user.role,
    userAccountStatus: user.userAccountStatus as UserStatus,
    penaltyBalanceAzn: user.penaltyBalanceAzn
  });

  async function save() {
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName.trim() || null,
          city: form.city.trim() || null,
          phone: form.phone.trim() || null,
          role: canEditRoles ? form.role : undefined,
          userAccountStatus: form.userAccountStatus,
          penaltyBalanceAzn: canEditRoles ? form.penaltyBalanceAzn : undefined
        })
      });
      const payload = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        toast.error(payload.error ?? "Yeniləmə uğursuz oldu.");
        return;
      }
      toast.success("İstifadəçi məlumatları yeniləndi.");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function removeUser() {
    const ok = await confirm({
      title: "İstifadəçini sil",
      message:
        "Bu istifadəçi və ona aid elanlar/profillər bazadan həmişəlik silinəcək. Geri qaytarmaq mümkün deyil. Davam edilsin?",
      confirmLabel: "Sil",
      danger: true
    });
    if (!ok) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Admin panelindən silindi" })
      });
      const payload = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        toast.error(payload.error ?? "Silinmə uğursuz oldu.");
        return;
      }
      toast.success("İstifadəçi bazadan silindi.");
      router.push("/admin/users");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-900">İstifadəçini redaktə et</h3>
          <p className="mt-1 text-xs text-slate-500">Profil, rol və status dəyişiklikləri dərhal tətbiq olunur.</p>
        </div>
        {canDelete && (
          <button
            type="button"
            onClick={() => void removeUser()}
            disabled={busy}
            className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
          >
            Sil
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="text-xs font-medium text-slate-600">Ad Soyad</span>
          <input
            className="input-field"
            value={form.fullName}
            onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-slate-600">Şəhər</span>
          <input
            className="input-field"
            value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-slate-600">Telefon</span>
          <input
            className="input-field"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-slate-600">E-poçt (dəyişdirilmir)</span>
          <input className="input-field bg-slate-50" value={user.email} disabled />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-slate-600">Rol</span>
          <select
            className="input-field"
            value={form.role}
            disabled={!canEditRoles}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRole }))}
          >
            <option value="viewer">Fərdi istifadəçi</option>
            <option value="dealer">Salon</option>
            <option value="support">Dəstək</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-slate-600">Hesab statusu</span>
          <select
            className="input-field"
            value={form.userAccountStatus}
            onChange={(e) => setForm((f) => ({ ...f, userAccountStatus: e.target.value as UserStatus }))}
          >
            <option value="active">Aktiv</option>
            <option value="review">Baxışda</option>
            <option value="suspended">Dayandırılıb</option>
          </select>
        </label>
        {canEditRoles && (
          <label className="space-y-1 sm:col-span-2">
            <span className="text-xs font-medium text-slate-600">Cərimə balansı (₼)</span>
            <input
              type="number"
              min={0}
              className="input-field max-w-xs"
              value={form.penaltyBalanceAzn}
              onChange={(e) => setForm((f) => ({ ...f, penaltyBalanceAzn: Number(e.target.value) || 0 }))}
            />
          </label>
        )}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" onClick={() => void save()} disabled={busy} className="btn-primary px-5 py-2 text-sm disabled:opacity-60">
          {busy ? "Saxlanılır..." : "Dəyişiklikləri saxla"}
        </button>
      </div>
    </section>
  );
}
