// ============================================
// Core Types for GST Billing System
// ============================================

export interface CompanySettings {
  id: string;
  company_name: string;
  address: string;
  phone: string;
  email: string;
  gst_number: string;
  pan_number: string;
  bank_name: string;
  bank_account: string;
  bank_ifsc: string;
  bank_branch: string;
  logo_url: string;
  default_gst_rate: number;
  invoice_prefix: string;
  invoice_notes: string;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email: string;
  gst_number: string;
  address: string;
  created_at: string;
  updated_at: string;
}

export interface Bundle {
  id: string;
  name: string;
  default_price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type InvoiceStatus = 'draft' | 'unpaid' | 'partial' | 'paid' | 'cancelled';
export type PaymentMode = 'cash' | 'upi' | 'bank_transfer' | 'cheque' | 'other';

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  bundle_name: string;
  quantity: number;
  rate: number;
  amount: number;
  sort_order: number;
  created_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  customer_id: string | null;
  customer_name: string;
  customer_mobile: string;
  customer_email: string;
  customer_gst: string;
  customer_address: string;
  subtotal: number;
  gst_rate: number;
  gst_amount: number;
  grand_total: number;
  paid_amount: number;
  balance_amount: number;
  status: InvoiceStatus;
  notes: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  items?: InvoiceItem[];
  payments?: Payment[];
}

export interface Payment {
  id: string;
  invoice_id: string;
  amount: number;
  payment_date: string;
  payment_mode: PaymentMode;
  notes: string;
  created_at: string;
}

// Form types (without id/timestamps)
export interface CustomerFormData {
  name: string;
  mobile: string;
  email: string;
  gst_number: string;
  address: string;
}

export interface BundleFormData {
  name: string;
  default_price: number;
  is_active: boolean;
}

export interface InvoiceItemFormData {
  bundle_name: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface InvoiceFormData {
  invoice_date: string;
  customer_id: string | null;
  customer_name: string;
  customer_mobile: string;
  customer_email: string;
  customer_gst: string;
  customer_address: string;
  items: InvoiceItemFormData[];
  gst_rate: number;
  notes: string;
  status: InvoiceStatus;
}

export interface PaymentFormData {
  amount: number;
  payment_date: string;
  payment_mode: PaymentMode;
  notes: string;
}

// Dashboard
export interface DashboardStats {
  today_sales: number;
  monthly_sales: number;
  total_revenue: number;
  total_outstanding: number;
  total_customers: number;
  total_invoices: number;
}

export interface CustomerLedgerEntry {
  invoice_id: string;
  invoice_number: string;
  invoice_date: string;
  grand_total: number;
  paid_amount: number;
  balance_amount: number;
  status: InvoiceStatus;
}

export interface CustomerLedgerSummary {
  customer: Customer;
  total_purchases: number;
  total_paid: number;
  outstanding: number;
  invoices: CustomerLedgerEntry[];
}
