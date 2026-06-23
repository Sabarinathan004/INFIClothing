"use server"

import { createClient } from "@/lib/supabase/server";
import { PaymentSchemaType } from "@/schemas/payment";
import { revalidatePath } from "next/cache";

export async function addPayment(data: PaymentSchemaType) {
  const supabase = await createClient();

  // 1. Fetch current invoice to calculate new status
  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .select("grand_total, paid_amount, balance_amount, customer_id")
    .eq("id", data.invoice_id)
    .single();

  if (invoiceError) {
    throw new Error("Failed to fetch invoice details");
  }

  const newPaidAmount = invoice.paid_amount + data.amount;
  const newBalanceAmount = invoice.grand_total - newPaidAmount;
  
  let paymentStatus = "unpaid";
  if (newBalanceAmount <= 0) {
    paymentStatus = "paid";
  } else if (newPaidAmount > 0) {
    paymentStatus = "partial";
  }

  // 2. Insert payment
  const { error: paymentError } = await supabase
    .from("payments")
    .insert([data]);

  if (paymentError) {
    console.error("Error creating payment:", paymentError);
    throw new Error("Failed to record payment");
  }

  // 3. Update invoice totals and status
  const { error: updateError } = await supabase
    .from("invoices")
    .update({
      paid_amount: newPaidAmount,
      balance_amount: newBalanceAmount,
      payment_status: paymentStatus
    })
    .eq("id", data.invoice_id);

  if (updateError) {
    console.error("Error updating invoice after payment:", updateError);
    throw new Error("Failed to update invoice balance");
  }

  revalidatePath(`/invoices/${data.invoice_id}`);
  revalidatePath("/invoices");
  revalidatePath("/dashboard");
  if (invoice.customer_id) {
    revalidatePath(`/customers/${invoice.customer_id}`);
  }

  return { success: true };
}
