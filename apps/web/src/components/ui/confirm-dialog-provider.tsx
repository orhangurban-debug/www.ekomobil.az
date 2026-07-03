"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

type ConfirmFn = (options: ConfirmOptions | string) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

interface PendingConfirm extends Required<Omit<ConfirmOptions, "title">> {
  title?: string;
  resolve: (value: boolean) => void;
}

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);

  const confirm = useCallback<ConfirmFn>((options) => {
    const normalized: ConfirmOptions = typeof options === "string" ? { message: options } : options;
    return new Promise<boolean>((resolve) => {
      setPending({
        title: normalized.title,
        message: normalized.message,
        confirmLabel: normalized.confirmLabel ?? "Təsdiqlə",
        cancelLabel: normalized.cancelLabel ?? "Ləğv et",
        danger: normalized.danger ?? false,
        resolve
      });
    });
  }, []);

  const close = useCallback(
    (value: boolean) => {
      pending?.resolve(value);
      setPending(null);
    },
    [pending]
  );

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {pending && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-message"
          onClick={() => close(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-slate-900/10 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {pending.title ? <h3 className="mb-2 text-lg font-semibold text-slate-900">{pending.title}</h3> : null}
            <p id="confirm-dialog-message" className="text-sm leading-relaxed text-slate-600">
              {pending.message}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => close(false)}>
                {pending.cancelLabel}
              </button>
              <button
                type="button"
                className={
                  pending.danger
                    ? "rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                    : "btn-primary"
                }
                onClick={() => close(true)}
              >
                {pending.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within a ConfirmDialogProvider");
  return ctx;
}
