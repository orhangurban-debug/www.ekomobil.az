import Link from "next/link";
import { redirect } from "next/navigation";
import { DeepKycForm } from "@/components/user/deep-kyc-form";
import { getServerSessionUser } from "@/lib/auth";
import { getUserKycProfile } from "@/server/user-kyc-store";

export default async function ProfileKycPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login?next=/me/kyc");

  const profile = await getUserKycProfile(user.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <nav className="mb-6 text-sm text-white/50">
        <Link href="/me" className="hover:text-white">
          Profil
        </Link>
        <span className="mx-2">/</span>
        <span className="text-white">Dərin identifikasiya</span>
      </nav>

      <DeepKycForm
        initialStatus={profile?.status ?? "not_submitted"}
        initialLegalName={profile?.legalName}
        initialNationalIdLast4={profile?.nationalIdLast4}
        initialDocumentRef={profile?.documentRef}
        reviewNote={profile?.reviewNote}
      />
    </div>
  );
}
