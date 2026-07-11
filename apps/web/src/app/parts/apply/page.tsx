import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/auth";
import { getUserProfile } from "@/server/user-store";
import { PartsApplyForm } from "@/components/business/parts-apply-form";

export default async function PartsApplyPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login?next=/parts/apply");

  const profile = await getUserProfile(user.id);

  return (
    <PartsApplyForm
      accountEmail={user.email}
      accountPhone={profile?.phone}
    />
  );
}
