import { UserManagementTable } from "@/components/admin/user-management-table";
import { listAdminUsers } from "@/server/admin-store";

export default async function AdminUsersPage() {
  const users = await listAdminUsers(200);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900">İstifadəçilərin idarə olunması</h2>
        <p className="mt-1 text-sm text-slate-500">
          Rolların və hesab statuslarının canlı dəyişdirilməsi. Dəyişikliklər dərhal tətbiq olunur.
        </p>
      </div>
      <UserManagementTable users={users} />
    </div>
  );
}
