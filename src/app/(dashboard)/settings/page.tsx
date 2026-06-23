import { getSettings } from "@/actions/settings";
import { SettingsForm } from "@/components/settings/settings-form";
import { PageHeader } from "@/components/shared/page-header";

export default async function SettingsPage() {
  let settings;
  try {
    settings = await getSettings();
  } catch (error) {
    settings = null;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Company Settings"
        description="Manage your business profile, tax details, and billing preferences."
      />
      
      <SettingsForm initialSettings={settings} />
    </div>
  );
}
