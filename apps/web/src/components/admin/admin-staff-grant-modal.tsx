"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ALL_ADMIN_CAPABILITIES,
  ADMIN_CAPABILITY_LABELS,
  ADMIN_STAFF_TYPE_DESCRIPTIONS,
  ADMIN_STAFF_TYPE_LABELS,
  type AdminCapability,
  type AdminStaffType,
  permissionsForStaffType,
  roleForStaffType
} from "@/lib/admin-permissions";

const STAFF_TYPES: AdminStaffType[] = [
  "super_admin",
  "moderation",
  "operations",
  "finance",
  "support",
  "custom"
];

export function AdminStaffGrantModal({
  open,
  userLabel,
  initialStaffType = "moderation",
  initialPermissions,
  busy = false,
  onClose,
  onConfirm
}: {
  open: boolean;
  userLabel: string;
  initialStaffType?: AdminStaffType;
  initialPermissions?: AdminCapability[];
  busy?: boolean;
  onClose: () => void;
  onConfirm: (input: {
    staffType: AdminStaffType;
    permissions: AdminCapability[];
    role: "admin" | "support";
  }) => void;
}) {
  const [staffType, setStaffType] = useState<AdminStaffType>(initialStaffType);
  const [permissions, setPermissions] = useState<AdminCapability[]>(
    initialPermissions?.length ? initialPermissions : permissionsForStaffType(initialStaffType)
  );

  useEffect(() => {
    if (!open) return;
    setStaffType(initialStaffType);
    setPermissions(
      initialPermissions?.length
        ? initialPermissions
        : permissionsForStaffType(initialStaffType === "custom" ? "moderation" : initialStaffType)
    );
  }, [open, initialStaffType, initialPermissions]);

  const resolvedRole = useMemo(() => roleForStaffType(staffType), [staffType]);

  if (!open) return null;

  function selectStaffType(next: AdminStaffType) {
    setStaffType(next);
    if (next !== "custom") {
      setPermissions(permissionsForStaffType(next));
    }
  }

  function toggleCapability(capability: AdminCapability) {
    setStaffType("custom");
    setPermissions((current) =>
      current.includes(capability)
        ? current.filter((item) => item !== capability)
        : [...current, capability]
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl"
      >
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="text-lg font-semibold text-slate-900">Admin / staff təyinatı</h3>
          <p className="mt-1 text-sm text-slate-500">
            <span className="font-medium text-slate-700">{userLabel}</span> üçün növ və səlahiyyətləri seçin.
            Tətbiq etmək üçün təsdiq tələb olunur.
          </p>
        </div>

        <div className="space-y-5 px-5 py-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Admin növü</p>
            <div className="space-y-2">
              {STAFF_TYPES.map((type) => (
                <label
                  key={type}
                  className={`flex cursor-pointer gap-3 rounded-xl border px-3 py-2.5 ${
                    staffType === type
                      ? "border-[#0057FF]/30 bg-[#0057FF]/5"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="staffType"
                    className="mt-1"
                    checked={staffType === type}
                    onChange={() => selectStaffType(type)}
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-slate-900">
                      {ADMIN_STAFF_TYPE_LABELS[type]}
                    </span>
                    <span className="block text-xs text-slate-500">
                      {ADMIN_STAFF_TYPE_DESCRIPTIONS[type]}
                    </span>
                  </span>
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Sistem rolu:{" "}
              <span className="font-semibold text-slate-700">
                {resolvedRole === "support" ? "Dəstək" : "Admin"}
              </span>
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Səlahiyyətlər
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {ALL_ADMIN_CAPABILITIES.map((capability) => (
                <label
                  key={capability}
                  className="flex items-start gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
                >
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={permissions.includes(capability)}
                    onChange={() => toggleCapability(capability)}
                  />
                  <span>
                    <span className="block font-medium">{ADMIN_CAPABILITY_LABELS[capability]}</span>
                    <span className="block text-[11px] text-slate-400">{capability}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            Ləğv et
          </button>
          <button
            type="button"
            disabled={busy || permissions.length === 0}
            onClick={() =>
              onConfirm({
                staffType,
                permissions,
                role: resolvedRole
              })
            }
            className="rounded-lg bg-[#0057FF] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0046CC] disabled:opacity-60"
          >
            {busy ? "Tətbiq olunur..." : "Təsdiq et və tətbiq et"}
          </button>
        </div>
      </div>
    </div>
  );
}
