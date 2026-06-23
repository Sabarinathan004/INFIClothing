"use client"

import { Button } from "@/components/ui/button";
import { Ban } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { cancelInvoice } from "@/actions/invoices";
import { toast } from "sonner";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface CancelInvoiceButtonProps {
  id: string;
  variant?: "ghost" | "destructive" | "outline" | "default";
  size?: "default" | "sm" | "lg" | "icon";
}

export function CancelInvoiceButton({ id, variant = "outline", size = "icon" }: CancelInvoiceButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const router = useRouter();
  const isOnline = useOnlineStatus();

  const handleCancel = async () => {
    if (!isOnline) {
      toast.error("Internet connection required to save invoices.");
      return;
    }

    setIsCancelling(true);
    try {
      await cancelInvoice(id);
      toast.success("Invoice cancelled successfully");
      setIsOpen(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel invoice");
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={variant} 
          size={size} 
          disabled={isCancelling || !isOnline} 
          title={!isOnline ? "Offline: Cannot cancel invoice" : "Cancel Invoice"}
          className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
        >
          <Ban className="h-4 w-4" />
          {variant !== "ghost" && size !== "icon" && <span className="ml-2 hidden sm:inline">Cancel Invoice</span>}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel Invoice</DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel this invoice?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0 mt-4">
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isCancelling}>Keep Invoice</Button>
          <Button variant="destructive" onClick={handleCancel} disabled={isCancelling}>
            {isCancelling ? "Cancelling..." : "Cancel Invoice"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
