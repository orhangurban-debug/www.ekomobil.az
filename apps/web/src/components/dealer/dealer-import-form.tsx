"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

const sampleCsv = `title,description,make,model,year,city,priceAzn,mileageKm,fuelType,transmission,vin
Toyota Camry 2020,Tam baxımlı sedan,Toyota,Camry,2020,Bakı,28500,64000,Benzin,Avtomat,4T1G11AK1LU123456`;

export function DealerImportForm() {
  const [csv, setCsv] = useState(sampleCsv);
  const [result, setResult] = useState<{ created?: number; errors?: string[]; error?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch("/api/dealer/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv })
      });
      const payload = (await response.json()) as { ok?: boolean; created?: number; errors?: string[]; error?: string };
      if (!response.ok || payload.ok === false) {
        setResult({ created: 0, errors: payload.errors, error: payload.error ?? "CSV idxalı mümkün olmadı." });
        return;
      }
      setResult({ created: payload.created, errors: payload.errors });
    } catch (err) {
      console.error("dealer import error:", err);
      setResult({ created: 0, error: "Şəbəkə xətası baş verdi. Yenidən cəhd edin." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">CSV idxalı</h1>
          <p className="mt-1 text-sm text-slate-500">Toplu inventar yükləmə</p>
        </div>
        <Link href="/dealer" className="btn-secondary text-sm">Salon paneli</Link>
      </div>

      <form onSubmit={onSubmit} className="card space-y-5 p-6">
        <div className="rounded-xl bg-slate-50 p-4 text-xs text-slate-500">
          Başlıq: <code>title,description,make,model,year,city,priceAzn,mileageKm,fuelType,transmission,vin</code>
        </div>
        <textarea
          className="input-field min-h-[260px] font-mono text-xs"
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
        />
        <button className="btn-primary" disabled={loading}>
          {loading ? "İmport edilir..." : "İmport et"}
        </button>

        {result && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-medium text-slate-900">Yaradılan elan sayı: {result.created ?? 0}</div>
            {result.error && <div className="mt-2 text-sm text-red-700">{result.error}</div>}
            {result.errors && result.errors.length > 0 && (
              <ul className="mt-3 space-y-1 text-sm text-red-700">
                {result.errors.map((error) => (
                  <li key={error}>• {error}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
