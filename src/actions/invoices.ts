"use server"

import { createClient } from "@/lib/supabase/server";
import { InvoiceSchemaType } from "@/schemas/invoice";
import { getPlaceOfSupply } from "@/lib/constants";
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
    const cleanNum = data.verification_number?.trim().toUpperCase() || null;
    const derivedPan = data.pan_number || (data.verification_type === 'PAN' ? cleanNum : (data.verification_type === 'GST' && cleanNum && cleanNum.length >= 12 ? cleanNum.substring(2, 12) : null));
    const derivedPos = data.place_of_supply || (data.verification_type === 'GST' && cleanNum ? getPlaceOfSupply(cleanNum) : (data.customer_location === 'Inside Tamil Nadu' ? '33-TAMIL NADU' : null));

    const newCustomerPayload: any = {
      name: data.customer_name.trim(),
      trade_name: (data.trade_name || data.customer_name).trim(),
      legal_name: (data.legal_name || data.customer_name).trim(),
      pan_number: derivedPan,
      place_of_supply: derivedPos,
      mobile: data.customer_mobile?.trim() || null,
      email: data.customer_email?.trim() || null,
      address: data.customer_address?.trim() || null,
      verification_type: data.verification_type || null,
      verification_number: cleanNum,
      gst_number: data.verification_type === 'GST' ? cleanNum : null,
    };

    const { data: newCustomer, error: newCustomerError } = await supabase
      .from("customers")
      .insert([newCustomerPayload])
      .select()
      .single();

    if (!newCustomerError && newCustomer) {
      return newCustomer.id;
    }

    // Fallback retry
    const legacyCustomer = { ...newCustomerPayload };
    delete legacyCustomer.trade_name;
    delete legacyCustomer.legal_name;
    delete legacyCustomer.pan_number;
    delete legacyCustomer.place_of_supply;
    const retry = await supabase.from("customers").insert([legacyCustomer]).select().single();
    if (retry.data) return retry.data.id;
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

