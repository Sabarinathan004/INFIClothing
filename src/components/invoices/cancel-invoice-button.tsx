"use client"

import { Button } from "@/components/ui/button";
import { Ban } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { cancelInvoice } from "@/actions/invoices";
import { toast } from "sonner";
import { useOnlineStatus } from "@/hooks/use-online-status";

interface CancelInvoiceButtonProps {
  id: string;
  variant?: "ghost" | "destructive" | "outline" | "default";
  size?: "default" | "sm" | "lg" | "icon";
}

export function CancelInvoiceButton({ id, variant = "outline", size = "icon" }: CancelInvoiceButtonProps) {
  const [isCancelling, setIsCancelling] = useState(false);
  const router = useRouter();
  const isOnline = useOnlineStatus();

  const handleCancel = async () => {
    if (!isOnline) {
      toast.error("Internet connection required to save invoices.");
      return;
    }

    if (!window.confirm("Are you sure you want to cancel this invoice?")) {
      return;
    }

    setIsCancelling(true);
    try {
      await cancelInvoice(id);
      toast.success("Invoice cancelled successfully");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel invoice");
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <Button 
      variant={variant} 
      size={size} 
      onClick={handleCancel}
      disabled={isCancelling || !isOnline} 
      title={!isOnline ? "Offline: Cannot cancel invoice" : "Cancel Invoice"}
      className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
    >
      <Ban className="h-4 w-4" />
      {variant !== "ghost" && size !== "icon" && <span className="ml-2 hidden sm:inline">Cancel Invoice</span>}
    </Button>
  );
}
