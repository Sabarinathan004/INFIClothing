import { getCustomerById } from "@/actions/customers";
import { getInvoicesByCustomer } from "@/actions/invoices";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { notFound } from "next/navigation";

export default async function CustomerLedgerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  
  try {
    const customer = await getCustomerById(resolvedParams.id);
    const invoices = await getInvoicesByCustomer(resolvedParams.id);

    const totalPurchases = invoices.reduce((sum, inv) => sum + Number(inv.grand_total), 0);
    const totalPaid = invoices.reduce((sum, inv) => sum + Number(inv.paid_amount), 0);
    const outstanding = invoices.reduce((sum, inv) => sum + Number(inv.balance_amount), 0);

    return (
      <div className="space-y-6">
        <PageHeader
          title={customer.name}
          description="Customer Profile & Ledger"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Purchases</CardDescription>
              <CardTitle className="text-2xl">{formatCurrency(totalPurchases)}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{invoices.length} invoices generated</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Paid</CardDescription>
              <CardTitle className="text-2xl text-emerald-600 dark:text-emerald-400">
                {formatCurrency(totalPaid)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-destructive/20 bg-destructive/5">
            <CardHeader className="pb-2">
              <CardDescription>Outstanding Balance</CardDescription>
              <CardTitle className="text-2xl text-destructive">
                {formatCurrency(outstanding)}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <span className="text-muted-foreground block mb-1">Mobile Number</span>
                  <span className="font-medium">{customer.mobile || "Not provided"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">GST Number</span>
                  <span className="font-medium uppercase">{customer.gst_number || "Not provided"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">Email Address</span>
                  <span className="font-medium">{customer.email || "Not provided"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">Address</span>
                  <span className="font-medium whitespace-pre-wrap">{customer.address || "Not provided"}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Invoice History</CardTitle>
                <CardDescription>Recent transactions for this customer</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                          No invoices found for this customer.
                        </TableCell>
                      </TableRow>
                    ) : (
                      invoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                          <TableCell>{formatDate(invoice.invoice_date)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(Number(invoice.grand_total))}</TableCell>
                          <TableCell className="text-right">
                            {Number(invoice.balance_amount) > 0 ? (
                              <span className="text-destructive font-medium">
                                {formatCurrency(Number(invoice.balance_amount))}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(invoice.payment_status)} variant="outline">
                              {invoice.payment_status === 'partial' ? 'Partially Paid' : invoice.payment_status.charAt(0).toUpperCase() + invoice.payment_status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" asChild>
                              <Link href={`/invoices/${invoice.id}`}>
                                <ExternalLink className="h-4 w-4" />
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    notFound();
  }
}
