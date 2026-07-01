import Link from "next/link";

type GatePreset = "dealer-panel" | "dealer-analytics" | "parts-analytics" | "dealer-import";

interface GateAction {
  label: string;
  href: string;
  variant: "primary" | "secondary";
}

interface GateCopy {
  unauthenticated: { title: string; description: string; actions: GateAction[] };
  forbidden: { title: string; description: string; actions: GateAction[] };
}

const GATE_COPY: Record<GatePreset, GateCopy> = {
  "dealer-panel": {
    unauthenticated: {
      title: "Giriş tələb olunur",
      description: "Salon paneli yalnız salon hesabları üçündür.",
      actions: [
        { label: "Daxil ol", href: "/login?next=/dealer", variant: "primary" },
        { label: "Salon müraciəti", href: "/dealer/apply", variant: "secondary" }
      ]
    },
    forbidden: {
      title: "Salon panelinə giriş yoxdur",
      description: "Bu panel yalnız aktiv salon hesabları üçündür.",
      actions: [
        { label: "Salon müraciəti", href: "/dealer/apply", variant: "primary" },
        { label: "Profil", href: "/me", variant: "secondary" }
      ]
    }
  },
  "dealer-analytics": {
    unauthenticated: {
      title: "Giriş tələb olunur",
      description: "Salon analitikası yalnız salon hesabları üçündür.",
      actions: [
        { label: "Daxil ol", href: "/login?next=/dealer/analytics", variant: "primary" },
        { label: "Salon müraciəti", href: "/dealer/apply", variant: "secondary" }
      ]
    },
    forbidden: {
      title: "Salon analitikası mövcud deyil",
      description: "Bu modul yalnız aktiv salon hesabları üçündür.",
      actions: [
        { label: "Salon müraciəti", href: "/dealer/apply", variant: "primary" },
        { label: "Profil", href: "/me", variant: "secondary" }
      ]
    }
  },
  "parts-analytics": {
    unauthenticated: {
      title: "Giriş tələb olunur",
      description: "Mağaza analitikası yalnız aktiv mağaza planı olan hesablar üçündür.",
      actions: [
        { label: "Daxil ol", href: "/login?next=/parts/analytics", variant: "primary" },
        { label: "Mağaza müraciəti", href: "/parts/apply", variant: "secondary" }
      ]
    },
    forbidden: {
      title: "Mağaza analitikası mövcud deyil",
      description: "Bu modul aktiv mağaza planı tələb edir. Salon hesabı mağaza planını avtomatik açmır.",
      actions: [
        { label: "Mağaza planları", href: "/pricing#parts-store", variant: "primary" },
        { label: "Mağaza müraciəti", href: "/parts/apply", variant: "secondary" }
      ]
    }
  },
  "dealer-import": {
    unauthenticated: {
      title: "Giriş tələb olunur",
      description: "CSV idxalı yalnız salon hesabları üçündür.",
      actions: [
        { label: "Daxil ol", href: "/login?next=/dealer/import", variant: "primary" },
        { label: "Salon müraciəti", href: "/dealer/apply", variant: "secondary" }
      ]
    },
    forbidden: {
      title: "CSV idxalı mövcud deyil",
      description: "Toplu import yalnız aktiv salon hesabları və uyğun planla açılır.",
      actions: [
        { label: "Salon müraciəti", href: "/dealer/apply", variant: "primary" },
        { label: "Salon paneli", href: "/dealer", variant: "secondary" }
      ]
    }
  }
};

export function RoleAccessGate({
  reason,
  preset
}: {
  reason: "unauthenticated" | "forbidden";
  preset: GatePreset;
}) {
  const copy = GATE_COPY[preset][reason === "forbidden" ? "forbidden" : "unauthenticated"];

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="card max-w-sm p-10 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50">
          <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="font-bold text-white">{copy.title}</h2>
        <p className="mt-2 text-sm text-white/50">{copy.description}</p>
        <div className="mt-6 flex flex-col gap-2">
          {copy.actions.map((action) => (
            <Link
              key={action.href + action.label}
              href={action.href}
              className={`${action.variant === "primary" ? "btn-primary" : "btn-secondary"} w-full justify-center`}
            >
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