// Inside src/actions/invoices.ts -> replace createInvoice with this upgraded version:
export async function createInvoice(data: InvoiceSchemaType) {
  const supabase = await createClient();

  data.customer_id = (await resolveCustomer(supabase, data)) || data.customer_id;
  await resolveProducts(supabase, data.items);

  // 1. Generate prefix based on document type (INV, QUO, DC, PRO)
  const prefixMap: Record<string, string> = {
    invoice: "INV",
    quotation: "QUO",
    challan: "DC",
    proforma: "PRO",
  };
  const prefix = prefixMap[data.doc_type || "invoice"] || "INV";

  const { data: numData, error: numError } = await supabase.rpc("generate_invoice_number", { prefix });
  if (numError) throw new Error("Failed to generate document number");

  // 2. Calculate totals with extra discount & round-off
  const rawSubtotal = data.items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const extraDiscount = Number(data.extra_discount || 0);
  const subtotal = Math.max(0, Math.round((rawSubtotal - extraDiscount) * 100) / 100);

  const { cgstRate, sgstRate, igstRate, cgstAmount, sgstAmount, igstAmount, gstAmount } =
    computeGstSplit(subtotal, data.gst_rate, data.customer_location);

  const unroundedGrandTotal = subtotal + gstAmount;
  const grandTotal = data.auto_round_off ? Math.round(unroundedGrandTotal) : Number(unroundedGrandTotal.toFixed(2));
  const roundOff = Number((grandTotal - unroundedGrandTotal).toFixed(2));

  // 3. Check 1-Tap Instant Settlement Mode
  const isInstantPaid = data.status !== "draft" && data.settlement_mode && data.settlement_mode !== "credit";
  const paidAmount = isInstantPaid ? grandTotal : 0;
  const balanceAmount = isInstantPaid ? 0 : grandTotal;
  const paymentStatus = data.status === "draft" ? "draft" : isInstantPaid ? "paid" : "unpaid";

  const cleanNum = data.verification_number?.trim().toUpperCase() || null;
  const derivedPan = data.pan_number || (data.verification_type === 'PAN' ? cleanNum : (data.verification_type === 'GST' && cleanNum && cleanNum.length >= 12 ? cleanNum.substring(2, 12) : null));
  const derivedPos = data.place_of_supply || (data.verification_type === 'GST' && cleanNum ? getPlaceOfSupply(cleanNum) : (data.customer_location === 'Inside Tamil Nadu' ? '33-TAMIL NADU' : ''));

  const invoicePayload: any = {
    doc_type: data.doc_type || "invoice",
    invoice_number: numData,
    invoice_date: data.invoice_date,
    customer_id: data.customer_id,
    customer_name: data.customer_name,
    trade_name: data.trade_name || data.customer_name,
    legal_name: data.legal_name || data.customer_name,
    pan_number: derivedPan,
    place_of_supply: derivedPos,
    customer_mobile: data.customer_mobile,
    customer_email: data.customer_email,
    customer_address: data.customer_address,
    customer_gst:
      data.verification_type === "GST" ? cleanNum || "" : "",
    verification_type: data.verification_type || null,
    verification_number: cleanNum,
    customer_location: data.customer_location,
    is_tax_inclusive: Boolean(data.is_tax_inclusive),
    subtotal,
    extra_discount: extraDiscount,
    round_off: roundOff,
    gst_rate: data.gst_rate,
    gst_amount: gstAmount,
    cgst_rate: cgstRate,
    sgst_rate: sgstRate,
    igst_rate: igstRate,
    cgst_amount: cgstAmount,
    sgst_amount: sgstAmount,
    igst_amount: igstAmount,
    grand_total: grandTotal,
    paid_amount: paidAmount,
    balance_amount: balanceAmount,
    payment_status: paymentStatus,
    status: data.status === "draft" ? "draft" : "created",
    notes: data.notes,
    transport_mode: data.transport_mode || null,
    shipping_address: data.shipping_address || null,
    no_of_bundles: data.no_of_bundles ? Number(data.no_of_bundles) : null,
    vehicle_number: data.vehicle_number || null,
    eway_bill_number: data.eway_bill_number || null,
  };

  let invoice: any = null;
  const { data: createdInvoice, error: invoiceError } = await supabase
    .from("invoices")
    .insert([invoicePayload])
    .select()
    .single();

  if (invoiceError) {
    console.warn("Primary invoice insert failed, attempting legacy fallback:", invoiceError.message);
    const legacyPayload = { ...invoicePayload };
    delete legacyPayload.doc_type;
    delete legacyPayload.is_tax_inclusive;
    delete legacyPayload.extra_discount;
    delete legacyPayload.round_off;
    delete legacyPayload.vehicle_number;
    delete legacyPayload.eway_bill_number;
    delete legacyPayload.trade_name;
    delete legacyPayload.legal_name;
    delete legacyPayload.pan_number;
    delete legacyPayload.place_of_supply;

    const retry = await supabase.from("invoices").insert([legacyPayload]).select().single();
    if (retry.error) {
      throw new Error(retry.error.message || "Failed to create invoice");
    }
    invoice = retry.data;
  } else {
    invoice = createdInvoice;
  }

  // 4. Insert line items
  const itemsToInsert = data.items.map((item, index) => ({
    invoice_id: invoice.id,
    bundle_name: item.bundle_name,
    hsn_code: item.hsn_code || "",
    unit: item.unit || "BDL",
    quantity: item.quantity,
    rate: item.rate,
    discount_percent: item.discount_percent || 0,
    discount_amount: item.discount_amount || 0,
    taxable_amount: item.amount,
    gst_rate: item.gst_rate ?? data.gst_rate,
    gst_amount: item.gst_amount || 0,
    amount: item.amount,
    sort_order: index,
  }));

  const { error: itemsError } = await supabase.from("invoice_items").insert(itemsToInsert);
  if (itemsError) {
    console.warn("Primary items insert failed, attempting legacy fallback:", itemsError.message);
    const legacyItems = itemsToInsert.map((i) => ({
      invoice_id: i.invoice_id,
      bundle_name: i.bundle_name,
      hsn_code: i.hsn_code,
      quantity: i.quantity,
      rate: i.rate,
      amount: i.amount,
      sort_order: i.sort_order,
    }));
    const retryItems = await supabase.from("invoice_items").insert(legacyItems);
    if (retryItems.error) throw new Error("Failed to save invoice items");
  }

  // 5. Stock deduction for final tax invoices
  if ((!data.doc_type || data.doc_type === "invoice") && data.status !== "draft") {
    for (const item of data.items) {
      if (item.bundle_name?.trim()) {
        try {
          const { data: bList } = await supabase
            .from("bundles")
            .select("id, current_stock")
            .ilike("name", item.bundle_name.trim())
            .limit(1);
          if (bList && bList.length > 0 && typeof bList[0].current_stock === "number") {
            await supabase
              .from("bundles")
              .update({
                current_stock: Math.max(0, bList[0].current_stock - Number(item.quantity || 0)),
              })
              .eq("id", bList[0].id);
          }
        } catch (err) {
          console.warn("Stock deduction skipped:", err);
        }
      }
    }
  }

  // 6. Auto-record payment row if settled via 1-Tap Paid Cash / Paid UPI / Bank Transfer
  if (isInstantPaid && grandTotal > 0) {
    await supabase.from("payments").insert([
      {
        invoice_id: invoice.id,
        amount: grandTotal,
        payment_date: data.invoice_date,
        payment_method: data.settlement_mode,
        reference_number: "Instant Settlement on Bill Creation",
      },
    ]);
  }

  revalidatePath("/invoices");
  revalidatePath("/dashboard");
  if (data.customer_id) revalidatePath(`/customers/${data.customer_id}`);

  return { success: true, id: invoice.id };
}

