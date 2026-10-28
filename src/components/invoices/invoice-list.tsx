"use client"

import { Invoice } from "@/types";
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Search, Copy, Edit, Calendar as CalendarIcon, Phone, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import { cn, formatCurrency, formatDate, getStatusColor, getStatusLabel } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { duplicateInvoice } from "@/actions/invoices";
import { DeleteInvoiceButton } from "@/components/invoices/delete-invoice-button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { DownloadPdfButton } from "@/components/invoices/download-pdf-button";

interface InvoiceListProps {
  initialInvoices: Invoice[];
}

export function InvoiceList({ initialInvoices }: InvoiceListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [datePreset, setDatePreset] = useState<"all" | "today" | "this_month" | "custom">("all");
  const [isDuplicating, setIsDuplicating] = useState<string | null>(null);
  const debouncedSearch = useDebounce(searchQuery, 300);
  const router = useRouter();

  const setPreset = (preset: "all" | "today" | "this_month" | "custom") => {
    setDatePreset(preset);
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const todayStr = `${year}-${month}-${day}`;

    if (preset === "all") {
      setStartDate("");
      setEndDate("");
    } else if (preset === "today") {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === "this_month") {
      const firstDay = `${year}-${month}-01`;
      const lastDayObj = new Date(year, now.getMonth() + 1, 0);
      const lastDay = `${year}-${month}-${String(lastDayObj.getDate()).padStart(2, "0")}`;
      setStartDate(firstDay);
      setEndDate(lastDay);
    } else if (preset === "custom") {
      if (!startDate) setStartDate(`${year}-${month}-01`);
      if (!endDate) setEndDate(todayStr);
    }
  };

  const filteredInvoices = initialInvoices.filter((inv) => {
    const query = debouncedSearch.toLowerCase();
    const matchesSearch =
      inv.invoice_number.toLowerCase().includes(query) ||
      inv.customer_name.toLowerCase().includes(query) ||
      Boolean(inv.trade_name && inv.trade_name.toLowerCase().includes(query)) ||
      Boolean(inv.legal_name && inv.legal_name.toLowerCase().includes(query)) ||
      Boolean(inv.customer_mobile && inv.customer_mobile.includes(query));

    let matchesDate = true;
    const invDate = inv.invoice_date ? inv.invoice_date.split("T")[0] : "";
    if (startDate && invDate) {
      matchesDate = matchesDate && invDate >= startDate;
    }
    if (endDate && invDate) {
      matchesDate = matchesDate && invDate <= endDate;
    }

    return matchesSearch && matchesDate;
  });

  const handleDuplicate = async (id: string) => {
    setIsDuplicating(id);
    try {
      const result = await duplicateInvoice(id);
      toast.success("Invoice duplicated successfully");
      router.push(`/invoices/${result.id}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to duplicate invoice");
    } finally {
      setIsDuplicating(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Control Strip: Search & Date Filter (100% Mobile Responsive) */}
      <div className="flex flex-col gap-2.5 print:hidden">
        {/* Row 1: Search Input + PDF Download Button */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search invoice #, customer, mobile..."
              className="pl-9 pr-8 h-10 text-sm bg-card"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 text-xs"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="shrink-0">
            <DownloadPdfButton />
          </div>
        </div>

        {/* Row 2: Date Filter Bar with Quick Presets */}
        <div className="flex flex-col gap-2 p-2 sm:p-2.5 bg-muted/40 rounded-xl border border-border/60">
          {/* Full-Width 4-Pill Preset Grid (Never Wraps or Collapses) */}
          <div className="grid grid-cols-4 gap-1 sm:gap-1.5 w-full">
            {(
              [
                { id: "all", label: "All", fullLabel: "All" },
                { id: "today", label: "Today", fullLabel: "Today" },
                { id: "this_month", label: "Month", fullLabel: "This Month" },
                { id: "custom", label: "Custom", fullLabel: "Custom 📅" },
              ] as const
            ).map((p) => {
              const active = datePreset === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPreset(p.id)}
                  className={cn(
                    "h-8 sm:h-9 text-xs rounded-lg font-medium text-center transition-all flex items-center justify-center px-1 sm:px-2 select-none",
                    active
                      ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                      : "bg-card text-muted-foreground hover:bg-accent hover:text-foreground border border-border/40"
                  )}
                >
                  <span className="sm:hidden truncate">{p.label}</span>
                  <span className="hidden sm:inline truncate">{p.fullLabel}</span>
                </button>
              );
            })}
          </div>

          {/* Active Filter Status & Reset Line (Dedicated Row to Prevent Button Collision) */}
          {datePreset !== "all" && (
            <div className="flex items-center justify-between pt-1.5 border-t border-border/40 text-xs">
              <div className="flex items-center gap-1.5 text-muted-foreground min-w-0">
                <span className="text-[11px] text-muted-foreground shrink-0">Filter:</span>
                <span className="font-semibold text-foreground text-[11px] truncate">
                  {datePreset === "today"
                    ? "Today"
                    : datePreset === "this_month"
                    ? "This Month"
                    : `${startDate || "Start"} → ${endDate || "End"}`}
                </span>
                <span className="text-[10px] bg-primary/10 text-primary font-medium px-1.5 py-0.2 rounded-full shrink-0">
                  {filteredInvoices.length} bill{filteredInvoices.length === 1 ? "" : "s"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreset("all")}
                className="text-[11px] text-destructive hover:underline font-semibold flex items-center gap-0.5 shrink-0 px-1 py-0.5"
                title="Reset to All"
              >
                <X className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>
          )}

          {/* Custom Date Pickers ONLY visible when 'Custom' is selected */}
          {datePreset === "custom" && (
            <div className="grid grid-cols-2 gap-2 w-full pt-1.5 border-t border-border/40 animate-in fade-in-50 duration-150">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                  From Date
                </span>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-8 sm:h-9 text-xs bg-card w-full"
                  title="From Date"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                  To Date
                </span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-8 sm:h-9 text-xs bg-card w-full"
                  title="To Date"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile View: Stacked touch-friendly cards (Zero horizontal scroll) */}
      <div className="md:hidden space-y-3">
        {filteredInvoices.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground bg-card rounded-xl border space-y-2">
            <p className="font-semibold text-sm text-foreground">No invoices found</p>
            <p className="text-xs text-muted-foreground">
              {datePreset !== "all"
                ? "No invoices match the selected date range."
                : "No invoices match your search."}
            </p>
            {datePreset !== "all" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreset("all")}
                className="mt-2 text-xs h-8"
              >
                Show All Invoices
              </Button>
            )}
          </div>
        ) : (
          filteredInvoices.map((invoice) => {
            const displayStatus =
              invoice.status === "draft" || invoice.status === "cancelled"
                ? invoice.status
                : invoice.payment_status || invoice.status;

            return (
              <div
                key={invoice.id}
                className="bg-card border rounded-xl p-3 sm:p-3.5 shadow-2xs space-y-2.5 transition-all overflow-hidden"
              >
                {/* Header: Doc Number & Date & Status */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Link
                      href={`/invoices/${invoice.id}`}
                      className="font-bold text-sm text-primary hover:underline truncate"
                    >
                      {invoice.invoice_number}
                    </Link>
                    {invoice.doc_type && invoice.doc_type !== "invoice" && (
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-sm bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                        {invoice.doc_type}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs text-muted-foreground font-medium">
                      {formatDate(invoice.invoice_date)}
                    </span>
                    <Badge className={`${getStatusColor(displayStatus)} text-[10px] px-1.5 py-0`} variant="outline">
                      {getStatusLabel(displayStatus)}
                    </Badge>
                  </div>
                </div>

                {/* Customer Details & Totals */}
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">
                      {invoice.legal_name || invoice.customer_name}
                    </p>
                    {invoice.trade_name && invoice.trade_name.toUpperCase() !== (invoice.legal_name || invoice.customer_name).toUpperCase() && (
                      <p className="text-[11px] font-bold text-foreground truncate uppercase">
                        {invoice.trade_name}
                      </p>
                    )}
                    {invoice.customer_mobile && (
                      <a
                        href={`tel:${invoice.customer_mobile}`}
                        className="text-muted-foreground hover:text-primary flex items-center gap-1 mt-0.5"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{invoice.customer_mobile}</span>
                      </a>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-foreground">
                      {formatCurrency(invoice.grand_total)}
                    </div>
                    {invoice.balance_amount > 0 ? (
                      <div className="text-[11px] font-semibold text-destructive mt-0.5">
                        Due: {formatCurrency(invoice.balance_amount)}
                      </div>
                    ) : (
                      <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                        Fully Paid
                      </div>
                    )}
                  </div>
                </div>

                {/* Touch Actions Bar */}
                <div className="pt-2 border-t border-border/50 flex items-center justify-between gap-1 print:hidden">
                  <div className="flex items-center gap-0.5 sm:gap-1.5 min-w-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="h-8 px-2 sm:px-2.5 text-xs font-medium gap-1 text-foreground hover:text-primary shrink-0"
                    >
                      <Link href={`/invoices/${invoice.id}`}>
                        <Eye className="w-3.5 h-3.5 shrink-0" />
                        <span>View</span>
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="h-8 px-2 sm:px-2.5 text-xs font-medium gap-1 text-foreground hover:text-primary shrink-0"
                    >
                      <Link href={`/invoices/${invoice.id}/edit`}>
                        <Edit className="w-3.5 h-3.5 shrink-0" />
                        <span>Edit</span>
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDuplicate(invoice.id)}
                      disabled={isDuplicating === invoice.id}
                      className="h-8 px-2 sm:px-2.5 text-xs font-medium gap-1 text-foreground hover:text-primary shrink-0"
                    >
                      <Copy className="w-3.5 h-3.5 shrink-0" />
                      <span>Copy</span>
                    </Button>
                  </div>
                  <DeleteInvoiceButton
                    id={invoice.id}
                    className="h-8 w-8 min-w-8 p-0 shrink-0 flex items-center justify-center rounded-lg"
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop View: Full Table */}
      <div className="hidden md:block rounded-xl border bg-card overflow-x-auto">
        <Table className="min-w-[800px]">
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right print:hidden">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No invoices found.
                </TableCell>
              </TableRow>
            ) : (
              filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-1.5">
                      <Link href={`/invoices/${invoice.id}`} className="hover:underline text-primary font-semibold">
                        {invoice.invoice_number}
                      </Link>
                      {invoice.doc_type && invoice.doc_type !== "invoice" && (
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-sm bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                          {invoice.doc_type}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(invoice.invoice_date)}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-semibold text-foreground">{invoice.legal_name || invoice.customer_name}</div>
                      {invoice.trade_name && invoice.trade_name.toUpperCase() !== (invoice.legal_name || invoice.customer_name).toUpperCase() && (
                        <div className="text-xs font-bold text-foreground uppercase">{invoice.trade_name}</div>
                      )}
                      {invoice.customer_mobile && (
                        <div className="text-xs text-muted-foreground">{invoice.customer_mobile}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(invoice.grand_total)}</TableCell>
                  <TableCell className="text-right">
                    {invoice.balance_amount > 0 ? (
                      <span className="text-destructive font-medium">
                        {formatCurrency(invoice.balance_amount)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {(() => {
                      const displayStatus =
                        invoice.status === "draft" || invoice.status === "cancelled"
                          ? invoice.status
                          : invoice.payment_status || invoice.status;
                      return (
                        <Badge className={getStatusColor(displayStatus)} variant="outline">
                          {getStatusLabel(displayStatus)}
                        </Badge>
                      );
                    })()}
                  </TableCell>
                  <TableCell className="text-right print:hidden">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" asChild title="Edit Invoice">
                        <Link href={`/invoices/${invoice.id}/edit`}>
                          <Edit className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDuplicate(invoice.id)}
                        title="Duplicate Invoice"
                        disabled={isDuplicating === invoice.id}
                      >
                        <Copy className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" asChild title="View Details">
                        <Link href={`/invoices/${invoice.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <DeleteInvoiceButton id={invoice.id} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
