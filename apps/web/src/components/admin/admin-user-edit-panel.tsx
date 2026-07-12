"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useConfirm } from "@/components/ui/confirm-dialog-provider";
import { useToast } from "@/components/ui/toast-provider";
import { AdminStaffGrantModal } from "@/components/admin/admin-staff-grant-modal";
import {
  ADMIN_STAFF_TYPE_LABELS,
  type AdminCapability,
  type AdminStaffType
} from "@/lib/admin-permissions";
import type { UserRole } from "@/lib/auth";

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
  staffType?: AdminStaffType | null;
  permissions?: AdminCapability[];
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
  const [grantOpen, setGrantOpen] = useState(false);
  const [form, setForm] = useState({
    fullName: user.fullName ?? "",
    city: user.city ?? "",
    phone: user.phone ?? "",
    role: user.role,
    staffType: user.staffType ?? null,
    permissions: user.permissions ?? [],
    userAccountStatus: user.userAccountStatus as UserStatus,
    penaltyBalanceAzn: user.penaltyBalanceAzn
  });

  async function saveProfileOnly() {
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName.trim() || null,
          city: form.city.trim() || null,
          phone: form.phone.trim() || null,
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

  async function applyStaffGrant(input: {
    staffType: AdminStaffType;
    permissions: AdminCapability[];
    role: "admin" | "support";
  }) {
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/users/${user.id}/role`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: input.role,
          staffType: input.staffType,
          permissions: input.permissions,
          confirm: true
        })
      });
      const payload = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        toast.error(payload.error ?? "Rol yenilənmədi.");
        return;
      }
      setForm((f) => ({
        ...f,
        role: input.role,
        staffType: input.staffType,
        permissions: input.permissions
      }));
      setGrantOpen(false);
      toast.success("Admin/staff təyinatı tətbiq olundu.");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function demoteRole(nextRole: Extract<UserRole, "viewer" | "dealer">) {
    const ok = await confirm({
      title: "Rolu dəyiş",
      message: "Admin səlahiyyətləri silinəcək. Davam edilsin?",
      confirmLabel: "Təsdiq et",
      danger: true
    });
    if (!ok) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/users/${user.id}/role`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: nextRole, confirm: true })
      });
      const payload = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        toast.error(payload.error ?? "Rol yenilənmədi.");
        return;
      }
      setForm((f) => ({ ...f, role: nextRole, staffType: null, permissions: [] }));
      toast.success("Rol yeniləndi.");
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
          <p className="mt-1 text-xs text-slate-500">
            Admin təyinatı ayrıca təsdiq tələb edir. Digər profil dəyişiklikləri saxla ilə tətbiq olunur.
          </p>
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
        <div className="space-y-2">
          <span className="text-xs font-medium text-slate-600">Rol / admin növü</span>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
            <p className="font-semibold text-slate-900">
              {form.role === "admin"
                ? "Admin"
                : form.role === "support"
                  ? "Dəstək"
                  : form.role === "dealer"
                    ? "Salon"
                    : "Fərdi istifadəçi"}
            </p>
            {form.staffType && (
              <p className="mt-0.5 text-xs text-slate-500">
                {ADMIN_STAFF_TYPE_LABELS[form.staffType]} · {form.permissions.length} səlahiyyət
              </p>
            )}
          </div>
          {canEditRoles && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => setGrantOpen(true)}
                className="rounded-lg border border-[#0057FF]/20 bg-[#0057FF]/5 px-3 py-1.5 text-xs font-semibold text-[#0057FF] hover:bg-[#0057FF]/10 disabled:opacity-60"
              >
                Admin/staff təyin et
              </button>
              {(form.role === "admin" || form.role === "support") && (
                <>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void demoteRole("viewer")}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  >
                    İzləyici et
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void demoteRole("dealer")}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  >
                    Salon et
                  </button>
                </>
              )}
            </div>
          )}
        </div>
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
        <button
          type="button"
          onClick={() => void saveProfileOnly()}
          disabled={busy}
          className="btn-primary px-5 py-2 text-sm disabled:opacity-60"
        >
          {busy ? "Saxlanılır..." : "Dəyişiklikləri saxla"}
        </button>
      </div>

      <AdminStaffGrantModal
        open={grantOpen}
        userLabel={user.fullName || user.email}
        initialStaffType={form.staffType ?? (form.role === "support" ? "support" : "moderation")}
        initialPermissions={form.permissions}
        busy={busy}
        onClose={() => setGrantOpen(false)}
        onConfirm={(input) => void applyStaffGrant(input)}
      />
    </section>
  );
}
