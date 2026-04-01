import Link from "next/link";
import { listListings } from "@/server/listing-store";

export default async function ComparePage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const ids = typeof params.ids === "string" ? params.ids.split(",").filter(Boolean) : [];
  const result = await listListings({ compareIds: ids, page: 1, pageSize: 50, sort: "trust_desc" });
  const items = ids.length > 0 ? result.items.filter((item) => ids.includes(item.id)) : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Müqayisə aləti</h1>
        <p className="mt-2 text-slate-500">İki və ya daha çox elanı yanaşı qiymətləndirin</p>
      </div>

      {items.length === 0 ? (
        <div className="card p-10 text-center">
          <h2 className="font-semibold text-slate-900">Müqayisə üçün elan seçilməyib</h2>
          <p className="mt-2 text-sm text-slate-500">Elan kartındakı “Müqayisə et” düyməsi ilə seçim edin.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto card p-4">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-4 py-3 text-left text-slate-400">Xüsusiyyət</th>
                  {items.map((item) => (
                    <th key={item.id} className="px-4 py-3 text-left text-slate-900">{item.title}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  ["Qiymət", items.map((item) => `${item.priceAzn.toLocaleString()} ₼`)],
                  ["Etibar", items.map((item) => `${item.trustScore}/100`)],
                  ["İl", items.map((item) => String(item.year))],
                  ["Yürüş", items.map((item) => `${item.mileageKm.toLocaleString()} km`)],
                  ["Yanacaq", items.map((item) => item.fuelType)],
                  ["Ötürücü", items.map((item) => item.transmission)],
                  ["VIN", items.map((item) => (item.vinVerified ? "Bəli" : "Xeyr"))],
                  ["Satıcı", items.map((item) => (item.sellerVerified ? "Bəli" : "Xeyr"))]
                ].map(([label, values]) => (
                  <tr key={String(label)}>
                    <td className="px-4 py-3 font-medium text-slate-500">{label}</td>
                    {(values as string[]).map((value, index) => (
                      <td key={`${label}-${index}`} className="px-4 py-3 text-slate-900">{value}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-center">
            <Link href="/listings" className="btn-secondary text-sm">← Bütün elanlara qayıt</Link>
          </div>
        </>
      )}
    </div>
  );
}
