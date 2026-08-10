import { getBundles } from "@/actions/bundles";
import { getSettings } from "@/actions/settings";
import { InvoiceForm } from "@/components/invoices/invoice-form";
import { PageHeader } from "@/components/shared/page-header";

export default async function NewInvoicePage() {
  // Provide a fallback for settings if not yet configured
  let settings;
  try {
    settings = await getSettings();
  } catch (error) {
    settings = { default_gst_rate: 5 };
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Invoice"
        description="Generate a new invoice for INFI Clothings."
      />

      <InvoiceForm 
        defaultGstRate={settings?.default_gst_rate || 5} 
        settings={settings}
      />
    </div>
  );
}
