import { getInvoiceById } from "@/actions/invoices";
import { getSettings } from "@/actions/settings";
import { PageHeader } from "@/components/shared/page-header";
import { notFound } from "next/navigation";
import { InvoiceDetailsView } from "@/components/invoices/invoice-details-view";
import { PaymentActions } from "@/components/payments/payment-actions";
import { WhatsAppShare } from "@/components/invoices/whatsapp-share";
import { DownloadPdfButton } from "@/components/invoices/download-pdf-button";
import { DeleteInvoiceButton } from "@/components/invoices/delete-invoice-button";
import { CancelInvoiceButton } from "@/components/invoices/cancel-invoice-button";
import { Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function InvoiceViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  
  try {
    const invoice = await getInvoiceById(resolvedParams.id);
    let settings;
    try {
      settings = await getSettings();
    } catch {
      settings = null;
    }

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 print:hidden">
          <PageHeader
            title={`Invoice ${invoice.invoice_number}`}
          />
          <div className="flex flex-wrap items-center gap-2 shrink-0 -mt-4">
            <PaymentActions invoice={invoice} />
            <Button variant="outline" size="icon" asChild title="Edit Invoice">
              <Link href={`/invoices/${invoice.id}/edit`}>
                <Edit className="h-4 w-4" />
              </Link>
            </Button>
            {invoice.payment_status !== 'cancelled' && <CancelInvoiceButton id={invoice.id} />}
            <DeleteInvoiceButton id={invoice.id} variant="outline" redirectAfterDelete={true} />
            <WhatsAppShare invoice={invoice} settings={settings} />
            <DownloadPdfButton />
          </div>
        </div>

        <InvoiceDetailsView invoice={invoice} settings={settings} />
      </div>
    );
  } catch (error) {
    notFound();
  }
}
