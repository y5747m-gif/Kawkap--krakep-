import AdminSettingsForm from "@/components/admin/SettingsForm";
import { getAllSettings, getOwnerWhatsappIntl, getCustomListingFields } from "@/lib/settings";
import { SETTING_KEYS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata = { title: "إعدادات المنصة" };

export default async function AdminSettingsPage() {
  const settings = getAllSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-planet-950 sm:text-2xl">إعدادات المنصة</h1>
        <p className="mt-1 text-sm text-planet-600">
          الإعدادات المركزية — رقم واتساب المالك، الخانات الإضافية، سياسة النشر، والبيانات التجريبية
        </p>
      </div>

      <AdminSettingsForm
        initial={{
          ownerWhatsapp: settings[SETTING_KEYS.OWNER_WHATSAPP] ?? "01013178718",
          requireApproval: settings[SETTING_KEYS.REQUIRE_APPROVAL] === "true",
          demoMode: settings[SETTING_KEYS.DEMO_MODE] !== "false",
          currentIntl: getOwnerWhatsappIntl(),
          customFields: getCustomListingFields(),
        }}
      />
    </div>
  );
}
