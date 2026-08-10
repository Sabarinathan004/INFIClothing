import { getInvoices } from "@/actions/invoices";
import { InvoiceList } from "@/components/invoices/invoice-list";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function InvoicesPage() {
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
      
      <Suspense fallback={<InvoicesSkeleton />}>
        <InvoicesContent />
      </Suspense>
    </div>
  );
}

function InvoicesSkeleton() {
  return (
    <div className="space-y-4 mt-6">
      <Skeleton className="h-10 w-full md:w-1/3" />
      <Skeleton className="h-64 w-full rounded-md" />
    </div>
  );
}

async function InvoicesContent() {
  const invoices = await getInvoices();
  return <InvoiceList initialInvoices={invoices} />;
}
