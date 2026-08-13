"use client"

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export function DownloadPdfButton({ invoice }: { invoice?: any }) {
  const handlePrint = () => {
    const originalTitle = document.title;
    
    if (invoice?.customer_name || invoice?.invoice_number) {
      const customer = invoice?.customer_name ? invoice.customer_name.trim().replace(/[/\\?%*:|"<>]/g, '') : 'Customer';
      const invoiceNo = invoice?.invoice_number ? invoice.invoice_number.trim().replace(/[/\\?%*:|"<>]/g, '') : 'Invoice';
      document.title = `${customer}_${invoiceNo}`;
    }

    window.print();

    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  return (
    <Button variant="outline" className="gap-2 print:hidden" onClick={handlePrint}>
      <Download className="w-4 h-4" />
      <span className="hidden sm:inline">Download PDF</span>
    </Button>
  );
}

