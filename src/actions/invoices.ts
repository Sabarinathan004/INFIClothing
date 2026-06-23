"use server"

import { createClient } from "@/lib/supabase/server";
import { InvoiceSchemaType } from "@/schemas/invoice";
import { revalidatePath } from "next/cache";

export async function getInvoicesByCustomer(customerId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("customer_id", customerId)
    .order("invoice_date", { ascending: false });

  if (error) {
    return [];
  }

  return data;
}

export async function getInvoices() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .order("invoice_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    return [];
  }

  return data;
}

export async function getInvoiceById(id: string) {
  const supabase = await createClient();

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", id)
    .single();

  if (invoiceError) {
    console.error(`Error fetching invoice ${id}:`, invoiceError);
    throw new Error("Failed to fetch invoice details");
  }

  const { data: items, error: itemsError } = await supabase
    .from("invoice_items")
    .select("*")
    .eq("invoice_id", id)
    .order("sort_order", { ascending: true });

  if (itemsError) {
    console.error(`Error fetching invoice items for ${id}:`, itemsError);
    throw new Error("Failed to fetch invoice items");
  }

  const { data: payments, error: paymentsError } = await supabase
    .from("payments")
    .select("*")
    .eq("invoice_id", id)
    .order("payment_date", { ascending: false });

  if (paymentsError) {
    console.error(`Error fetching payments for invoice ${id}:`, paymentsError);
  }

  return {
    ...invoice,
    items: items || [],
    payments: payments || [],
  };
}

async function resolveCustomer(supabase: any, data: InvoiceSchemaType) {
  if (data.customer_id) return data.customer_id;

  let existingCustomerId = null;

  // 1. Check if GST exists
  if (data.customer_gst && data.customer_gst.trim() !== "") {
    const { data: gstCustomer } = await supabase
      .from("customers")
      .select("id")
      .eq("gst_number", data.customer_gst.trim())
      .single();

    if (gstCustomer) {
      existingCustomerId = gstCustomer.id;
    }
  }

  // If existing customer found by GST, return it
  if (existingCustomerId) {
    return existingCustomerId;
  }

  // 2. If not found, add that customer
  if (data.customer_name && data.customer_name.trim() !== "") {
    const { data: newCustomer, error: newCustomerError } = await supabase
      .from("customers")
      .insert([{
        name: data.customer_name.trim(),
        mobile: data.customer_mobile?.trim() || null,
        email: data.customer_email?.trim() || null,
        gst_number: data.customer_gst?.trim() || null,
        address: data.customer_address?.trim() || null,
      }])
      .select()
      .single();

    if (!newCustomerError && newCustomer) {
      return newCustomer.id;
    }
  }

  return null;
}

export async function createInvoice(data: InvoiceSchemaType) {
  const supabase = await createClient();

  // Resolve customer (check GST or create new)
  data.customer_id = await resolveCustomer(supabase, data) || data.customer_id;

  // 1. Generate invoice number
  const { data: numData, error: numError } = await supabase
    .rpc("generate_invoice_number", { prefix: "INV" });

  if (numError) {
    console.error("Error generating invoice number:", numError);
    throw new Error("Failed to generate invoice number");
  }

  const invoiceNumber = numData;

  // 2. Calculate totals
  const subtotal = data.items.reduce((sum, item) => sum + item.amount, 0);
  const gstAmount = Math.round((subtotal * data.gst_rate) / 100 * 100) / 100;
  const grandTotal = subtotal + gstAmount;
  
  // Set initial status to unpaid unless explicitly marked as draft
  const paymentStatus = data.status === 'draft' ? 'draft' : 'unpaid';
  const invoiceStatus = data.status === 'draft' ? 'created' : 'created';

  // 3. Insert invoice
  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .insert([{
      invoice_number: invoiceNumber,
      invoice_date: data.invoice_date,
      customer_id: data.customer_id,
      customer_name: data.customer_name,
      customer_mobile: data.customer_mobile,
      customer_email: data.customer_email,
      customer_gst: data.customer_gst,
      customer_address: data.customer_address,
      subtotal,
      gst_rate: data.gst_rate,
      gst_amount: gstAmount,
      grand_total: grandTotal,
      paid_amount: 0,
      balance_amount: grandTotal,
      payment_status: paymentStatus,
      status: invoiceStatus,
      notes: data.notes,
    }])
    .select()
    .single();

  if (invoiceError) {
    console.error("Error creating invoice:", invoiceError);
    throw new Error(invoiceError.message);
  }

  // 4. Insert items
  const itemsToInsert = data.items.map((item, index) => ({
    invoice_id: invoice.id,
    bundle_name: item.bundle_name,
    quantity: item.quantity,
    rate: item.rate,
    amount: item.amount,
    sort_order: index,
  }));

  const { error: itemsError } = await supabase
    .from("invoice_items")
    .insert(itemsToInsert);

  if (itemsError) {
    console.error("Error creating invoice items:", itemsError);
    // Might want to rollback here, or handle orphaned invoices
    throw new Error("Failed to save invoice items");
  }

  revalidatePath("/invoices");
  if (data.customer_id) {
    revalidatePath(`/customers/${data.customer_id}`);
  }
  
  return { success: true, id: invoice.id };
}

