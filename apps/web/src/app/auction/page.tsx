import Link from "next/link";

const docs = [
  { title: "Rules Engine", path: "docs/auction/auction-rules-engine.md", desc: "Auction state machine, reserve, increments, resolution logic" },
  { title: "UX Flow", path: "docs/auction/auction-ux-flow.md", desc: "Seller/buyer flow and key auction screens" },
  { title: "Anti-Fraud Policy", path: "docs/auction/auction-anti-fraud.md", desc: "Fraud vectors, controls and ops escalation ladder" },
  { title: "Eligibility Matrix", path: "docs/auction/auction-eligibility-matrix.md", desc: "Pilot launch scope and gating criteria" }
];

export default function AuctionPreviewPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="rounded-[32px] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-brand-950 p-8 text-white shadow-card">
        <span className="inline-flex rounded-full border border-white/15 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/70">
          Design Preview
        </span>
        <h1 className="mt-4 text-4xl font-bold">EkoMobil Auction</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">
          Auction modulu build mərhələsinə keçmədən əvvəl məhsul qaydaları, trust guardrail-ları və UX axını sənədləşdirildi.
        </p>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {docs.map((doc) => (
          <div key={doc.path} className="card p-6">
            <h2 className="text-lg font-semibold text-slate-900">{doc.title}</h2>
            <p className="mt-2 text-sm text-slate-500">{doc.desc}</p>
            <p className="mt-3 text-xs text-slate-400">{doc.path}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex gap-3">
        <Link href="/listings" className="btn-secondary">Marketplace-ə qayıt</Link>
        <Link href="/dealer" className="btn-primary">Dealer dashboard-a keç</Link>
      </div>
    </div>
  );
}
