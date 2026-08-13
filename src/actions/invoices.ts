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
    .maybeSingle();

  if (invoiceError || !invoice) {
    console.error(`Error fetching invoice ${id}:`, invoiceError);
    throw new Error("Invoice not found or failed to fetch details");
  }

  const [itemsResponse, paymentsResponse] = await Promise.all([
    supabase
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("payments")
      .select("*")
      .eq("invoice_id", id)
      .order("payment_date", { ascending: false })
  ]);

  return {
    ...invoice,
    items: itemsResponse.data || [],
    payments: paymentsResponse.data || [],
  };
}


/**
 * Compute GST split based on customer location.
 * Always uses the gst_rate from the form (default 5%).
 */
function computeGstSplit(subtotal: number, gstRate: number, customerLocation: string) {
  let cgstRate = 0, sgstRate = 0, igstRate = 0;
  let cgstAmount = 0, sgstAmount = 0, igstAmount = 0;

  const round2 = (n: number) => Math.round(n * 100) / 100;

  if (customerLocation === 'Inside Tamil Nadu') {
    cgstRate = gstRate / 2;
    sgstRate = gstRate / 2;
    cgstAmount = round2(subtotal * cgstRate / 100);
    sgstAmount = round2(subtotal * sgstRate / 100);
  } else {
    igstRate = gstRate;
    igstAmount = round2(subtotal * igstRate / 100);
  }

  const gstAmount = round2(cgstAmount + sgstAmount + igstAmount);

  return { cgstRate, sgstRate, igstRate, cgstAmount, sgstAmount, igstAmount, gstAmount };
}

/**
 * Resolve or create a customer record.
 * - If customer_id is already provided, use it.
 * - If verification_type === GST, try to find existing customer by verification_number.
 * - Otherwise create a new customer record from the snapshot fields.
 */
async function resolveCustomer(supabase: any, data: InvoiceSchemaType) {
  if (data.customer_id) return data.customer_id;

  // Only attempt GST-based lookup for GST verification type
  if (data.verification_type === 'GST' && data.verification_number?.trim()) {
    const { data: existingCustomer } = await supabase
      .from("customers")
      .select("id")
      .eq("verification_number", data.verification_number.trim().toUpperCase())
      .single();

    if (existingCustomer) {
      return existingCustomer.id;
    }
  }

  // Create a new customer record from the invoice snapshot
  if (data.customer_name?.trim()) {
    const { data: newCustomer, error: newCustomerError } = await supabase
      .from("customers")
      .insert([{
        name: data.customer_name.trim(),
        mobile: data.customer_mobile?.trim() || null,
        email: data.customer_email?.trim() || null,
        address: data.customer_address?.trim() || null,
        verification_type: data.verification_type || null,
        verification_number: data.verification_number?.trim().toUpperCase() || null,
        gst_number: data.verification_type === 'GST'
          ? data.verification_number?.trim().toUpperCase() || null
          : null,
      }])
      .select()
      .single();

    if (!newCustomerError && newCustomer) {
      return newCustomer.id;
    }
  }

  return null;
}

/**
 * Auto-saves any manually typed products to the Product Store (bundles table).
 */
async function resolveProducts(supabase: any, items: any[]) {
  for (const item of items) {
    if (item.bundle_name?.trim()) {
      const { data: existingBundles } = await supabase
        .from("bundles")
        .select("id")
        .ilike("name", item.bundle_name.trim())
        .limit(1);
        
      if (!existingBundles || existingBundles.length === 0) {
        await supabase.from("bundles").insert([{
          name: item.bundle_name.trim(),
          hsn_code: item.hsn_code || "",
          default_price: item.rate,
          is_active: true
        }]);
      }
    }
  }
}

