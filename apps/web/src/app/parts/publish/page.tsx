import { getStorePublishContext } from "@/server/store-publish-context";
import { PartsPublishForm } from "./parts-publish-form";

export default async function PartsPublishPage() {
  const storePublishContext = await getStorePublishContext();

  return <PartsPublishForm storePublishContext={storePublishContext} />;
}
