import type {
  AuctionBidRecord,
  AuctionDepositRecord,
  AuctionFinancialEventRecord,
  AuctionListingRecord,
  AuctionOutcomeRecord,
  AuctionParticipantRecord
} from "@/lib/auction";
import { canUseAuctionMemoryFallback } from "@/server/auction-runtime";

const globalForAuction = globalThis as unknown as {
  ekomobilAuctionListings?: AuctionListingRecord[];
  ekomobilAuctionBids?: AuctionBidRecord[];
  ekomobilAuctionParticipants?: AuctionParticipantRecord[];
  ekomobilAuctionOutcomes?: AuctionOutcomeRecord[];
  ekomobilAuctionFinancialEvents?: AuctionFinancialEventRecord[];
  ekomobilAuctionDeposits?: AuctionDepositRecord[];
  ekomobilAuctionAuditLogs?: Array<{
    id: string;
    auctionId: string;
    actorUserId?: string;
    actionType: string;
    detail: string;
    createdAt: string;
  }>;
};

export function getAuctionListingsMemory(): AuctionListingRecord[] {
  if (!canUseAuctionMemoryFallback()) return [];
  if (!globalForAuction.ekomobilAuctionListings) globalForAuction.ekomobilAuctionListings = [];
  return globalForAuction.ekomobilAuctionListings;
}

export function getAuctionBidsMemory(): AuctionBidRecord[] {
  if (!canUseAuctionMemoryFallback()) return [];
  if (!globalForAuction.ekomobilAuctionBids) globalForAuction.ekomobilAuctionBids = [];
  return globalForAuction.ekomobilAuctionBids;
}

export function getAuctionParticipantsMemory(): AuctionParticipantRecord[] {
  if (!canUseAuctionMemoryFallback()) return [];
  if (!globalForAuction.ekomobilAuctionParticipants) globalForAuction.ekomobilAuctionParticipants = [];
  return globalForAuction.ekomobilAuctionParticipants;
}

export function getAuctionOutcomesMemory(): AuctionOutcomeRecord[] {
  if (!canUseAuctionMemoryFallback()) return [];
  if (!globalForAuction.ekomobilAuctionOutcomes) globalForAuction.ekomobilAuctionOutcomes = [];
  return globalForAuction.ekomobilAuctionOutcomes;
}

export function getAuctionFinancialEventsMemory(): AuctionFinancialEventRecord[] {
  if (!canUseAuctionMemoryFallback()) return [];
  if (!globalForAuction.ekomobilAuctionFinancialEvents) globalForAuction.ekomobilAuctionFinancialEvents = [];
  return globalForAuction.ekomobilAuctionFinancialEvents;
}

export function getAuctionDepositsMemory(): AuctionDepositRecord[] {
  if (!canUseAuctionMemoryFallback()) return [];
  if (!globalForAuction.ekomobilAuctionDeposits) globalForAuction.ekomobilAuctionDeposits = [];
  return globalForAuction.ekomobilAuctionDeposits;
}

export function getAuctionAuditLogsMemory(): Array<{
  id: string;
  auctionId: string;
  actorUserId?: string;
  actionType: string;
  detail: string;
  createdAt: string;
}> {
  if (!canUseAuctionMemoryFallback()) return [];
  if (!globalForAuction.ekomobilAuctionAuditLogs) globalForAuction.ekomobilAuctionAuditLogs = [];
  return globalForAuction.ekomobilAuctionAuditLogs;
}
