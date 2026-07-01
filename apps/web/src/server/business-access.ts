import type { SessionUser } from "@/lib/auth";
import { getServerSessionUser } from "@/lib/auth";
import {
  getBusinessAccountSnapshot,
  hasActiveBusinessSubscription,
  type BusinessAccountSnapshot
} from "@/server/business-plan-store";

export async function requireSalonPanelAccess() {
  const user = await getServerSessionUser();
  if (!user) {
    return { ok: false as const, reason: "unauthenticated" as const };
  }
  if (user.role !== "dealer" && user.role !== "admin") {
    return { ok: false as const, reason: "forbidden" as const, user };
  }
  return { ok: true as const, user };
}

export async function requirePartsStoreAccess() {
  const user = await getServerSessionUser();
  if (!user) {
    return { ok: false as const, reason: "unauthenticated" as const };
  }
  if (user.role === "admin") {
    return { ok: true as const, user, snapshot: await getBusinessAccountSnapshot(user.id, user.role) };
  }
  const active = await hasActiveBusinessSubscription(user.id, "parts_store");
  if (!active) {
    return { ok: false as const, reason: "forbidden" as const, user };
  }
  return {
    ok: true as const,
    user,
    snapshot: await getBusinessAccountSnapshot(user.id, user.role)
  };
}

export async function canUserPublishStoreParts(user: SessionUser): Promise<boolean> {
  if (user.role === "admin") return true;
  return hasActiveBusinessSubscription(user.id, "parts_store");
}

export async function loadBusinessAccountSnapshot(user: SessionUser): Promise<BusinessAccountSnapshot> {
  return getBusinessAccountSnapshot(user.id, user.role);
}
