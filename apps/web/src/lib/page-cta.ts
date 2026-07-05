import type { UserRole } from "@/lib/auth";

export interface HeaderCta {
  label: string;
  href: string;
}

/**
 * Context-aware primary header CTA.
 *
 * Mağaza (parts_store) vs Salon (dealer) ayrımı:
 *   - /parts  → "Mağaza aç" (setup) or "Hissə elanı" (if already store)
 *   - /dealers → "Salon müraciəti"
 *   - /services → "Servis müraciəti"
 *   - /listings → "Elan yerləşdir"
 *   - /auction  → "Lot yerləşdir"
 *
 * hasStorePlan = true means user already has an active parts_store subscription.
 * This is resolved server-side in the header and passed as a prop.
 */
export function resolvePrimaryHeaderCta(
  pathname: string,
  userRole?: UserRole,
  hasStorePlan?: boolean
): HeaderCta | null {
  // Publish/apply/setup pages hide the CTA to avoid double-action confusion
  if (
    pathname.startsWith("/publish") ||
    pathname.startsWith("/parts/publish") ||
    pathname.startsWith("/parts/setup") ||
    pathname.startsWith("/parts/apply") ||
    pathname.startsWith("/dealer/apply") ||
    pathname.startsWith("/auction/sell") ||
    pathname.startsWith("/partners")
  ) {
    return null;
  }

  // /services, /dealers, /parts — primarily BUYER pages.
  // Seller join CTAs live as sections on the page itself (bottom), not in the header.
  // Only active business users see a relevant header action.
  if (pathname.startsWith("/services")) {
    // Service providers who are already registered could use a link, but guests/buyers see nothing.
    return null;
  }

  if (pathname.startsWith("/dealers")) {
    return null;
  }

  // Salon panel (dealer dashboard) — only for authenticated dealers
  if (pathname.startsWith("/dealer")) {
    return userRole === "dealer" || userRole === "admin"
      ? { label: "Yeni elan", href: "/publish" }
      : null;
  }

  // Parts pages — only active store plan holders see a header action
  if (pathname.startsWith("/parts")) {
    if (hasStorePlan) {
      return { label: "Hissə elanı", href: "/parts/publish" };
    }
    // Buyers and unregistered users: no header CTA — page cards handle the seller onboarding
    return null;
  }

  if (pathname.startsWith("/auction")) {
    return { label: "Lot yerləşdir", href: "/auction/sell" };
  }

  if (pathname.startsWith("/listings")) {
    return { label: "Elan yerləşdir", href: "/publish" };
  }

  // Default (home, /me, /pricing, etc.)
  return { label: "Elan yerləşdir", href: "/publish" };
}
