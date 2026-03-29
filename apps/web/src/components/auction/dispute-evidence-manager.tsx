"use client";

import { FormEvent, useEffect, useState } from "react";
import type { AuctionListingDocumentRecord } from "@/lib/auction-documents";

interface Props {
  auctionId: string;
  uploaderRole: "buyer" | "seller";
}

const ROLE_LABELS = {
  buyer: "Alıcı",
  seller: "Satıcı",
};

const ROLE_COLORS = {
  buyer: "bg-blue-50 border-blue-200 text-blue-900",
  seller: "bg-amber-50 border-amber-200 text-amber-900",
};

const ROLE_BADGE = {
  buyer: "bg-blue-100 text-blue-800",
  seller: "bg-amber-100 text-amber-800",
};

export function DisputeEvidenceManager({ auctionId, uploaderRole }: Props) {
  const [docs, setDocs] = useState<AuctionListingDocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function loadDocs() {
    setLoading(true);
    try {
      const res = await fetch(`/api/auctions/${auctionId}/dispute-evidence`);
      const data = (await res.json()) as { ok: boolean; documents?: AuctionListingDocumentRecord[] };
      if (data.ok && data.documents) setDocs(data.documents);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadDocs(); }, [auctionId]);

  async function onUpload(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const form = ev.currentTarget;
    const input = form.querySelector<HTMLInputElement>('input[type="file"]');
    if (!input?.files?.[0]) return;

    setUploading(true);
    setError(null);
    setSuccess(null);

    const body = new FormData();
    body.append("file", input.files[0]);

    const res = await fetch(`/api/auctions/${auctionId}/dispute-evidence`, {
      method: "POST",
      body,
    });
    const data = (await res.json()) as { ok: boolean; error?: string };

    if (!data.ok) {
      setError(data.error ?? "Yükləmə uğursuz oldu.");
    } else {
      setSuccess("Sübut faylı uğurla əlavə edildi.");
      form.reset();
      void loadDocs();
    }
    setUploading(false);
  }

  const mine = docs.filter((d) => d.uploaderRole === uploaderRole);
  const theirs = docs.filter((d) => d.uploaderRole !== uploaderRole);
  const otherRole = uploaderRole === "buyer" ? "seller" : "buyer";

  return (
    <div className="space-y-6">
      {/* Upload panel */}
      <div className={`rounded-2xl border p-5 ${ROLE_COLORS[uploaderRole]}`}>
        <div className="mb-3">
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${ROLE_BADGE[uploaderRole]}`}>
            {ROLE_LABELS[uploaderRole]} tərəfi
          </span>
          <p className="mt-2 text-sm font-medium">Sübut faylı yükləyin</p>
          <p className="mt-1 text-xs opacity-80">
            Fotoşəkil, PDF sənəd, mesajlaşma ekranı — mübahisənizlə bağlı hər hansı dəlil. Yalnız ops komandası görür.
          </p>
        </div>
        <form onSubmit={(ev) => void onUpload(ev)} className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            required
            className="block flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1 file:text-sm file:font-medium"
          />
          <button
            type="submit"
            disabled={uploading}
            className="btn-primary shrink-0 justify-center disabled:opacity-50"
          >
            {uploading ? "Yüklənir..." : "Əlavə et"}
          </button>
        </form>
        {error && (
          <p className="mt-2 text-xs font-medium text-red-700">{error}</p>
        )}
        {success && (
          <p className="mt-2 text-xs font-medium text-emerald-700">{success}</p>
        )}
      </div>

      {/* My uploaded evidence */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-3 text-sm font-semibold text-slate-900">
          Sizin sübutlarınız ({mine.length})
        </div>
        {loading ? (
          <div className="px-5 py-8 text-center text-sm text-slate-500">Yüklənir...</div>
        ) : mine.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-slate-500">
            Hələ sübut yükləməmisiniz.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {mine.map((doc) => (
              <li key={doc.id} className="flex items-center gap-3 px-5 py-3">
                <FileIcon mime={doc.mimeType} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{doc.originalFilename}</p>
                  <p className="text-xs text-slate-400">{(doc.byteSize / 1024).toFixed(1)} KB · {new Date(doc.createdAt).toLocaleString("az-AZ")}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Other side's evidence */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-3 text-sm font-semibold text-slate-900">
          {ROLE_LABELS[otherRole]} tərəfinin sübutları ({theirs.length})
        </div>
        {loading ? (
          <div className="px-5 py-8 text-center text-sm text-slate-500">Yüklənir...</div>
        ) : theirs.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-slate-500">
            Qarşı tərəf hələ sübut yükləməyib.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {theirs.map((doc) => (
              <li key={doc.id} className="flex items-center gap-3 px-5 py-3">
                <FileIcon mime={doc.mimeType} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{doc.originalFilename}</p>
                  <p className="text-xs text-slate-400">{(doc.byteSize / 1024).toFixed(1)} KB · {new Date(doc.createdAt).toLocaleString("az-AZ")}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-xs text-slate-400">
        Yüklənmiş fayllar yalnız ops komandası tərəfindən baxılır. Saytda ictimai olaraq göstərilmir.
      </p>
    </div>
  );
}

function FileIcon({ mime }: { mime: string }) {
  const isPdf = mime === "application/pdf";
  return (
    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${isPdf ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"}`}>
      {isPdf ? "PDF" : "IMG"}
    </div>
  );
}
