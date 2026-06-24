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
        className="border-destructive/20 bg-destructive/5 cursor-pointer hover:bg-destructive/10 hover:shadow-md transition-all duration-150 select-none"
        onClick={() => setOpen(true)}
        role="button"
        aria-label="View outstanding payments"
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
          <FileText className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">
            {formatCurrency(totalOutstanding)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Amount pending collection
          </p>
          <p className="text-xs text-destructive/70 mt-1.5 font-medium">Tap to view details →</p>
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
