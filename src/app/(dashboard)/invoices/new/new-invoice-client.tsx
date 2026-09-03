"use client";

import { useEffect, useState } from "react";
import { InvoiceForm } from "@/components/invoices/invoice-form";
import { TemplateSelector } from "@/components/invoices/template-selector";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Paintbrush } from "lucide-react";

export function NewInvoiceClient({ settings }: { settings: any }) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const stored = localStorage.getItem("selected_invoice_template");
    if (stored) {
      setSelectedTemplate(stored);
    }
  }, []);

  if (!isClient) return null; // Avoid hydration mismatch

  if (!selectedTemplate) {
    return (
      <div className="space-y-6">
        <TemplateSelector 
          onSelect={(id) => {
            localStorage.setItem("selected_invoice_template", id);
            setSelectedTemplate(id);
          }} 
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Create Invoice"
          description="Generate a new invoice for INFI Clothings."
        />
        <Button 
          variant="outline" 
          onClick={() => {
            // Optional: don't clear localStorage here if they cancel, but they want to change it.
            // If we clear it, it forces them to reselect.
            setSelectedTemplate(null);
          }}
          className="shrink-0 -mt-2 sm:-mt-6 shadow-sm bg-indigo-50/50 hover:bg-indigo-100/50 text-indigo-700 border-indigo-200"
        >
          <Paintbrush className="w-4 h-4 mr-2" />
          Change Template
        </Button>
      </div>

      <InvoiceForm 
        defaultGstRate={settings?.default_gst_rate || 5} 
        settings={settings}
      />
    </div>
  );
}
