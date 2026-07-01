import { getServerSessionUser } from "@/lib/auth";
import { hasActiveBusinessSubscription } from "@/server/business-plan-store";
import { PartsBulkPublishForm } from "./parts-bulk-publish-form";

export default async function PartsBulkPublishPage() {
  const user = await getServerSessionUser();
  const storeAccessEnabled = user
    ? user.role === "admin" || (await hasActiveBusinessSubscription(user.id, "parts_store"))
    : false;

  return <PartsBulkPublishForm storeAccessEnabled={storeAccessEnabled} />;
}
