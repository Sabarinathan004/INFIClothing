"use server"

import { createClient } from "@/lib/supabase/server";

export async function getDashboardStats() {
  const supabase = await createClient();

  const { data: invoices, error } = await supabase
    .from("invoices")
    .select("grand_total, paid_amount, balance_amount, status, payment_status, invoice_date");

  if (error) {
    return {
      error: error.message || "Failed to load dashboard data",
      totalSales: 0,
      totalReceived: 0,
      totalOutstanding: 0,
      customersCount: 0,
      invoiceCount: 0,
      recentInvoices: []
    };
  }

  const { count: customersCount } = await supabase
    .from("customers")
    .select("*", { count: 'exact', head: true });

  const safeInvoices = invoices || [];
  const totalSales = safeInvoices.reduce((sum, inv) => sum + Number(inv.grand_total), 0);
  const totalReceived = safeInvoices.reduce((sum, inv) => sum + Number(inv.paid_amount), 0);
  const totalOutstanding = safeInvoices.reduce((sum, inv) => sum + Number(inv.balance_amount), 0);

  // Recent invoices
  const { data: recentInvoices } = await supabase
    .from("invoices")
    .select("id, invoice_number, customer_name, grand_total, payment_status")
    .order("created_at", { ascending: false })
    .limit(5);

  return {
    error: null,
    totalSales,
    totalReceived,
    totalOutstanding,
    customersCount: customersCount || 0,
    invoiceCount: safeInvoices.length,
    recentInvoices: recentInvoices || []
  };
}

export async function getOutstandingInvoices() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("invoices")
    .select("id, invoice_number, customer_name, customer_mobile, grand_total, paid_amount, balance_amount, payment_status, invoice_date")
    .in("payment_status", ["unpaid", "partial"])
    .gt("balance_amount", 0)
    .order("balance_amount", { ascending: false });

  if (error) return [];
  return data || [];
}
