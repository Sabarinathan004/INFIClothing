"use client"

import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";
import { getOutstandingInvoices } from "@/actions/dashboard";
import { AlertCircle, Search, Phone, ExternalLink, TrendingDown, X } from "lucide-react";
import Link from "next/link";

interface OutstandingInvoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_mobile: string;
  grand_total: number;
  paid_amount: number;
  balance_amount: number;
  payment_status: string;
  invoice_date: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalOutstanding: number;
}

export function OutstandingBalanceModal({ open, onOpenChange, totalOutstanding }: Props) {
  const [invoices, setInvoices] = useState<OutstandingInvoice[]>([]);
  const [filtered, setFiltered] = useState<OutstandingInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getOutstandingInvoices();
      setInvoices(data as OutstandingInvoice[]);
      setFiltered(data as OutstandingInvoice[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      load();
      setSearch("");
    }
  }, [open, load]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      invoices.filter(
        (inv) =>
          inv.customer_name.toLowerCase().includes(q) ||
          inv.invoice_number.toLowerCase().includes(q) ||
          (inv.customer_mobile || "").includes(q)
      )
    );
  }, [search, invoices]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0 rounded-2xl overflow-hidden [&>button]:hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-950/40 dark:to-rose-900/30 px-5 py-5 border-b border-red-100 dark:border-red-900/40">
          <DialogHeader>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-100 dark:bg-red-900/50 rounded-xl">
                  <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <DialogTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    Outstanding Payments
                  </DialogTitle>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {invoices.length} invoice{invoices.length !== 1 ? "s" : ""} pending collection
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-right">
                  <p className="text-xl font-bold text-red-600 dark:text-red-400">
                    {formatCurrency(totalOutstanding)}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Total pending</p>
                </div>
                <DialogClose className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors flex-shrink-0">
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </DialogClose>
              </div>
            </div>
          </DialogHeader>

          {/* Search */}
          {invoices.length > 0 && (
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by customer or invoice..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-white/80 dark:bg-slate-900/60 border-red-100 dark:border-red-900/40 focus-visible:ring-red-300 text-sm h-9"
              />
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Loading...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
              <AlertCircle className="h-8 w-8 text-slate-300" />
              <p className="text-sm">
                {search ? "No matching results" : "No outstanding invoices 🎉"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((inv, idx) => (
                <div
                  key={inv.id}
                  className="flex items-start justify-between gap-3 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group"
                >
                  {/* Left: rank + info */}
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <span className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs font-semibold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                        {inv.customer_name}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                        <Link
                          href={`/invoices/${inv.id}`}
                          onClick={() => onOpenChange(false)}
                          className="text-xs text-primary hover:underline font-medium flex items-center gap-1"
                        >
                          #{inv.invoice_number}
                          <ExternalLink className="h-2.5 w-2.5" />
                        </Link>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs text-slate-500">{formatDate(inv.invoice_date)}</span>
                        {inv.customer_mobile && (
                          <>
                            <span className="text-xs text-slate-400">·</span>
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <Phone className="h-2.5 w-2.5" />
                              {inv.customer_mobile}
                            </span>
                          </>
                        )}
                      </div>
                      {/* Progress bar for partial payments */}
                      {inv.payment_status === "partial" && (
                        <div className="mt-2 w-full max-w-[180px]">
                          <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                            <span>Paid {formatCurrency(inv.paid_amount)}</span>
                            <span>of {formatCurrency(inv.grand_total)}</span>
                          </div>
                          <div className="h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${Math.min(100, (inv.paid_amount / inv.grand_total) * 100)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: amount + status */}
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className="text-base font-bold text-red-600 dark:text-red-400 whitespace-nowrap">
                      {formatCurrency(inv.balance_amount)}
                    </span>
                    <Badge className={`${getStatusColor(inv.payment_status)} text-[10px] px-1.5 py-0`} variant="outline">
                      {inv.payment_status === "partial" ? "Partially Paid" : "Unpaid"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer summary */}
        {filtered.length > 0 && (
          <div className="border-t border-slate-100 dark:border-slate-800 px-5 py-3 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              Showing {filtered.length} of {invoices.length} outstanding invoice{invoices.length !== 1 ? "s" : ""}
            </p>
            <p className="text-sm font-semibold text-red-600 dark:text-red-400">
              {formatCurrency(filtered.reduce((s, i) => s + i.balance_amount, 0))} shown
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
