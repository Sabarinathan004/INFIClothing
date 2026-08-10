import { getBundles } from "@/actions/bundles";
import { getSettings } from "@/actions/settings";
import { getInvoiceById } from "@/actions/invoices";
import { InvoiceForm } from "@/components/invoices/invoice-form";
import { PageHeader } from "@/components/shared/page-header";
import { notFound } from "next/navigation";

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  let invoice;
  try {
    invoice = await getInvoiceById(resolvedParams.id);
  } catch (error) {
    notFound();
  }

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
        title={`Edit Invoice ${invoice.invoice_number}`}
        description="Modify existing invoice details."
      />

      <InvoiceForm 
        defaultGstRate={settings?.default_gst_rate || 5}
        initialData={invoice}
        invoiceId={invoice.id}
        settings={settings}
      />
    </div>
  );
}
