export interface DealerInventoryItem {
  id: string;
  title: string;
  priceAzn: number;
  trustScore: number;
  status: "active" | "draft" | "sold";
  mediaComplete: boolean;
}

export interface DealerLead {
  id: string;
  customerName: string;
  listingTitle: string;
  status: "new" | "contacted" | "visit_booked" | "closed";
  createdAt: string;
  responseTimeMin: number;
}

export const mockInventory: DealerInventoryItem[] = [
  {
    id: "inv-101",
    title: "Toyota Corolla 2019",
    priceAzn: 19800,
    trustScore: 88,
    status: "active",
    mediaComplete: true
  },
  {
    id: "inv-102",
    title: "Hyundai Elantra 2018",
    priceAzn: 17600,
    trustScore: 74,
    status: "active",
    mediaComplete: true
  },
  {
    id: "inv-103",
    title: "Mercedes C200 2016",
    priceAzn: 33200,
    trustScore: 59,
    status: "draft",
    mediaComplete: false
  }
];

export const mockLeads: DealerLead[] = [
  {
    id: "lead-1",
    customerName: "Rashad M.",
    listingTitle: "Toyota Corolla 2019",
    status: "new",
    createdAt: "2026-02-16T09:30:00Z",
    responseTimeMin: 5
  },
  {
    id: "lead-2",
    customerName: "Leman A.",
    listingTitle: "Hyundai Elantra 2018",
    status: "contacted",
    createdAt: "2026-02-16T08:15:00Z",
    responseTimeMin: 12
  },
  {
    id: "lead-3",
    customerName: "Murad K.",
    listingTitle: "Mercedes C200 2016",
    status: "visit_booked",
    createdAt: "2026-02-15T16:45:00Z",
    responseTimeMin: 9
  }
];
