import { getInvoices } from "@/actions/invoices";
import { InvoiceList } from "@/components/invoices/invoice-list";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export default async function InvoicesPage() {
  const invoices = await getInvoices();

  return (
    <div>
      <PageHeader
        title="Invoices"
        description="Manage your sales invoices and track payments."
        action={
          <Button asChild>
            <Link href="/invoices/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Invoice
            </Link>
          </Button>
        }
      />
      
      <InvoiceList initialInvoices={invoices} />
    </div>
  );
}
