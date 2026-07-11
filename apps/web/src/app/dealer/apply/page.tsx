import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/auth";
import { getUserProfile } from "@/server/user-store";
import { DealerApplyForm } from "@/components/business/dealer-apply-form";

export default async function DealerApplyPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login?next=/dealer/apply");

  const profile = await getUserProfile(user.id);

  return (
    <DealerApplyForm
      accountEmail={user.email}
      accountPhone={profile?.phone}
    />
  );
}
