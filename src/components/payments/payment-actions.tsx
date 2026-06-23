"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Banknote, CheckCircle2 } from "lucide-react";
import { formatCurrency, toDateInputValue } from "@/lib/utils";
import { addPayment } from "@/actions/payments";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function PaymentActions({ invoice }: { invoice: any }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(invoice.balance_amount.toString());
  const [paymentDate, setPaymentDate] = useState(toDateInputValue());
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [reference, setReference] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleFullPayment = async () => {
    setIsLoading(true);
    try {
      await addPayment({
        invoice_id: invoice.id,
        amount: invoice.balance_amount,
        payment_date: toDateInputValue(),
        payment_method: 'cash',
        reference_number: ''
      });
      toast.success("Marked as fully paid");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to record payment");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await addPayment({
        invoice_id: invoice.id,
        amount: Number(amount),
        payment_date: paymentDate,
        payment_method: paymentMethod,
        reference_number: reference
      });
      toast.success("Payment recorded successfully");
      setOpen(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to record payment");
    } finally {
      setIsLoading(false);
    }
  };

  if (invoice.balance_amount <= 0) {
    return (
      <Button variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 cursor-default hover:bg-emerald-50 hover:text-emerald-600">
        <CheckCircle2 className="w-4 h-4 mr-2" />
        Fully Paid
      </Button>
    );
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={handleFullPayment} disabled={isLoading}>
        <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500" />
        Mark as Paid
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button disabled={isLoading}>
            <Banknote className="w-4 h-4 mr-2" />
            Add Payment
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleCustomPayment}>
            <DialogHeader>
              <DialogTitle>Record Payment</DialogTitle>
              <DialogDescription>
                Outstanding Balance: <strong className="text-foreground">{formatCurrency(invoice.balance_amount)}</strong>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  max={invoice.balance_amount}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Payment Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod} disabled={isLoading}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reference">Reference / Notes (Optional)</Label>
                <Input
                  id="reference"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Txn ID, Cheque No..."
                  disabled={isLoading}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || Number(amount) <= 0 || Number(amount) > invoice.balance_amount}>
                {isLoading ? "Saving..." : "Record Payment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
