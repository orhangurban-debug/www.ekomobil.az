import { getServerSessionUser } from "@/lib/auth";
import { hasActiveBusinessSubscription } from "@/server/business-plan-store";
import { PartsPublishForm } from "./parts-publish-form";

export default async function PartsPublishPage() {
  const user = await getServerSessionUser();
  const storeAccessEnabled = user
    ? user.role === "admin" || (await hasActiveBusinessSubscription(user.id, "parts_store"))
    : false;

  return <PartsPublishForm storeAccessEnabled={storeAccessEnabled} />;
}
