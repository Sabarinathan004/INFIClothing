import { getCustomers } from "@/actions/customers";
import { CustomerList } from "@/components/customers/customer-list";
import { PageHeader } from "@/components/shared/page-header";
import { AddCustomerDialog } from "@/components/customers/add-customer-dialog";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function CustomersPage() {
  return (
    <div>
      <PageHeader
        title="Customers"
        description="Manage your customer directory and view ledgers."
        action={
          <AddCustomerDialog />
        }
      />
      
      <Suspense fallback={<CustomersSkeleton />}>
        <CustomersContent />
      </Suspense>
    </div>
  );
}

function CustomersSkeleton() {
  return (
    <div className="space-y-4 mt-6">
      <Skeleton className="h-10 w-full md:w-1/3" />
      <Skeleton className="h-64 w-full rounded-md" />
    </div>
  );
}

async function CustomersContent() {
  const { data: customers } = await getCustomers();
  return <CustomerList initialCustomers={customers} />;
}