export async function createInvoice(data: InvoiceSchemaType) {
  const supabase = await createClient();

  // Resolve customer (check verification_number for GST, or create new)
  data.customer_id = await resolveCustomer(supabase, data) || data.customer_id;

  // Auto-save new products
  await resolveProducts(supabase, data.items);

  // 1. Generate invoice number
  const { data: numData, error: numError } = await supabase
    .rpc("generate_invoice_number", { prefix: "INV" });

  if (numError) {
    console.error("Error generating invoice number:", numError);
    throw new Error("Failed to generate invoice number");
  }

  const invoiceNumber = numData;

  // 2. Calculate totals with GST split
  const subtotal = data.items.reduce((sum, item) => sum + item.amount, 0);
  const { cgstRate, sgstRate, igstRate, cgstAmount, sgstAmount, igstAmount, gstAmount } =
    computeGstSplit(subtotal, data.gst_rate, data.customer_location);
  const grandTotal = subtotal + gstAmount;

  const paymentStatus = data.status === 'draft' ? 'draft' : 'unpaid';
  const invoiceStatus = 'created';

  // 3. Insert invoice with all snapshot and split fields
  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .insert([{
      invoice_number: invoiceNumber,
      invoice_date: data.invoice_date,
      customer_id: data.customer_id,

      // Customer snapshot
      customer_name: data.customer_name,
      customer_mobile: data.customer_mobile,
      customer_email: data.customer_email,
      customer_address: data.customer_address,
      // Legacy field — keep in sync
      customer_gst: data.verification_type === 'GST'
        ? data.verification_number?.trim().toUpperCase() || ''
        : '',

      // Verification snapshot
      verification_type: data.verification_type || null,
      verification_number: data.verification_number?.trim().toUpperCase() || null,

      // Location
      customer_location: data.customer_location,

      // Totals
      subtotal,
      gst_rate: data.gst_rate,
      gst_amount: gstAmount,
      cgst_rate: cgstRate,
      sgst_rate: sgstRate,
      igst_rate: igstRate,
      cgst_amount: cgstAmount,
      sgst_amount: sgstAmount,
      igst_amount: igstAmount,
      grand_total: grandTotal,

      paid_amount: 0,
      balance_amount: grandTotal,
      payment_status: paymentStatus,
      status: invoiceStatus,
      notes: data.notes,
      transport_mode: data.transport_mode || null,
      shipping_address: data.shipping_address || null,
      no_of_bundles: data.no_of_bundles ? Number(data.no_of_bundles) : null,
    }])
    .select()
    .single();

  if (invoiceError) {
    console.error("Error creating invoice:", invoiceError);
    throw new Error(invoiceError.message);
  }

  // 4. Insert items (bundle snapshots)
  const itemsToInsert = data.items.map((item, index) => ({
    invoice_id: invoice.id,
    bundle_name: item.bundle_name,
    hsn_code: item.hsn_code || "",
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
    customer_address: invoice.customer_address,
    verification_type: invoice.verification_type || 'GST',
    verification_number: invoice.verification_number || '',
    customer_location: invoice.customer_location || 'Inside Tamil Nadu',
    gst_rate: invoice.gst_rate,
    notes: invoice.notes,
    status: 'unpaid',
    transport_mode: invoice.transport_mode || '',
    shipping_address: invoice.shipping_address || '',
    no_of_bundles: invoice.no_of_bundles || '',
    items: invoice.items.map((item: any) => ({
      bundle_name: item.bundle_name,
      hsn_code: item.hsn_code || "",
      quantity: item.quantity,
      rate: item.rate,
      amount: item.amount,
    }))
  };

  return createInvoice(invoiceData);
}

export async function updateInvoice(id: string, data: InvoiceSchemaType) {
  const supabase = await createClient();

  // Resolve customer (check verification_number for GST, or create new)
  data.customer_id = await resolveCustomer(supabase, data) || data.customer_id;

  // Auto-save new products
  await resolveProducts(supabase, data.items);

  const invoice = await getInvoiceById(id);
  const subtotal = data.items.reduce((sum, item) => sum + item.amount, 0);
  const { cgstRate, sgstRate, igstRate, cgstAmount, sgstAmount, igstAmount, gstAmount } =
    computeGstSplit(subtotal, data.gst_rate, data.customer_location);
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

      // Customer snapshot
      customer_name: data.customer_name,
      customer_mobile: data.customer_mobile,
      customer_email: data.customer_email,
      customer_address: data.customer_address,
      customer_gst: data.verification_type === 'GST'
        ? data.verification_number?.trim().toUpperCase() || ''
        : '',

      // Verification snapshot
      verification_type: data.verification_type || null,
      verification_number: data.verification_number?.trim().toUpperCase() || null,

      // Location
      customer_location: data.customer_location,

      // Totals
      subtotal,
      gst_rate: data.gst_rate,
      gst_amount: gstAmount,
      cgst_rate: cgstRate,
      sgst_rate: sgstRate,
      igst_rate: igstRate,
      cgst_amount: cgstAmount,
      sgst_amount: sgstAmount,
      igst_amount: igstAmount,
      grand_total: grandTotal,
      balance_amount: balanceAmount,
      payment_status: paymentStatus,
      status: invoiceStatus,
      notes: data.notes,
      transport_mode: data.transport_mode || null,
      shipping_address: data.shipping_address || null,
      no_of_bundles: data.no_of_bundles ? Number(data.no_of_bundles) : null,
    })
    .eq("id", id);

  if (invoiceError) throw new Error(invoiceError.message);

  await supabase.from("invoice_items").delete().eq("invoice_id", id);

  const itemsToInsert = data.items.map((item, index) => ({
    invoice_id: id,
    bundle_name: item.bundle_name,
    hsn_code: item.hsn_code || "",
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

  // Retrieve customer_id if exists for cache revalidation
  const { data: invoice } = await supabase
    .from("invoices")
    .select("customer_id")
    .eq("id", id)
    .maybeSingle();

  // Delete associated payments and items
  await supabase.from("payments").delete().eq("invoice_id", id);
  await supabase.from("invoice_items").delete().eq("invoice_id", id);

  // Delete the invoice record
  const { error } = await supabase.from("invoices").delete().eq("id", id);

  if (error) {
    console.error(`Error deleting invoice ${id}:`, error);
    throw new Error(error.message || "Failed to delete invoice");
  }

  revalidatePath("/invoices");
  if (invoice?.customer_id) {
    revalidatePath(`/customers/${invoice.customer_id}`);
  }
  return { success: true };
}

export async function cancelInvoice(id: string) {
  const supabase = await createClient();

  const { data: invoice } = await supabase
    .from("invoices")
    .select("customer_id, payment_status")
    .eq("id", id)
    .maybeSingle();

  if (!invoice) {
    throw new Error("Invoice not found");
  }

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

  if (error) throw new Error(error.message || "Failed to cancel invoice");

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${id}`);
  if (invoice.customer_id) {
    revalidatePath(`/customers/${invoice.customer_id}`);
  }
  return { success: true };
}

