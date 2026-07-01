import type { ReactNode } from "react";

export default function OpsLayout({ children }: { children: ReactNode }) {
  return <div className="theme-light min-h-full bg-slate-50">{children}</div>;
}
