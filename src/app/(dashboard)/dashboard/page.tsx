import { getDashboardStats } from "@/actions/dashboard";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, getStatusColor, getStatusLabel } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, IndianRupee, Users, FileText, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ErrorAlert } from "@/components/shared/error-alert";
import { OutstandingBalanceCard } from "@/components/dashboard/outstanding-balance-card";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { SupabaseHeartbeatPing } from "@/components/shared/supabase-heartbeat-ping";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <SupabaseHeartbeatPing />
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-0 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3.5 sm:p-5 pb-1 sm:pb-2">
              <Skeleton className="h-4 w-20 sm:w-24" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </CardHeader>
            <CardContent className="p-3.5 sm:p-5 pt-0">
              <Skeleton className="h-6 sm:h-8 w-3/4 mb-1.5" />
              <Skeleton className="h-3.5 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-6 sm:mt-8">
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. Total Sales */}
        <Link
          href="/invoices"
          className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
        >
          <Card className="p-0 overflow-hidden group hover:border-blue-500/50 hover:shadow-md transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3.5 sm:p-5 pb-1 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground truncate pr-1">
                Total Sales
              </CardTitle>
              <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 shrink-0 group-hover:scale-105 transition-transform">
                <IndianRupee className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="p-3.5 sm:p-5 pt-0">
              <div
                className="text-base sm:text-xl lg:text-2xl font-bold tracking-tight truncate"
                title={formatCurrency(stats.totalSales)}
              >
                {formatCurrency(stats.totalSales, { compactDecimals: true })}
              </div>
              <div className="flex items-center justify-between text-[11px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                <span className="truncate">Across {stats.invoiceCount} invoices</span>
                <span className="text-blue-600 dark:text-blue-400 font-medium inline-flex items-center gap-0.5 shrink-0 ml-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
                  &rarr;
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* 2. Amount Received */}
        <Link
          href="/invoices"
          className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
        >
          <Card className="p-0 overflow-hidden group hover:border-emerald-500/50 hover:shadow-md transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3.5 sm:p-5 pb-1 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground truncate pr-1">
                Amount Received
              </CardTitle>
              <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
                <ArrowUpRight className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="p-3.5 sm:p-5 pt-0">
              <div
                className="text-base sm:text-xl lg:text-2xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight truncate"
                title={formatCurrency(stats.totalReceived)}
              >
                {formatCurrency(stats.totalReceived, { compactDecimals: true })}
              </div>
              <div className="flex items-center justify-between text-[11px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                <span className="truncate">Total collected</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium inline-flex items-center gap-0.5 shrink-0 ml-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
                  &rarr;
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* 3. Outstanding Balance */}
        <OutstandingBalanceCard totalOutstanding={stats.totalOutstanding} />

        {/* 4. Total Customers */}
        <Link
          href="/customers"
          className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
        >
          <Card className="p-0 overflow-hidden group hover:border-violet-500/50 hover:shadow-md transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3.5 sm:p-5 pb-1 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground truncate pr-1">
                Total Customers
              </CardTitle>
              <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400 shrink-0 group-hover:scale-105 transition-transform">
                <Users className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="p-3.5 sm:p-5 pt-0">
              <div
                className="text-base sm:text-xl lg:text-2xl font-bold tracking-tight truncate"
                title={stats.customersCount.toString()}
              >
                {stats.customersCount}
              </div>
              <div className="flex items-center justify-between text-[11px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                <span className="truncate">In directory</span>
                <span className="text-violet-600 dark:text-violet-400 font-medium inline-flex items-center gap-0.5 shrink-0 ml-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
                  &rarr;
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-6 sm:mt-8">
        {/* Recent Invoices Card */}
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6 pb-2 sm:pb-3">
            <div>
              <CardTitle className="text-base sm:text-lg">Recent Invoices</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Latest generated invoices.</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/invoices">View All</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            {stats.recentInvoices.length === 0 ? (
              <div className="text-center text-muted-foreground py-8 text-sm">
                No recent invoices.
              </div>
            ) : (
              <>
                {/* Mobile View: Stacked touch items (Zero horizontal table scrolling) */}
                <div className="md:hidden divide-y divide-border/60">
                  {stats.recentInvoices.map((inv) => (
                    <Link
                      key={inv.id}
                      href={`/invoices/${inv.id}`}
                      className="flex items-center justify-between py-3 first:pt-0 last:pb-0 hover:bg-muted/40 transition-colors -mx-1 px-1 rounded-lg"
                    >
                      <div className="min-w-0 pr-3">
                        <p className="font-semibold text-sm text-primary truncate">
                          {inv.invoice_number}
                        </p>
                        <p className="text-xs font-semibold text-foreground truncate mt-0.5">
                          {(inv as any).legal_name || inv.customer_name}
                        </p>
                        {(inv as any).trade_name && (inv as any).trade_name.toUpperCase() !== ((inv as any).legal_name || inv.customer_name).toUpperCase() && (
                          <p className="text-[11px] font-bold text-foreground truncate uppercase">
                            {(inv as any).trade_name}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end shrink-0 gap-1">
                        <span className="text-sm font-bold">
                          {formatCurrency(inv.grand_total)}
                        </span>
                        <Badge className={`${getStatusColor(inv.payment_status)} text-[10px] px-1.5 py-0`} variant="outline">
                          {getStatusLabel(inv.payment_status)}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Desktop View: Wide Table */}
                <div className="hidden md:block overflow-x-auto">
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
                      {stats.recentInvoices.map((inv) => (
                        <TableRow key={inv.id}>
                          <TableCell className="font-medium">
                            <Link href={`/invoices/${inv.id}`} className="hover:underline text-primary">
                              {inv.invoice_number}
                            </Link>
                          </TableCell>
                          <TableCell className="max-w-[200px]">
                            <div className="font-semibold text-foreground truncate">
                              {(inv as any).legal_name || inv.customer_name}
                            </div>
                            {(inv as any).trade_name && (inv as any).trade_name.toUpperCase() !== ((inv as any).legal_name || inv.customer_name).toUpperCase() && (
                              <div className="text-[11px] font-bold text-foreground truncate uppercase">
                                {(inv as any).trade_name}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(inv.grand_total)}</TableCell>
                          <TableCell className="text-center">
                            <Badge className={getStatusColor(inv.payment_status)} variant="outline">
                              {getStatusLabel(inv.payment_status)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions Card */}
        <Card className="overflow-hidden">
          <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3">
            <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Common tasks to speed up your workflow.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2.5 sm:gap-4 p-4 sm:p-6 pt-0">
            <Button
              variant="outline"
              className="h-20 sm:h-24 flex flex-col items-center justify-center gap-1.5 p-2 sm:p-4 text-center whitespace-normal rounded-xl hover:bg-accent/80 active:scale-[0.98]"
              asChild
            >
              <Link href="/customers">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground shrink-0" />
                <span className="text-xs sm:text-sm font-medium leading-tight">Add Customer</span>
              </Link>
            </Button>
            <Button
              variant="outline"
              className="h-20 sm:h-24 flex flex-col items-center justify-center gap-1.5 p-2 sm:p-4 text-center whitespace-normal rounded-xl hover:bg-accent/80 active:scale-[0.98]"
              asChild
            >
              <Link href="/bundles">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground shrink-0" />
                <span className="text-xs sm:text-sm font-medium leading-tight">Manage Bundles</span>
              </Link>
            </Button>
            <Button
              variant="outline"
              className="h-12 sm:h-14 flex items-center justify-center gap-2 p-2 sm:p-4 text-center col-span-2 rounded-xl bg-primary/5 hover:bg-primary/10 border-primary/20 active:scale-[0.98]"
              asChild
            >
              <Link href="/invoices/new">
                <Plus className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
                <span className="text-xs sm:text-sm text-primary font-semibold">Create New Invoice</span>
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
