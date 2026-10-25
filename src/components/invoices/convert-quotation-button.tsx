"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRightCircle } from "lucide-react";
import { convertQuotationToInvoice } from "@/actions/invoices";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function ConvertQuotationButton({ id, docType }: { id: string; docType?: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (docType === "invoice") return null;

  const handleConvert = async () => {
    setLoading(true);
    try {
      const result = await convertQuotationToInvoice(id);
      toast.success("Converted to Tax Invoice successfully!");
      router.push(`/invoices/${result.id}`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to convert to invoice");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="default"
      size="sm"
      onClick={handleConvert}
      disabled={loading}
      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-1.5 shadow-xs"
    >
      <ArrowRightCircle className="w-4 h-4" />
      <span>Convert to Tax Invoice</span>
    </Button>
  );
}
