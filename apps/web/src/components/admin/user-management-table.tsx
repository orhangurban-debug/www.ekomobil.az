"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useConfirm } from "@/components/ui/confirm-dialog-provider";
import { useToast } from "@/components/ui/toast-provider";

type UserRole = "admin" | "support" | "dealer" | "viewer";
type UserStatus = "active" | "suspended" | "review";

const ROLE_LABELS: Record<UserRole, string> = {
  viewer: "İzləyici",
  dealer: "Salon",
  support: "Dəstək",
  admin: "Admin"
};

const STATUS_LABELS: Record<UserStatus, string> = {
  active: "Aktiv",
  suspended: "Dayandırılıb",
  review: "Baxışda"
};

interface AdminUserRow {
  id: string;
  email: string;
  role: UserRole;
  userAccountStatus: string;
  penaltyBalanceAzn: number;
  emailVerified: boolean;
  createdAt: string;
  fullName?: string;
  city?: string;
}

interface Props {
  users: AdminUserRow[];
  canEditRoles?: boolean;
  canDelete?: boolean;
  currentUserId?: string;
}

function isAnonymized(email: string): boolean {
  return email.includes("@anonymized.ekomobil.local");
}

export function UserManagementTable({
  users,
  canEditRoles = false,
  canDelete = false,
  currentUserId
}: Props) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rows, setRows] = useState(users);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [bulkBusy, setBulkBusy] = useState(false);
  const toast = useToast();
  const confirm = useConfirm();

  const selectedCount = Object.values(selected).filter(Boolean).length;

  async function updateRole(userId: string, role: UserRole) {
    setBusyId(userId);
    const prev = rows;
    setRows((current) => current.map((u) => (u.id === userId ? { ...u, role } : u)));
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role })
      });
      const payload = (await response.json()) as { ok: boolean; error?: string };
      if (!payload.ok) throw new Error(payload.error || "Rol yenilənmədi");
    } catch {
      setRows(prev);
      toast.error("Rol yenilənmədi");
    } finally {
      setBusyId(null);
    }
  }

  async function updateStatus(userId: string, status: UserStatus) {
    setBusyId(userId);
    const prev = rows;
    setRows((current) => current.map((u) => (u.id === userId ? { ...u, userAccountStatus: status } : u)));
    try {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      const payload = (await response.json()) as { ok: boolean; error?: string };
      if (!payload.ok) throw new Error(payload.error || "Status yenilənmədi");
    } catch {
      setRows(prev);
      toast.error("Status yenilənmədi");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteUser(userId: string, label: string) {
    if (currentUserId && userId === currentUserId) {
      toast.error("Öz hesabınızı silə bilməzsiniz.");
      return;
    }
    const ok = await confirm({
      title: "İstifadəçini sil",
      message: `"${label}" hesabı anonimləşdiriləcək və dayandırılacaq. Geri qaytarmaq mümkün deyil. Davam edilsin?`,
      confirmLabel: "Sil",
      danger: true
    });
    if (!ok) return;

    setBusyId(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Admin siyahısından silindi" })
      });
      const payload = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        toast.error(payload.error ?? "Silinmə uğursuz oldu.");
        return;
      }
      setRows((prev) => prev.filter((u) => u.id !== userId));
      setSelected((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
      toast.success("İstifadəçi silindi.");
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function bulkDelete() {
    const userIds = rows
      .filter((row) => selected[row.id] && !isAnonymized(row.email))
      .map((row) => row.id)
      .filter((id) => id !== currentUserId);

    if (userIds.length === 0) {
      toast.error("Silinə bilən istifadəçi seçilməyib.");
      return;
    }

    const ok = await confirm({
      title: "Seçilən istifadəçiləri sil",
      message: `${userIds.length} hesab anonimləşdiriləcək və dayandırılacaq. Geri qaytarmaq mümkün deyil.`,
      confirmLabel: "Sil",
      danger: true
    });
    if (!ok) return;

    setBulkBusy(true);
    const succeededIds: string[] = [];
    let failed = 0;
    try {
      for (const userId of userIds) {
        const response = await fetch(`/api/admin/users/${userId}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: "Admin toplu silmə" })
        });
        const payload = (await response.json()) as { ok: boolean; error?: string };
        if (response.ok && payload.ok) {
          succeededIds.push(userId);
        } else {
          failed += 1;
        }
      }
      setRows((prev) => prev.filter((u) => !succeededIds.includes(u.id)));
      setSelected((prev) => {
        const next = { ...prev };
        for (const id of succeededIds) delete next[id];
        return next;
      });
      if (failed === 0) {
        toast.success(`${succeededIds.length} istifadəçi silindi.`);
      } else if (succeededIds.length > 0) {
        toast.error(`${succeededIds.length} silindi, ${failed} uğursuz oldu.`);
      } else {
        toast.error("Heç bir istifadəçi silinmədi.");
      }
      router.refresh();
    } finally {
      setBulkBusy(false);
    }
  }

  async function bulkUpdateStatus(status: UserStatus) {
    const userIds = rows.filter((row) => selected[row.id]).map((row) => row.id);
    if (userIds.length === 0 || bulkBusy) return;
    setBulkBusy(true);
    const prev = rows;
    setRows((current) => current.map((u) => (selected[u.id] ? { ...u, userAccountStatus: status } : u)));
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds, status })
      });
      const payload = (await response.json()) as { ok: boolean; error?: string };
      if (!payload.ok) throw new Error(payload.error || "Status yenilənmədi");
      setSelected({});
    } catch {
      setRows(prev);
      toast.error("Toplu status yenilənmədi");
    } finally {
      setBulkBusy(false);
    }
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
        <p className="text-xs text-slate-500">
          Seçilən istifadəçi: <span className="font-semibold text-slate-700">{selectedCount}</span>
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" disabled={bulkBusy} onClick={() => void bulkUpdateStatus("active")} className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-60">Toplu aktiv et</button>
          <button type="button" disabled={bulkBusy} onClick={() => void bulkUpdateStatus("review")} className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-60">Toplu baxışa göndər</button>
          <button type="button" disabled={bulkBusy} onClick={() => void bulkUpdateStatus("suspended")} className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-60">Toplu dayandır</button>
          {canDelete && (
            <button
              type="button"
              disabled={bulkBusy || selectedCount === 0}
              onClick={() => void bulkDelete()}
              className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
            >
              Toplu sil
            </button>
          )}
        </div>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3 text-left">
              <input
                type="checkbox"
                onChange={(e) => {
                  const checked = e.target.checked;
                  setSelected(
                    checked
                      ? Object.fromEntries(rows.map((row) => [row.id, true]))
                      : {}
                  );
                }}
              />
            </th>
            <th className="px-4 py-3 text-left">İstifadəçi</th>
            <th className="px-4 py-3 text-left">Rol</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">Öhdəlik balansı</th>
            <th className="px-4 py-3 text-left">Doğrulama</th>
            <th className="px-4 py-3 text-left">Qeydiyyat</th>
            {canDelete && <th className="px-4 py-3 text-left">Əməliyyat</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((user) => {
            const deletedAlready = isAnonymized(user.email);
            const isSelf = currentUserId === user.id;
            const canRemove = canDelete && !deletedAlready && !isSelf;
            return (
            <tr key={user.id}>
              <td className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={Boolean(selected[user.id])}
                  onChange={(e) => setSelected((current) => ({ ...current, [user.id]: e.target.checked }))}
                />
              </td>
              <td className="px-4 py-3">
                <Link href={`/admin/users/${user.id}`} className="group block">
                  <div className="font-medium text-slate-900 group-hover:text-[#0891B2]">{user.fullName || user.email}</div>
                  <div className="text-xs text-slate-500">{user.email}</div>
                  <div className="font-mono text-[11px] text-slate-400">{user.id}</div>
                </Link>
              </td>
              <td className="px-4 py-3">
                <select
                  value={user.role}
                  onChange={(e) => void updateRole(user.id, e.target.value as UserRole)}
                  disabled={busyId === user.id || !canEditRoles}
                  className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
                >
                  <option value="viewer">{ROLE_LABELS.viewer}</option>
                  <option value="dealer">{ROLE_LABELS.dealer}</option>
                  <option value="support">{ROLE_LABELS.support}</option>
                  <option value="admin">{ROLE_LABELS.admin}</option>
                </select>
              </td>
              <td className="px-4 py-3">
                <select
                  value={user.userAccountStatus}
                  onChange={(e) => void updateStatus(user.id, e.target.value as UserStatus)}
                  disabled={busyId === user.id}
                  className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
                >
                  <option value="active">{STATUS_LABELS.active}</option>
                  <option value="suspended">{STATUS_LABELS.suspended}</option>
                  <option value="review">{STATUS_LABELS.review}</option>
                </select>
              </td>
              <td className="px-4 py-3 font-semibold text-slate-700">
                {user.penaltyBalanceAzn.toLocaleString("az-AZ")} ₼
              </td>
              <td className="px-4 py-3">
                {user.emailVerified ? (
                  <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">Təsdiqlənib</span>
                ) : (
                  <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">Gözləmədə</span>
                )}
              </td>
              <td className="px-4 py-3 text-xs text-slate-500">
                {new Date(user.createdAt).toLocaleDateString("az-AZ")}
              </td>
              {canDelete && (
                <td className="px-4 py-3">
                  {canRemove ? (
                    <button
                      type="button"
                      disabled={busyId === user.id || bulkBusy}
                      onClick={() => void deleteUser(user.id, user.fullName || user.email)}
                      className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                    >
                      Sil
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400">{isSelf ? "Siz" : deletedAlready ? "Silinib" : "—"}</span>
                  )}
                </td>
              )}
            </tr>
          );})}
        </tbody>
      </table>
    </div>
  );
}
