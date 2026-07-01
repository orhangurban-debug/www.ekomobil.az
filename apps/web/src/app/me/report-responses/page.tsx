import Link from "next/link";
import { redirect } from "next/navigation";
import { ReportDefensePanel } from "@/components/user/report-defense-panel";
import { getServerSessionUser } from "@/lib/auth";
import { listPendingDefenseReportsForUser } from "@/server/user-report-store";

export const metadata = {
  title: "Şikayət cavabları | EkoMobil",
  description: "Sizə qarşı daxil edilmiş şikayətlərə müdafiə sübutu təqdim edin"
};

export default async function ReportResponsesPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login?next=/me/report-responses");

  const reports = await listPendingDefenseReportsForUser(user.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/me" className="text-sm text-[#0057FF] hover:underline">
        ← Profilə qayıt
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-white">Şikayət cavabları</h1>
      <p className="mt-2 text-sm text-white/65">
        Sizə qarşı daxil edilmiş şikayətlərə müdafiə sübutu ilə cavab verin. Hər iki tərəfin sübutu yoxlanılır; müdafiə
        verilməsə, iş qanuni qaydada hüquq-mühafizə orqanlarına ötürülə bilər.
      </p>
      <div className="mt-6">
        <ReportDefensePanel reports={reports} />
      </div>
    </div>
  );
}