export async function duplicateInvoice(id: string) {
  const invoice = await getInvoiceById(id);
  
  // Convert to form data, removing ids and setting status to unpaid
  const invoiceData: InvoiceSchemaType = {
    invoice_date: new Date().toISOString().split('T')[0],
    customer_id: invoice.customer_id,
    customer_name: invoice.customer_name,
    customer_mobile: invoice.customer_mobile,
    customer_email: invoice.customer_email,
    customer_gst: invoice.customer_gst,
    customer_address: invoice.customer_address,
    gst_rate: invoice.gst_rate,
    notes: invoice.notes,
    status: 'unpaid',
    items: invoice.items.map((item: any) => ({
      bundle_name: item.bundle_name,
      quantity: item.quantity,
      rate: item.rate,
      amount: item.amount,
    }))
  };

  return createInvoice(invoiceData);
}

export async function updateInvoice(id: string, data: InvoiceSchemaType) {
  const supabase = await createClient();

  // Resolve customer (check GST or create new)
  data.customer_id = await resolveCustomer(supabase, data) || data.customer_id;

  const invoice = await getInvoiceById(id);
  const subtotal = data.items.reduce((sum, item) => sum + item.amount, 0);
  const gstAmount = Math.round((subtotal * data.gst_rate) / 100 * 100) / 100;
  const grandTotal = subtotal + gstAmount;

  const balanceAmount = grandTotal - invoice.paid_amount;
  let paymentStatus = 'unpaid';
  if (data.status === 'draft') {
    paymentStatus = 'draft';
  } else if (balanceAmount <= 0 && grandTotal > 0) {
    paymentStatus = 'paid';
  } else if (invoice.paid_amount > 0) {
    paymentStatus = 'partial';
  }
  
  const invoiceStatus = data.status === 'draft' ? 'draft' : 'created';

  const { error: invoiceError } = await supabase
    .from("invoices")
    .update({
      invoice_date: data.invoice_date,
      customer_id: data.customer_id,
      customer_name: data.customer_name,
      customer_mobile: data.customer_mobile,
      customer_email: data.customer_email,
      customer_gst: data.customer_gst,
      customer_address: data.customer_address,
      subtotal,
      gst_rate: data.gst_rate,
      gst_amount: gstAmount,
      grand_total: grandTotal,
      balance_amount: balanceAmount,
      payment_status: paymentStatus,
      status: invoiceStatus,
      notes: data.notes,
    })
    .eq("id", id);

  if (invoiceError) throw new Error(invoiceError.message);

  await supabase.from("invoice_items").delete().eq("invoice_id", id);

  const itemsToInsert = data.items.map((item, index) => ({
    invoice_id: id,
    bundle_name: item.bundle_name,
    quantity: item.quantity,
    rate: item.rate,
    amount: item.amount,
    sort_order: index,
  }));

  const { error: itemsError } = await supabase.from("invoice_items").insert(itemsToInsert);
  if (itemsError) throw new Error("Failed to update invoice items");

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${id}`);
  if (data.customer_id) {
    revalidatePath(`/customers/${data.customer_id}`);
  }
  
  return { success: true, id };
}

export async function deleteInvoice(id: string) {
  const supabase = await createClient();

  const invoice = await getInvoiceById(id);
  await supabase.from("payments").delete().eq("invoice_id", id);
  await supabase.from("invoice_items").delete().eq("invoice_id", id);
  const { error } = await supabase.from("invoices").delete().eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/invoices");
  if (invoice.customer_id) {
    revalidatePath(`/customers/${invoice.customer_id}`);
  }
  return { success: true };
}

export async function cancelInvoice(id: string) {
  const supabase = await createClient();

  const invoice = await getInvoiceById(id);

  if (invoice.payment_status === 'cancelled') {
     throw new Error("Invoice is already cancelled");
  }
  
  const { error } = await supabase
    .from("invoices")
    .update({
      payment_status: 'cancelled',
      status: 'cancelled'
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${id}`);
  if (invoice.customer_id) {
    revalidatePath(`/customers/${invoice.customer_id}`);
  }
  return { success: true };
}
