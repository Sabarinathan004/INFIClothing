"use client"

import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export function WhatsAppShare({ invoice, settings }: { invoice: any, settings: any }) {
  const handleShare = () => {
    // Generate text message for WhatsApp
    const companyName = settings?.company_name || "Our Company";
    
    let message = `*Invoice from ${companyName}*\n`;
    message += `Invoice #: ${invoice.invoice_number}\n`;
    message += `Date: ${new Date(invoice.invoice_date).toLocaleDateString()}\n\n`;
    
    message += `*Items:*\n`;
    invoice.items.forEach((item: any) => {
      message += `- ${item.bundle_name} (${item.quantity} x ${formatCurrency(item.rate)}) = ${formatCurrency(item.amount)}\n`;
    });
    
    message += `\n*Total:* ${formatCurrency(invoice.grand_total)}\n`;
    
    if (invoice.balance_amount > 0) {
      message += `*Balance Due:* ${formatCurrency(invoice.balance_amount)}\n`;
    } else {
      message += `*Status:* Paid in full\n`;
    }

    if (settings?.upi_id) {
      message += `\n*UPI ID for Payment:* ${settings.upi_id}\n`;
    }

    const encodedMessage = encodeURIComponent(message);
    
    // Use customer mobile if available, otherwise just open WA to select contact
    const mobile = invoice.customer_mobile ? invoice.customer_mobile.replace(/\D/g, '') : '';
    
    const whatsappUrl = mobile 
      ? `https://wa.me/91${mobile}?text=${encodedMessage}` 
      : `https://wa.me/?text=${encodedMessage}`;
      
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Button variant="outline" className="gap-2 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 hover:text-[#25D366] border-[#25D366]/20" onClick={handleShare}>
      <Send className="w-4 h-4" />
      <span className="hidden sm:inline">Share on WhatsApp</span>
    </Button>
  );
}
