import { getStorePublishContext } from "@/server/store-publish-context";
import { PartsBulkPublishForm } from "./parts-bulk-publish-form";

export default async function PartsBulkPublishPage() {
  const storePublishContext = await getStorePublishContext();

  return <PartsBulkPublishForm storePublishContext={storePublishContext} />;
}
