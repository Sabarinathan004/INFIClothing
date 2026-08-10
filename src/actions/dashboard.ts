"use server"

import { createClient } from "@/lib/supabase/server";

export async function getDashboardStats() {
  const supabase = await createClient();

  // Fetch stats and recent invoices in parallel
  const [statsResponse, customersResponse, recentInvoicesResponse] = await Promise.all([
    supabase.rpc("get_dashboard_stats").single(),
    supabase.from("customers").select("id", { count: "exact", head: true }),
    supabase
      .from("invoices")
      .select("id, invoice_number, customer_name, grand_total, payment_status")
      .order("created_at", { ascending: false })
      .limit(5)
  ]);

  if (statsResponse.error) {
    console.error("Dashboard Stats Error:", statsResponse.error);
    return {
      error: "Failed to load dashboard data",
      totalSales: 0,
      totalReceived: 0,
      totalOutstanding: 0,
      customersCount: 0,
      invoiceCount: 0,
      recentInvoices: []
    };
  }

  const stats: any = statsResponse.data || {
    total_sales: 0,
    total_received: 0,
    total_outstanding: 0,
    invoice_count: 0
  };

  return {
    error: null,
    totalSales: Number(stats.total_sales),
    totalReceived: Number(stats.total_received),
    totalOutstanding: Number(stats.total_outstanding),
    customersCount: customersResponse.count || 0,
    invoiceCount: Number(stats.invoice_count),
    recentInvoices: recentInvoicesResponse.data || []
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
