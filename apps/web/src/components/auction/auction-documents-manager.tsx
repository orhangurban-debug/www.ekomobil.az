"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useConfirm } from "@/components/ui/confirm-dialog-provider";
import type { AuctionListingDocumentRecord } from "@/lib/auction-documents";
import {
  AUCTION_DOCUMENT_MAX_BYTES,
  AUCTION_DOCUMENT_STATUS_LABELS,
  AUCTION_DOCUMENT_TYPE_LABELS,
  AUCTION_DOCUMENT_TYPES
} from "@/lib/auction-documents";

export function AuctionDocumentsManager({
  auctionId,
  lotTitle
}: {
  auctionId: string;
  lotTitle: string;
}) {
  const [documents, setDocuments] = useState<AuctionListingDocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [docType, setDocType] = useState<string>(AUCTION_DOCUMENT_TYPES[0]);
  const [file, setFile] = useState<File | null>(null);
  const confirm = useConfirm();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/auctions/${auctionId}/documents`);
      const data = (await res.json()) as { ok: boolean; documents?: AuctionListingDocumentRecord[]; error?: string };
      if (!data.ok) {
        setError(data.error || "Siyahı alınmadı");
        setDocuments([]);
      } else {
        setDocuments(data.documents ?? []);
      }
    } catch {
      setError("Sənəd siyahısı yüklənərkən xəta baş verdi.");
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [auctionId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function onUpload(e: FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Fayl seçin");
      return;
    }
    if (file.size > AUCTION_DOCUMENT_MAX_BYTES) {
      setError(`Fayl çox böyükdür (maks. ${AUCTION_DOCUMENT_MAX_BYTES / (1024 * 1024)} MB)`);
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("docType", docType);
      const res = await fetch(`/api/auctions/${auctionId}/documents`, { method: "POST", body: form });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!data.ok) {
        setError(data.error || "Yükləmə alınmadı");
        return;
      }
      setFile(null);
      await load();
    } catch {
      setError("Fayl yüklənərkən xəta baş verdi.");
    } finally {
      setUploading(false);
    }
  }

  async function onDelete(docId: string) {
    const confirmed = await confirm({ message: "Bu sənədi silmək istəyirsiniz?", confirmLabel: "Sil", danger: true });
    if (!confirmed) return;
    setError(null);
    try {
      const res = await fetch(`/api/auctions/${auctionId}/documents/${docId}`, { method: "DELETE" });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!data.ok) {
        setError(data.error || "Silinmədi");
        return;
      }
      await load();
    } catch (err) {
      console.error("document delete error:", err);
      setError("Şəbəkə xətası baş verdi. Yenidən cəhd edin.");
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Lot sənədləri</h2>
        <p className="mt-1 text-sm text-slate-500">{lotTitle}</p>
        <p className="mt-2 text-xs text-slate-500">
          Tələb olunan sənədləri özünüz yükləyirsiniz. Yalnız PDF, JPEG, PNG və WebP; maks.{" "}
          {AUCTION_DOCUMENT_MAX_BYTES / (1024 * 1024)} MB / fayl.
        </p>
      </div>

      <form onSubmit={(ev) => void onUpload(ev)} className="rounded-2xl border border-slate-900/10 bg-white p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Sənəd növü</label>
            <select className="input-field" value={docType} onChange={(e) => setDocType(e.target.value)}>
              {AUCTION_DOCUMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {AUCTION_DOCUMENT_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Fayl</label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
              className="input-field text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[#0057FF]/10 file:px-3 file:py-2 file:text-sm file:font-medium file:text-[#0057FF]"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
        </div>
        <button type="submit" disabled={uploading || !file} className="btn-primary mt-4 justify-center disabled:opacity-50">
          {uploading ? "Yüklənir..." : "Yüklə"}
        </button>
      </form>

      {error && (
        <div className="rounded-xl alert-danger border px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="rounded-2xl border border-slate-900/10 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-3 text-sm font-semibold text-slate-900">Yüklənmiş sənədlər</div>
        {loading ? (
          <div className="px-5 py-10 text-center text-sm text-slate-500">Yüklənir...</div>
        ) : documents.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-slate-500">Hələ sənəd yoxdur.</div>
        ) : (
          <ul className="divide-y divide-slate-900/10">
            {documents.map((doc) => (
              <li key={doc.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                  <div className="truncate font-medium text-slate-900">{doc.originalFilename}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    {AUCTION_DOCUMENT_TYPE_LABELS[doc.docType]} · {AUCTION_DOCUMENT_STATUS_LABELS[doc.status]}
                    {doc.opsNote ? ` · ${doc.opsNote}` : ""}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`/api/auctions/${auctionId}/documents/${doc.id}/file`}
                    className="btn-secondary text-sm"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Yüklə / bax
                  </a>
                  {doc.status === "pending_review" && (
                    <button type="button" className="btn-secondary text-sm text-rose-700" onClick={() => void onDelete(doc.id)}>
                      Sil
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
