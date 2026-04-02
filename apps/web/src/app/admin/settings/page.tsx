import { SystemSettingsForm } from "@/components/admin/system-settings-form";
import { getSystemSettings } from "@/server/system-settings-store";

export default async function AdminSettingsPage() {
  const settings = await getSystemSettings();
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Sistem ayarları</h2>
        <p className="mt-1 text-sm text-slate-500">
          Auksion risk siyasəti və öhdəlik parametrlərinin mərkəzi idarəsi.
        </p>
      </div>
      <SystemSettingsForm
        auctionMode={settings.auctionMode}
        vehiclePenalty={settings.penaltyAmounts.vehicle}
        partPenalty={settings.penaltyAmounts.part}
      />
    </div>
  );
}
