import { getDashboardStats } from "@/actions/dashboard";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, getStatusColor } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, IndianRupee, Users, FileText, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ErrorAlert } from "@/components/shared/error-alert";
import { OutstandingBalanceCard } from "@/components/dashboard/outstanding-balance-card";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your business performance."
        action={
          <Button asChild>
            <Link href="/invoices/new">
              <Plus className="mr-2 h-4 w-4" />
              New Invoice
            </Link>
          </Button>
        }
      />
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-3/4 mb-1" />
              <Skeleton className="h-3 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    </div>
  );
}

async function DashboardContent() {
  const stats = await getDashboardStats();

  return (
    <>
      {stats.error && <ErrorAlert error={stats.error} />}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalSales)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {stats.invoiceCount} invoices
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Amount Received</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(stats.totalReceived)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total collected payments
            </p>
          </CardContent>
        </Card>
        <OutstandingBalanceCard totalOutstanding={stats.totalOutstanding} />
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.customersCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Registered in directory
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Invoices</CardTitle>
              <CardDescription>Latest generated invoices.</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/invoices">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                      No recent invoices.
                    </TableCell>
                  </TableRow>
                ) : (
                  stats.recentInvoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">
                        <Link href={`/invoices/${inv.id}`} className="hover:underline text-primary">
                          {inv.invoice_number}
                        </Link>
                      </TableCell>
                      <TableCell className="truncate max-w-[150px]">{inv.customer_name}</TableCell>
                      <TableCell className="text-right">{formatCurrency(inv.grand_total)}</TableCell>
                      <TableCell className="text-center">
                        <Badge className={getStatusColor(inv.payment_status)} variant="outline">
                          {inv.payment_status === 'partial' ? 'Partially Paid' : inv.payment_status.charAt(0).toUpperCase() + inv.payment_status.slice(1)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Placeholder for future charts or quick actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks to speed up your workflow.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2" asChild>
              <Link href="/customers">
                <Users className="h-6 w-6 text-muted-foreground" />
                <span>Add Customer</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2" asChild>
              <Link href="/bundles">
                <FileText className="h-6 w-6 text-muted-foreground" />
                <span>Manage Bundles</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2 col-span-2" asChild>
              <Link href="/invoices/new">
                <Plus className="h-6 w-6 text-primary" />
                <span className="text-primary font-medium">Create New Invoice</span>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
