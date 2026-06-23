"use client"

import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteInvoice } from "@/actions/invoices";
import { toast } from "sonner";
import { useOnlineStatus } from "@/hooks/use-online-status";

interface DeleteInvoiceButtonProps {
  id: string;
  variant?: "ghost" | "destructive" | "outline" | "default";
  size?: "default" | "sm" | "lg" | "icon";
  redirectAfterDelete?: boolean;
}

export function DeleteInvoiceButton({ id, variant = "ghost", size = "icon", redirectAfterDelete = false }: DeleteInvoiceButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const isOnline = useOnlineStatus();

  const handleDelete = async () => {
    if (!isOnline) {
      toast.error("Internet connection required to save invoices.");
      return;
    }

    if (!window.confirm("Are you absolutely sure you want to delete this invoice? This action cannot be undone and will delete all associated items and payments.")) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteInvoice(id);
      toast.success("Invoice deleted successfully");
      if (redirectAfterDelete) {
        router.push("/invoices");
        router.refresh();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to delete invoice");
      setIsDeleting(false);
    }
  };

  return (
    <Button 
      variant={variant} 
      size={size} 
      className={variant === "ghost" ? "text-destructive hover:text-destructive hover:bg-destructive/10" : ""} 
      onClick={handleDelete}
      disabled={isDeleting || !isOnline} 
      title={!isOnline ? "Offline: Cannot delete invoice" : "Delete Invoice"}
    >
      <Trash2 className="h-4 w-4" />
      {variant !== "ghost" && size !== "icon" && <span className="ml-2 hidden sm:inline">Delete</span>}
    </Button>
  );
}
