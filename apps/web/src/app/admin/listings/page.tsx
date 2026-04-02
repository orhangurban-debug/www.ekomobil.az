import Link from "next/link";
import { listAdminListings } from "@/server/admin-store";

export default async function AdminListingsPage() {
  const listings = await listAdminListings(150);
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Elan idarəetməsi</h2>
        <p className="mt-1 text-sm text-slate-500">
          Elan statusları, plan növü və satıcı tipinə görə moderasiya görünüşü.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left">Elan</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Satıcı</th>
              <th className="px-4 py-3 text-left">Plan</th>
              <th className="px-4 py-3 text-left">Qiymət</th>
              <th className="px-4 py-3 text-left">Tarix</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {listings.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">{item.title}</div>
                  <div className="text-xs text-slate-500">{item.year}, {item.city}</div>
                  <Link href={`/listings/${item.id}`} className="text-xs font-semibold text-[#0891B2] hover:underline">
                    Elanı aç
                  </Link>
                </td>
                <td className="px-4 py-3"><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">{item.status}</span></td>
                <td className="px-4 py-3 text-slate-700">{item.sellerType}</td>
                <td className="px-4 py-3 text-slate-700">{item.planType || "-"}</td>
                <td className="px-4 py-3 font-semibold text-slate-900">{item.priceAzn.toLocaleString("az-AZ")} ₼</td>
                <td className="px-4 py-3 text-xs text-slate-500">{new Date(item.createdAt).toLocaleDateString("az-AZ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
