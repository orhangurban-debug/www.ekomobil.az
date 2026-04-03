"use client";

import { useState } from "react";

type UserRole = "admin" | "support" | "dealer" | "viewer";
type UserStatus = "active" | "suspended" | "review";

const ROLE_LABELS: Record<UserRole, string> = {
  viewer: "İzləyici",
  dealer: "Diler",
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
}

export function UserManagementTable({ users, canEditRoles = false }: Props) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rows, setRows] = useState(users);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [bulkBusy, setBulkBusy] = useState(false);

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
      alert("Rol yenilənmədi");
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
      alert("Status yenilənmədi");
    } finally {
      setBusyId(null);
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
      alert("Toplu status yenilənmədi");
    } finally {
      setBulkBusy(false);
    }
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
        <p className="text-xs text-slate-500">
          Seçilən istifadəçi: <span className="font-semibold text-slate-700">{Object.values(selected).filter(Boolean).length}</span>
        </p>
        <div className="flex items-center gap-2">
          <button type="button" disabled={bulkBusy} onClick={() => void bulkUpdateStatus("active")} className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-60">Toplu aktiv et</button>
          <button type="button" disabled={bulkBusy} onClick={() => void bulkUpdateStatus("review")} className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-60">Toplu baxışa göndər</button>
          <button type="button" disabled={bulkBusy} onClick={() => void bulkUpdateStatus("suspended")} className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-60">Toplu dayandır</button>
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
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((user) => (
            <tr key={user.id}>
              <td className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={Boolean(selected[user.id])}
                  onChange={(e) => setSelected((current) => ({ ...current, [user.id]: e.target.checked }))}
                />
              </td>
              <td className="px-4 py-3">
                <div className="font-medium text-slate-900">{user.fullName || user.email}</div>
                <div className="text-xs text-slate-500">{user.email}</div>
                <div className="font-mono text-[11px] text-slate-400">{user.id}</div>
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
