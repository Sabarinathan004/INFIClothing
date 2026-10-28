"use client"

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { OutstandingBalanceModal } from "@/components/dashboard/outstanding-balance-modal";

interface Props {
  totalOutstanding: number;
}

export function OutstandingBalanceCard({ totalOutstanding }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Card
        className="p-0 overflow-hidden cursor-pointer group hover:border-rose-500/50 hover:shadow-md transition-all duration-200 select-none relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => setOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        aria-label="View outstanding payments"
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3.5 sm:p-5 pb-1 sm:pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground truncate pr-1">
            Outstanding
          </CardTitle>
          <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 shrink-0 group-hover:scale-105 transition-transform">
            <TrendingDown className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent className="p-3.5 sm:p-5 pt-0">
          <div
            className="text-base sm:text-xl lg:text-2xl font-bold text-rose-600 dark:text-rose-400 tracking-tight truncate"
            title={formatCurrency(totalOutstanding)}
          >
            {formatCurrency(totalOutstanding, { compactDecimals: true })}
          </div>
          <div className="flex items-center justify-between text-[11px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
            <span className="truncate">Pending collection</span>
            <span className="text-rose-600 dark:text-rose-400 font-medium inline-flex items-center gap-0.5 shrink-0 ml-1 group-hover:translate-x-0.5 transition-transform">
              Details &rarr;
            </span>
          </div>
        </CardContent>
      </Card>

      <OutstandingBalanceModal
        open={open}
        onOpenChange={setOpen}
        totalOutstanding={totalOutstanding}
      />
    </>
  );
}
