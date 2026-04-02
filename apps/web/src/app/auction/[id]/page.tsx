import { AuctionLotDetailClient } from "@/components/auction/auction-lot-detail-client";

export default async function AuctionLotPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AuctionLotDetailClient auctionId={id} />;
}
