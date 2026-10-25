"use client"

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
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
        className="border-destructive/20 bg-destructive/5 cursor-pointer hover:bg-destructive/10 hover:shadow-md transition-all duration-150 select-none p-0 overflow-hidden"
        onClick={() => setOpen(true)}
        role="button"
        aria-label="View outstanding payments"
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3.5 sm:p-5 pb-1 sm:pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-destructive truncate pr-1">Outstanding</CardTitle>
          <FileText className="h-4 w-4 shrink-0 text-destructive" />
        </CardHeader>
        <CardContent className="p-3.5 sm:p-5 pt-0">
          <div className="text-base sm:text-xl lg:text-2xl font-bold text-destructive tracking-tight truncate" title={formatCurrency(totalOutstanding)}>
            {formatCurrency(totalOutstanding, { compactDecimals: true })}
          </div>
          <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 truncate">
            Pending collection
          </p>
          <p className="text-[11px] sm:text-xs text-destructive/80 mt-1 font-medium truncate">Tap to view details →</p>
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
