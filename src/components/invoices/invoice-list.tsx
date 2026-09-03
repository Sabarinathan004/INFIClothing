"use client"

import { Invoice } from "@/types";
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Search, Plus, Copy, Edit } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from "@/lib/utils";
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
  const [isDuplicating, setIsDuplicating] = useState<string | null>(null);
  const debouncedSearch = useDebounce(searchQuery, 300);
  const router = useRouter();

  const filteredInvoices = initialInvoices.filter(inv => {
    const query = debouncedSearch.toLowerCase();
    const matchesSearch = (
      inv.invoice_number.toLowerCase().includes(query) ||
      inv.customer_name.toLowerCase().includes(query) ||
      (inv.customer_mobile && inv.customer_mobile.includes(query))
    );

    let matchesDate = true;
    if (startDate) {
      matchesDate = matchesDate && new Date(inv.invoice_date) >= new Date(startDate);
    }
    if (endDate) {
      matchesDate = matchesDate && new Date(inv.invoice_date) <= new Date(endDate);
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search invoice # or customer..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-2 text-sm bg-white dark:bg-slate-950 p-1 rounded-md border">
            <Input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-auto h-8 border-0 focus-visible:ring-0"
              title="Start Date"
            />
            <span className="text-muted-foreground">-</span>
            <Input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-auto h-8 border-0 focus-visible:ring-0"
              title="End Date"
            />
          </div>
          <DownloadPdfButton />
        </div>
      </div>

      <div className="rounded-xl border bg-card">
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
                  <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                  <TableCell>{formatDate(invoice.invoice_date)}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{invoice.customer_name}</div>
                      {invoice.customer_mobile && (
                        <div className="text-xs text-muted-foreground">{invoice.customer_mobile}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(invoice.grand_total)}</TableCell>
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
                      // For drafts/cancelled use the status field; for active invoices use payment_status
                      const displayStatus = (invoice.status === 'draft' || invoice.status === 'cancelled')
                        ? invoice.status
                        : (invoice.payment_status || invoice.status);
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
