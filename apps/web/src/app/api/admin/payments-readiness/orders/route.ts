import { NextResponse } from "next/server";
import { requireApiRoles } from "@/lib/rbac";
import { listBankPaymentOrders } from "@/server/payment-readiness-store";

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes("\"") || value.includes("\n")) {
    return `"${value.replace(/"/g, "\"\"")}"`;
  }
  return value;
}

export async function GET(req: Request) {
  const auth = requireApiRoles(req, ["admin", "support"]);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format")?.toLowerCase();
  const limit = Number(searchParams.get("limit") || 300);
  const rows = await listBankPaymentOrders(Number.isFinite(limit) ? Math.max(1, Math.min(limit, 2000)) : 300);

  if (format === "csv") {
    const header = [
      "channel",
      "internalPaymentId",
      "orderId",
      "remoteOrderId",
      "amountAzn",
      "status",
      "providerMode",
      "paymentReference",
      "checkoutUrl",
      "createdAt"
    ];
    const lines = rows.map((row) =>
      [
        row.channel,
        row.internalPaymentId,
        row.orderId,
        row.remoteOrderId ?? "",
        String(row.amountAzn),
        row.status,
        row.providerMode ?? "",
        row.paymentReference ?? "",
        row.checkoutUrl ?? "",
        row.createdAt
      ]
        .map(escapeCsv)
        .join(",")
    );
    const csv = [header.join(","), ...lines].join("\n");
    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="bank-payment-orders.csv"`
      }
    });
  }

  return NextResponse.json({ ok: true, items: rows, total: rows.length });
}
