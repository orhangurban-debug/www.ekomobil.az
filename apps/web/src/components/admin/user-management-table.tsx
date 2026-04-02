"use client";

import { useState } from "react";

type UserRole = "admin" | "support" | "dealer" | "viewer";

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

export function UserManagementTable({ users }: { users: AdminUserRow[] }) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rows, setRows] = useState(users);

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

  async function updateStatus(userId: string, status: string) {
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

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3 text-left">İstifadəçi</th>
            <th className="px-4 py-3 text-left">Rol</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">Penalty</th>
            <th className="px-4 py-3 text-left">Doğrulama</th>
            <th className="px-4 py-3 text-left">Qeydiyyat</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((user) => (
            <tr key={user.id}>
              <td className="px-4 py-3">
                <div className="font-medium text-slate-900">{user.fullName || user.email}</div>
                <div className="text-xs text-slate-500">{user.email}</div>
                <div className="font-mono text-[11px] text-slate-400">{user.id}</div>
              </td>
              <td className="px-4 py-3">
                <select
                  value={user.role}
                  onChange={(e) => void updateRole(user.id, e.target.value as UserRole)}
                  disabled={busyId === user.id}
                  className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
                >
                  <option value="viewer">viewer</option>
                  <option value="dealer">dealer</option>
                  <option value="support">support</option>
                  <option value="admin">admin</option>
                </select>
              </td>
              <td className="px-4 py-3">
                <select
                  value={user.userAccountStatus}
                  onChange={(e) => void updateStatus(user.id, e.target.value)}
                  disabled={busyId === user.id}
                  className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
                >
                  <option value="active">active</option>
                  <option value="suspended">suspended</option>
                  <option value="review">review</option>
                </select>
              </td>
              <td className="px-4 py-3 font-semibold text-slate-700">
                {user.penaltyBalanceAzn.toLocaleString("az-AZ")} ₼
              </td>
              <td className="px-4 py-3">
                {user.emailVerified ? (
                  <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">Verified</span>
                ) : (
                  <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">Pending</span>
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
