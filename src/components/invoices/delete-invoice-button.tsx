"use client"

import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteInvoice } from "@/actions/invoices";
import { toast } from "sonner";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface DeleteInvoiceButtonProps {
  id: string;
  variant?: "ghost" | "destructive" | "outline" | "default";
  size?: "default" | "sm" | "lg" | "icon";
  redirectAfterDelete?: boolean;
}

export function DeleteInvoiceButton({ id, variant = "ghost", size = "icon", redirectAfterDelete = false }: DeleteInvoiceButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const isOnline = useOnlineStatus();

  const handleDelete = async () => {
    if (!isOnline) {
      toast.error("Internet connection required to save invoices.");
      return;
    }

    setIsDeleting(true);
    try {
      await deleteInvoice(id);
      toast.success("Invoice deleted successfully");
      setIsOpen(false);
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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={variant === "ghost" ? "text-destructive hover:text-destructive hover:bg-destructive/10" : ""}
          disabled={isDeleting || !isOnline}
          title={!isOnline ? "Offline: Cannot delete invoice" : "Delete Invoice"}
        >
          <Trash2 className="h-4 w-4" />
          {variant !== "ghost" && size !== "icon" && <span className="ml-2 hidden sm:inline">Delete</span>}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Invoice</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this invoice? This action cannot be undone and will delete all associated items and payments.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0 mt-4">
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isDeleting}>Cancel</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Delete Invoice"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
