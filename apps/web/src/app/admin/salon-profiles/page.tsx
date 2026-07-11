import { BusinessProfilesScreen } from "@/components/admin/business-profiles-screen";
import { requirePageRoles } from "@/lib/rbac";

export default async function AdminSalonProfilesPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const auth = await requirePageRoles(["admin", "support"]);
  const canEdit = auth.ok && auth.user.role === "admin";

  return <BusinessProfilesScreen profileType="dealer" searchParams={params} canEdit={canEdit} />;
}
