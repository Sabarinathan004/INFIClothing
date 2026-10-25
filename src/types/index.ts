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

export type VerificationType = 'GST' | 'Aadhar' | 'PAN';
export type CustomerLocation = 'Inside Tamil Nadu' | 'Outside Tamil Nadu';
export type DocType = 'invoice' | 'quotation' | 'proforma' | 'challan';
export type SettlementMode = 'credit' | 'cash' | 'upi' | 'bank_transfer';

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email: string;
  /** @deprecated Use verification_type + verification_number instead */
  gst_number: string;
  verification_type: VerificationType | null;
  verification_number: string | null;
  address: string;
  created_at: string;
  updated_at: string;
}

export interface Bundle {
  id: string;
  name: string;
  hsn_code: string | null;
  unit?: string;
  default_price: number;
  mrp?: number;
  gst_rate?: number;
  current_stock?: number;
  low_stock_alert?: number;
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
  hsn_code: string | null;
  unit?: string;
  quantity: number;
  rate: number;
  discount_percent?: number;
  discount_amount?: number;
  taxable_amount?: number;
  gst_rate?: number;
  gst_amount?: number;
  amount: number;
  sort_order: number;
  created_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  doc_type?: DocType;
  invoice_date: string;
  customer_id: string | null;

  // Customer snapshot (frozen at invoice creation)
  customer_name: string;
  customer_mobile: string;
  customer_email: string;
  /** @deprecated Use verification_type + verification_number instead */
  customer_gst: string;
  customer_address: string;

  // Verification snapshot
  verification_type: VerificationType | null;
  verification_number: string | null;

  // Location
  customer_location: CustomerLocation;

  // Tax mode & discount
  is_tax_inclusive?: boolean;
  total_discount?: number;
  extra_discount?: number;
  round_off?: number;

  // GST totals
  subtotal: number;
  gst_rate: number;     // total rate (e.g. 5)
  gst_amount: number;   // total GST (cgst + sgst or igst)

  // GST split
  cgst_rate: number;
  sgst_rate: number;
  igst_rate: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;

  grand_total: number;

  // Payment tracking
  paid_amount: number;
  balance_amount: number;
  payment_status: InvoiceStatus;
  status: InvoiceStatus;
  notes: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;

  // Transport details & Logistics
  transport_mode: string | null;
  shipping_address: string | null;
  no_of_bundles: number | null;
  vehicle_number?: string | null;
  eway_bill_number?: string | null;

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
  verification_type: VerificationType;
  verification_number: string;
  address: string;
}

export interface BundleFormData {
  name: string;
  hsn_code: string;
  unit?: string;
  default_price: number;
  mrp?: number;
  gst_rate?: number;
  current_stock?: number;
  low_stock_alert?: number;
  is_active: boolean;
}

export interface InvoiceItemFormData {
  bundle_name: string;
  hsn_code?: string;
  unit?: string;
  quantity: number;
  rate: number;
  discount_percent?: number;
  discount_amount?: number;
  taxable_amount?: number;
  gst_rate?: number;
  gst_amount?: number;
  amount: number;
}

export interface InvoiceFormData {
  doc_type?: DocType;
  invoice_date: string;
  customer_id: string | null;
  customer_name: string;
  customer_mobile: string;
  customer_email: string;
  customer_address: string;
  verification_type: VerificationType;
  verification_number: string;
  customer_location: CustomerLocation;
  is_tax_inclusive?: boolean;
  items: InvoiceItemFormData[];
  gst_rate: number;
  extra_discount?: number;
  auto_round_off?: boolean;
  settlement_mode?: SettlementMode;
  notes: string;
  status: InvoiceStatus;
  transport_mode: string;
  shipping_address: string;
  no_of_bundles: string | number;
  vehicle_number?: string;
  eway_bill_number?: string;
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
