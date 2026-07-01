"use client";

import Link from "next/link";
import { useState } from "react";

export function PrivacyControls({ variant = "full" }: { variant?: "full" | "compact" }) {
  const [exporting, setExporting] = useState(false);
  const [requesting, setRequesting] = useState<null | "deletion" | "rectification" | "objection">(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  async function downloadExport() {
    setExporting(true);
    setFeedback(null);
    setIsError(false);
    try {
      const response = await fetch("/api/user/data-export", { method: "GET" });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || "Məlumat ixracı alınmadı.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ekomobil-data-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setFeedback("Məlumat ixracı yükləndi.");
      setIsError(false);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Məlumat ixracı zamanı xəta baş verdi.");
      setIsError(true);
    } finally {
      setExporting(false);
    }
  }

  async function createPrivacyRequest(type: "deletion" | "rectification" | "objection") {
    setRequesting(type);
    setFeedback(null);
    setIsError(false);
    try {
      const payloadByType = {
        deletion: {
          requestType: "data_deletion",
          subject: "Məlumat silinmə sorğusu",
          message:
            "Hesabımla bağlı şəxsi məlumatların silinməsi prosesini başladın. Hüquqi saxlama öhdəliklərinə görə saxlanacaq məlumatlar varsa, onları ayrıca izah edin."
        },
        rectification: {
          requestType: "data_rectification",
          subject: "Məlumat düzəliş sorğusu",
          message:
            "Hesab məlumatlarımda düzəliş ehtiyacı var. Dəyişiklik üçün lazım olan addımları və doğrulama tələblərini mənə göndərin."
        },
        objection: {
          requestType: "data_processing_objection",
          subject: "Məlumat emalına etiraz sorğusu",
          message:
            "Məlumatlarımın müəyyən emal məqsədlərinə etiraz edirəm. Hansı emal kateqoriyalarını dayandırdığınızı və hansı hüquqi əsasla davam etdirdiyinizi yazılı təsdiqləyin."
        }
      }[type];

      const response = await fetch("/api/support/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadByType)
      });
      const result = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Sorğu göndərilmədi.");
      }
      setFeedback("Sorğunuz qəbul edildi. Komandamız bu sorğunu prioritetləndirəcək.");
      setIsError(false);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Sorğu göndərilərkən xəta baş verdi.");
      setIsError(true);
    } finally {
      setRequesting(null);
    }
  }

  return (
    <div className={`space-y-4 rounded-2xl border border-white/10 bg-[#141419] ${variant === "compact" ? "p-0 border-0 bg-transparent" : "p-5"}`}>
      <div>
        <h2 className={`font-semibold text-white ${variant === "compact" ? "text-sm" : "text-base"}`}>
          {variant === "compact" ? "Məlumat ixracı" : "Məlumat hüquqları alətləri"}
        </h2>
        <p className={`mt-1 text-white/50 ${variant === "compact" ? "text-xs" : "text-sm"}`}>
          {variant === "compact"
            ? "Hesab məlumatlarınızı JSON formatında yükləyin."
            : "Buradan məlumat ixracı edə və məxfilik hüquqları üzrə rəsmi sorğu yarada bilərsiniz."}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={downloadExport} disabled={exporting} className="btn-primary text-sm">
          {exporting ? "Yüklənir..." : "Məlumatlarımı JSON yüklə"}
        </button>
        {variant === "full" && (
          <>
        <button
          type="button"
          onClick={() => void createPrivacyRequest("deletion")}
          disabled={requesting !== null}
          className="btn-secondary text-sm"
        >
          {requesting === "deletion" ? "Göndərilir..." : "Silinmə sorğusu"}
        </button>
        <button
          type="button"
          onClick={() => void createPrivacyRequest("rectification")}
          disabled={requesting !== null}
          className="btn-secondary text-sm"
        >
          {requesting === "rectification" ? "Göndərilir..." : "Düzəliş sorğusu"}
        </button>
        <button
          type="button"
          onClick={() => void createPrivacyRequest("objection")}
          disabled={requesting !== null}
          className="btn-secondary text-sm"
        >
          {requesting === "objection" ? "Göndərilir..." : "Emala etiraz sorğusu"}
        </button>
          </>
        )}
      </div>
      {variant === "compact" && (
        <Link href="/me/privacy" className="inline-block text-xs font-medium text-[#0057FF] hover:underline">
          Düzəliş, silinmə və digər məxfilik sorğuları →
        </Link>
      )}
      {feedback && (
        <p className={`text-sm ${isError ? "text-rose-600" : "text-emerald-300"}`}>
          {feedback}
        </p>
      )}
    </div>
  );
}
