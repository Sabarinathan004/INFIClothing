import { getCustomers } from "@/actions/customers";
import { CustomerList } from "@/components/customers/customer-list";
import { PageHeader } from "@/components/shared/page-header";
import { AddCustomerDialog } from "@/components/customers/add-customer-dialog";

export default async function CustomersPage() {
  const customers = await getCustomers();

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Manage your customer directory and view ledgers."
        action={
          <AddCustomerDialog />
        }
      />
      
      <CustomerList initialCustomers={customers} />
    </div>
  );
}
