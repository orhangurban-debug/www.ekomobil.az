import type { UserRole } from "@/lib/auth";

export interface HeaderCta {
  label: string;
  href: string;
}

/** Context-aware primary header action — one CTA per page, role-aware where needed. */
export function resolvePrimaryHeaderCta(pathname: string, userRole?: UserRole): HeaderCta | null {
  if (
    pathname.startsWith("/publish") ||
    pathname.startsWith("/parts/publish") ||
    pathname.startsWith("/parts/apply") ||
    pathname.startsWith("/dealer/apply") ||
    pathname.startsWith("/auction/sell") ||
    pathname.startsWith("/partners")
  ) {
    return null;
  }

  if (pathname.startsWith("/services")) {
    return { label: "Servis müraciəti", href: "/partners/inspection" };
  }

  if (pathname.startsWith("/dealers")) {
    return { label: "Salon müraciəti", href: "/dealer/apply" };
  }

  if (pathname.startsWith("/dealer")) {
    return userRole === "dealer" || userRole === "admin"
      ? { label: "Yeni elan", href: "/publish" }
      : null;
  }

  if (pathname.startsWith("/parts")) {
    return { label: "Hissə elanı", href: "/parts/publish" };
  }

  if (pathname.startsWith("/auction")) {
    return { label: "Lot yerləşdir", href: "/auction/sell" };
  }

  if (pathname.startsWith("/listings")) {
    return { label: "Elan yerləşdir", href: "/publish" };
  }

  return { label: "Elan yerləşdir", href: "/publish" };
}