export async function duplicateInvoice(id: string) {
  const invoice = await getInvoiceById(id);

  const invoiceData: InvoiceSchemaType = {
    doc_type: invoice.doc_type || "invoice",
    is_tax_inclusive: Boolean(invoice.is_tax_inclusive),
    extra_discount: invoice.extra_discount || 0,
    round_off: invoice.round_off || 0,
    auto_round_off: true,
    settlement_mode: "credit",
    vehicle_number: invoice.vehicle_number || "",
    eway_bill_number: invoice.eway_bill_number || "",
    invoice_date: new Date().toISOString().split("T")[0],
    customer_id: invoice.customer_id,
    customer_name: invoice.customer_name,
    trade_name: invoice.trade_name || invoice.customer_name,
    legal_name: invoice.legal_name || invoice.customer_name,
    pan_number: invoice.pan_number || "",
    place_of_supply: invoice.place_of_supply || "",
    customer_mobile: invoice.customer_mobile,
    customer_email: invoice.customer_email,
    customer_address: invoice.customer_address,
    verification_type: invoice.verification_type || "GST",
    verification_number: invoice.verification_number || "",
    customer_location: invoice.customer_location || "Inside Tamil Nadu",
    gst_rate: invoice.gst_rate,
    notes: invoice.notes,
    status: "unpaid",
    transport_mode: invoice.transport_mode || "",
    shipping_address: invoice.shipping_address || "",
    no_of_bundles: invoice.no_of_bundles || "",
    items: invoice.items.map((item: any) => ({
      bundle_name: item.bundle_name,
      hsn_code: item.hsn_code || "",
      unit: item.unit || "BDL",
      quantity: item.quantity,
      rate: item.rate,
      discount_percent: item.discount_percent || 0,
      discount_amount: item.discount_amount || 0,
      gst_rate: item.gst_rate,
      gst_amount: item.gst_amount || 0,
      amount: item.amount,
    })),
  };

  return createInvoice(invoiceData);
}

