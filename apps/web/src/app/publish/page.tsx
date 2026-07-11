import { getDealerPublishContext } from "@/server/dealer-publish-context";
import { VehiclePublishForm } from "./vehicle-publish-form";

export default async function PublishPage() {
  const dealerPublishContext = await getDealerPublishContext();
  return <VehiclePublishForm dealerPublishContext={dealerPublishContext} />;
}