export async function updateInvoice(id: string, data: InvoiceSchemaType) {
  const supabase = await createClient();

  data.customer_id = (await resolveCustomer(supabase, data)) || data.customer_id;
  await resolveProducts(supabase, data.items);

  const invoice = await getInvoiceById(id);
  const rawSubtotal = data.items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const extraDiscount = Number(data.extra_discount || 0);
  const subtotal = Math.max(0, Math.round((rawSubtotal - extraDiscount) * 100) / 100);

  const { cgstRate, sgstRate, igstRate, cgstAmount, sgstAmount, igstAmount, gstAmount } =
    computeGstSplit(subtotal, data.gst_rate, data.customer_location);

  const unroundedGrandTotal = subtotal + gstAmount;
  const grandTotal = data.auto_round_off ? Math.round(unroundedGrandTotal) : Number(unroundedGrandTotal.toFixed(2));
  const roundOff = Number((grandTotal - unroundedGrandTotal).toFixed(2));

  const balanceAmount = grandTotal - invoice.paid_amount;
  let paymentStatus = "unpaid";
  if (data.status === "draft") {
    paymentStatus = "draft";
  } else if (balanceAmount <= 0 && grandTotal > 0) {
    paymentStatus = "paid";
  } else if (invoice.paid_amount > 0) {
    paymentStatus = "partial";
  }

  const invoiceStatus = data.status === "draft" ? "draft" : "created";

  const cleanNum = data.verification_number?.trim().toUpperCase() || null;
  const derivedPan = data.pan_number || (data.verification_type === 'PAN' ? cleanNum : (data.verification_type === 'GST' && cleanNum && cleanNum.length >= 12 ? cleanNum.substring(2, 12) : null));
  const derivedPos = data.place_of_supply || (data.verification_type === 'GST' && cleanNum ? getPlaceOfSupply(cleanNum) : (data.customer_location === 'Inside Tamil Nadu' ? '33-TAMIL NADU' : ''));

  const updatePayload: any = {
    invoice_date: data.invoice_date,
    customer_id: data.customer_id,
    customer_name: data.customer_name,
    trade_name: data.trade_name || data.customer_name,
    legal_name: data.legal_name || data.customer_name,
    pan_number: derivedPan,
    place_of_supply: derivedPos,
    customer_mobile: data.customer_mobile,
    customer_email: data.customer_email,
    customer_address: data.customer_address,
    customer_gst:
      data.verification_type === "GST" ? cleanNum || "" : "",
    verification_type: data.verification_type || null,
    verification_number: cleanNum,
    customer_location: data.customer_location,
    subtotal,
    extra_discount: extraDiscount,
    round_off: roundOff,
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
    doc_type: data.doc_type || invoice.doc_type || "invoice",
    is_tax_inclusive: Boolean(data.is_tax_inclusive),
    vehicle_number: data.vehicle_number || null,
    eway_bill_number: data.eway_bill_number || null,
  };

  const { error: invoiceError } = await supabase.from("invoices").update(updatePayload).eq("id", id);
  if (invoiceError) {
    console.warn("Update failed, attempting legacy fallback:", invoiceError.message);
    const legacyPayload = { ...updatePayload };
    delete legacyPayload.doc_type;
    delete legacyPayload.is_tax_inclusive;
    delete legacyPayload.extra_discount;
    delete legacyPayload.round_off;
    delete legacyPayload.vehicle_number;
    delete legacyPayload.eway_bill_number;
    delete legacyPayload.trade_name;
    delete legacyPayload.legal_name;
    delete legacyPayload.pan_number;
    delete legacyPayload.place_of_supply;
    const retry = await supabase.from("invoices").update(legacyPayload).eq("id", id);
    if (retry.error) throw new Error(retry.error.message);
  }

  await supabase.from("invoice_items").delete().eq("invoice_id", id);

  const itemsToInsert = data.items.map((item, index) => ({
    invoice_id: id,
    bundle_name: item.bundle_name,
    hsn_code: item.hsn_code || "",
    unit: item.unit || "BDL",
    quantity: item.quantity,
    rate: item.rate,
    discount_percent: item.discount_percent || 0,
    discount_amount: item.discount_amount || 0,
    taxable_amount: item.amount,
    gst_rate: item.gst_rate ?? data.gst_rate,
    gst_amount: item.gst_amount || 0,
    amount: item.amount,
    sort_order: index,
  }));

  const { error: itemsError } = await supabase.from("invoice_items").insert(itemsToInsert);
  if (itemsError) {
    const legacyItems = itemsToInsert.map((i) => ({
      invoice_id: i.invoice_id,
      bundle_name: i.bundle_name,
      hsn_code: i.hsn_code,
      quantity: i.quantity,
      rate: i.rate,
      amount: i.amount,
      sort_order: i.sort_order,
    }));
    const retryItems = await supabase.from("invoice_items").insert(legacyItems);
    if (retryItems.error) throw new Error("Failed to update invoice items");
  }

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${id}`);
  if (data.customer_id) {
    revalidatePath(`/customers/${data.customer_id}`);
  }

  return { success: true, id };
}

export async function convertQuotationToInvoice(id: string) {
  const supabase = await createClient();

  const { data: doc, error: fetchErr } = await supabase
    .from("invoices")
    .select("*, invoice_items(*)")
    .eq("id", id)
    .single();

  if (fetchErr || !doc) {
    throw new Error("Document not found");
  }

  if (doc.doc_type === "invoice") {
    throw new Error("Document is already a Tax Invoice");
  }

  // Generate a new Tax Invoice number with 'INV' prefix
  const { data: invNum, error: numError } = await supabase.rpc("generate_invoice_number", { prefix: "INV" });
  if (numError) throw new Error("Failed to generate Tax Invoice number");

  // Update document to Tax Invoice
  const { error: updateErr } = await supabase
    .from("invoices")
    .update({
      doc_type: "invoice",
      invoice_number: invNum,
      invoice_date: new Date().toISOString().split("T")[0],
    })
    .eq("id", id);

  if (updateErr) {
    console.error("Error converting to invoice:", updateErr);
    throw new Error(updateErr.message || "Failed to convert document");
  }

  // Deduct quantity from bundles.current_stock for items
  if (doc.invoice_items && Array.isArray(doc.invoice_items)) {
    for (const item of doc.invoice_items) {
      if (item.bundle_name?.trim()) {
        try {
          const { data: bList } = await supabase
            .from("bundles")
            .select("id, current_stock")
            .ilike("name", item.bundle_name.trim())
            .limit(1);
          if (bList && bList.length > 0 && typeof bList[0].current_stock === "number") {
            await supabase
              .from("bundles")
              .update({
                current_stock: Math.max(0, bList[0].current_stock - Number(item.quantity || 0)),
              })
              .eq("id", bList[0].id);
          }
        } catch (e) {
          console.warn("Stock deduction skipped during quotation conversion:", e);
        }
      }
    }
  }

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${id}`);
  if (doc.customer_id) {
    revalidatePath(`/customers/${doc.customer_id}`);
  }

  return { id };
}

export async function deleteInvoice(id: string) {
  const supabase = await createClient();

  const { data: invoice } = await supabase
    .from("invoices")
    .select("customer_id")
    .eq("id", id)
    .maybeSingle();

  await supabase.from("payments").delete().eq("invoice_id", id);
  await supabase.from("invoice_items").delete().eq("invoice_id", id);

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

  if (invoice.payment_status === "cancelled") {
    throw new Error("Invoice is already cancelled");
  }

  const { error } = await supabase
    .from("invoices")
    .update({
      payment_status: "cancelled",
      status: "cancelled",
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


