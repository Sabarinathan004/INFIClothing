# INFI Clothings (`gst-billing`) — Complete Source Code Export

> **Generated for Architectural Refactoring & Swipe GST Parity Upgrade**
> Target: High-precision single-handed mobile UI/UX, Swipe-level billing workflows, and full feature parity.
> All source code below is complete, unabridged, and ready for line-by-line refactoring.

---

## SECTION 1: Complete Database Schema & Migrations

*Full SQL schema and migrations for Supabase / PostgreSQL, including triggers, stored procedures, RLS policies, and performance indexes.*

### File: `supabase/migrations/20231025_initial_schema.sql`

```sql
-- Initial Schema for GST Billing System

-- Extension for UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Company Settings
CREATE TABLE company_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT NOT NULL,
  company_address TEXT,
  gst_number TEXT,
  phone_number TEXT,
  email TEXT,
  upi_id TEXT,
  default_gst_rate DECIMAL(5,2) DEFAULT 5.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure only one row in company_settings
CREATE UNIQUE INDEX company_settings_single_row ON company_settings ((1));

-- 2. Customers
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  mobile TEXT,
  email TEXT,
  gst_number TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Bundles
CREATE TABLE bundles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  default_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Invoices
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT UNIQUE NOT NULL,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Customer Snapshot
  customer_id UUID REFERENCES customers(id) ON DELETE RESTRICT,
  customer_name TEXT NOT NULL,
  customer_mobile TEXT,
  customer_email TEXT,
  customer_gst TEXT,
  customer_address TEXT,
  
  -- Totals
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  gst_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  gst_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  grand_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  
  -- Payment Tracking
  paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  balance_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  payment_status TEXT NOT NULL CHECK (payment_status IN ('draft', 'unpaid', 'partial', 'paid')),
  
  status TEXT NOT NULL CHECK (status IN ('draft', 'created', 'cancelled')),
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Invoice Items
CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  bundle_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  rate DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT NOT NULL,
  reference_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sequence for Invoice Numbers
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number(prefix text DEFAULT 'INV')
RETURNS text AS $$
DECLARE
    next_val int;
    year text;
BEGIN
    year := to_char(CURRENT_DATE, 'YY');
    SELECT nextval('invoice_number_seq') INTO next_val;
    RETURN prefix || '-' || year || '-' || lpad(next_val::text, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS) setup - Allow authenticated users full access
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated full access" ON company_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access" ON customers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access" ON bundles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access" ON invoices FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access" ON invoice_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated full access" ON payments FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

---

### File: `supabase/migrations/20260624_verification_and_gst_split.sql`

```sql
-- Migration: Add Verification Details & GST Split Columns
-- Date: 2026-06-24

-- ============================================================
-- 1. CUSTOMERS TABLE
--    Add structured verification fields.
--    gst_number is retained for backward compatibility.
-- ============================================================

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS verification_type VARCHAR(20),
  ADD COLUMN IF NOT EXISTS verification_number VARCHAR(50);

-- Back-fill: if existing rows have a gst_number, migrate it
UPDATE customers
SET
  verification_type = 'GST',
  verification_number = gst_number
WHERE gst_number IS NOT NULL
  AND gst_number <> ''
  AND verification_type IS NULL;

-- ============================================================
-- 2. INVOICES TABLE
--    Add verification snapshot, customer location, and
--    full GST split columns for CGST / SGST / IGST.
--    gst_rate and gst_amount are retained for backward compat.
-- ============================================================

ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS verification_type   VARCHAR(20),
  ADD COLUMN IF NOT EXISTS verification_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS customer_location   VARCHAR(50) DEFAULT 'Inside Tamil Nadu',
  ADD COLUMN IF NOT EXISTS cgst_rate           DECIMAL(5,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS sgst_rate           DECIMAL(5,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS igst_rate           DECIMAL(5,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS cgst_amount         DECIMAL(12,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS sgst_amount         DECIMAL(12,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS igst_amount         DECIMAL(12,2) DEFAULT 0.00;

-- Back-fill: migrate existing invoices assuming Inside Tamil Nadu (CGST+SGST split)
UPDATE invoices
SET
  customer_location = 'Inside Tamil Nadu',
  cgst_rate  = gst_rate / 2,
  sgst_rate  = gst_rate / 2,
  igst_rate  = 0,
  cgst_amount = gst_amount / 2,
  sgst_amount = gst_amount / 2,
  igst_amount = 0
WHERE customer_location IS NULL
   OR customer_location = '';

-- Back-fill: migrate verification snapshot from customer_gst
UPDATE invoices
SET
  verification_type   = 'GST',
  verification_number = customer_gst
WHERE customer_gst IS NOT NULL
  AND customer_gst <> ''
  AND verification_type IS NULL;

-- Fix payment_status check constraint to include 'cancelled' if not already present
-- (safe no-op if already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'invoices_payment_status_check'
      AND conrelid = 'invoices'::regclass
  ) THEN
    -- constraint already exists under a different name or was inline; skip
    NULL;
  END IF;
END $$;
```

---

### File: `supabase/migrations/20260624_transport_details.sql`

```sql
-- Migration: Add Transport Details to Invoices
-- Date: 2026-06-24

ALTER TABLE invoices
ADD COLUMN transport_mode text,
ADD COLUMN shipping_address text,
ADD COLUMN no_of_bundles integer;
```

---

### File: `supabase/migrations/20260624_payment_methods.sql`

```sql
-- Migration: Add Payment Method fields to company_settings
-- Date: 2026-06-24

ALTER TABLE company_settings
ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'upi',
ADD COLUMN IF NOT EXISTS bank_account_number text,
ADD COLUMN IF NOT EXISTS bank_ifsc_code text,
ADD COLUMN IF NOT EXISTS bank_name text,
ADD COLUMN IF NOT EXISTS bank_account_holder text,
ADD COLUMN IF NOT EXISTS cash_instructions text;
```

---

### File: `supabase/migrations/20260624_product_store_update.sql`

```sql
-- Add HSN Code to bundles and invoice_items tables

-- Add hsn_code to bundles
ALTER TABLE public.bundles 
ADD COLUMN hsn_code VARCHAR(50);

-- Add hsn_code to invoice_items
ALTER TABLE public.invoice_items 
ADD COLUMN hsn_code VARCHAR(50);
```

---

### File: `supabase/migrations/20260706_performance_indexes.sql`

```sql
-- Migration: Performance Indexes and Dashboard Stats RPC
-- Date: 2026-07-06

-- 1. Enable pg_trgm for efficient ILIKE searches
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 2. Add GIN indexes for customer search (name, mobile, verification_number)
CREATE INDEX IF NOT EXISTS idx_customers_name_trgm ON customers USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_customers_mobile_trgm ON customers USING gin (mobile gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_customers_verification_number_trgm ON customers USING gin (verification_number gin_trgm_ops);

-- 3. Add B-Tree indexes for Invoices
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices (customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON invoices (invoice_date DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_payment_status ON invoices (payment_status);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices (created_at DESC);

-- 4. Add GIN/B-Tree indexes for Bundles/Products
CREATE INDEX IF NOT EXISTS idx_bundles_name_trgm ON bundles USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_bundles_hsn_code ON bundles (hsn_code);

-- 5. RPC Function for Dashboard Stats to avoid memory leaks
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS TABLE (
  total_sales DECIMAL(12,2),
  total_received DECIMAL(12,2),
  total_outstanding DECIMAL(12,2),
  invoice_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(grand_total), 0)::DECIMAL(12,2) AS total_sales,
    COALESCE(SUM(paid_amount), 0)::DECIMAL(12,2) AS total_received,
    COALESCE(SUM(balance_amount), 0)::DECIMAL(12,2) AS total_outstanding,
    COUNT(id)::BIGINT AS invoice_count
  FROM invoices;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## SECTION 2: Core Types, Validation Schemas & Math Utilities

*TypeScript interfaces, financial decimal-safe math utilities, Indian number-to-words converters, and Zod validation schemas.*

### File: `src/types/index.ts`

```typescript
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
  hsn_code: string | null;
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

  // GST totals
  subtotal: number;
  gst_rate: number;     // total rate (e.g. 5)
  gst_amount: number;   // total GST (cgst + sgst or igst)

  // GST split (new columns)
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

  // Transport details
  transport_mode: string | null;
  shipping_address: string | null;
  no_of_bundles: number | null;

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
  default_price: number;
  is_active: boolean;
}

export interface InvoiceItemFormData {
  bundle_name: string;
  hsn_code: string;
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
  customer_address: string;
  verification_type: VerificationType;
  verification_number: string;
  customer_location: CustomerLocation;
  items: InvoiceItemFormData[];
  gst_rate: number;
  notes: string;
  status: InvoiceStatus;
  transport_mode: string;
  shipping_address: string;
  no_of_bundles: string | number;
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
```

---

### File: `src/lib/constants.ts`

```typescript
export const APP_NAME = 'INFI Clothings';

export const PAYMENT_MODES = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'other', label: 'Other' },
] as const;

export const GST_RATES = [
  { value: 0, label: 'No GST (0%)' },
  { value: 5, label: 'GST 5%' },
  { value: 12, label: 'GST 12%' },
  { value: 18, label: 'GST 18%' },
  { value: 28, label: 'GST 28%' },
] as const;

export const INVOICE_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'partial', label: 'Partially Paid' },
  { value: 'paid', label: 'Paid' },
  { value: 'cancelled', label: 'Cancelled' },
] as const;

export const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { href: '/invoices/new', label: 'New Invoice', icon: 'Plus' },
  { href: '/invoices', label: 'Invoices', icon: 'FileText' },
  { label: 'Customers', href: '/customers', icon: 'Users' },
  { label: 'Product Store', href: '/bundles', icon: 'Package' },
  { label: 'Settings', href: '/settings', icon: 'Settings' },
] as const;
```

---

### File: `src/lib/utils.ts`

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as Indian Rupee currency.
 * Uses decimal-safe string formatting.
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Decimal-safe multiplication to avoid floating point errors.
 * Converts to integers, multiplies, then divides back.
 */
export function safeMultiply(a: number, b: number): number {
  const precision = 100; // 2 decimal places
  return Math.round(a * precision * b) / precision;
}

/**
 * Decimal-safe addition of multiple numbers.
 */
export function safeAdd(...numbers: number[]): number {
  const precision = 100;
  const sum = numbers.reduce((acc, n) => acc + Math.round(n * precision), 0);
  return sum / precision;
}

/**
 * Calculate GST amount from subtotal and rate.
 */
export function calculateGST(subtotal: number, gstRate: number): number {
  return Math.round(subtotal * gstRate) / 100;
}

/**
 * Format a date string for display.
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/**
 * Format date and time string with hours, minutes, seconds and AM/PM.
 * Example output: "13 Aug 2026 11:47:42 AM"
 */
export function formatDateTime(dateStr?: string, createdAtStr?: string): string {
  if (!dateStr && !createdAtStr) {
    return formatSingleDateTime(new Date());
  }

  let targetDate: Date | null = null;

  // 1. If createdAtStr has a valid timestamp, prefer it for exact time
  if (createdAtStr) {
    const cd = new Date(createdAtStr);
    if (!isNaN(cd.getTime())) {
      targetDate = cd;
    }
  }

  // 2. If dateStr contains full ISO string with time
  if (!targetDate && dateStr && dateStr.includes("T")) {
    const dd = new Date(dateStr);
    if (!isNaN(dd.getTime())) {
      targetDate = dd;
    }
  }

  // 3. If dateStr is YYYY-MM-DD, parse date components + combine with time
  if (dateStr && !dateStr.includes("T")) {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);

      let hours = 0, minutes = 0, seconds = 0;
      if (createdAtStr) {
        const cd = new Date(createdAtStr);
        if (!isNaN(cd.getTime())) {
          hours = cd.getHours();
          minutes = cd.getMinutes();
          seconds = cd.getSeconds();
        }
      } else {
        const now = new Date();
        hours = now.getHours();
        minutes = now.getMinutes();
        seconds = now.getSeconds();
      }

      targetDate = new Date(year, month, day, hours, minutes, seconds);
    }
  }

  if (!targetDate || isNaN(targetDate.getTime())) {
    targetDate = new Date();
  }

  return formatSingleDateTime(targetDate);
}

function formatSingleDateTime(date: Date): string {
  const dayMonthYear = new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);

  const timePart = new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(date).toUpperCase();

  return `${dayMonthYear} ${timePart}`;
}

/**
 * Format date for input fields (YYYY-MM-DD).
 */
export function toDateInputValue(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

/**
 * Get status badge color.
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'paid':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
    case 'partial':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
    case 'unpaid':
    case 'created': // DB stores 'created' for non-draft invoices; treat as unpaid
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    case 'draft':
      return 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400';
    case 'cancelled':
      return 'bg-gray-100 text-gray-500 dark:bg-gray-900/30 dark:text-gray-500';
    default:
      return 'bg-slate-100 text-slate-800';
  }
}

/**
 * Get human-readable label for an invoice status.
 * Uses payment_status for display when available (paid/unpaid/partial).
 * Falls back gracefully for draft, cancelled, or the DB 'created' value.
 */
export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    paid: 'Paid',
    unpaid: 'Unpaid',
    partial: 'Partially Paid',
    draft: 'Draft',
    cancelled: 'Cancelled',
    created: 'Unpaid', // DB internal value — display as Unpaid
  };
  return map[status] ?? (status.charAt(0).toUpperCase() + status.slice(1));
}


/**
 * Convert number to words (Indian numbering system) for invoice amount.
 */
export function numberToWords(num: number): string {
  if (num === 0) return 'Zero';

  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertGroup(n: number): string {
    if (n === 0) return '';
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convertGroup(n % 100) : '');
  }

  const intPart = Math.floor(num);
  const decPart = Math.round((num - intPart) * 100);

  let result = '';
  const crore = Math.floor(intPart / 10000000);
  const lakh = Math.floor((intPart % 10000000) / 100000);
  const thousand = Math.floor((intPart % 100000) / 1000);
  const remainder = intPart % 1000;

  if (crore > 0) result += convertGroup(crore) + ' Crore ';
  if (lakh > 0) result += convertGroup(lakh) + ' Lakh ';
  if (thousand > 0) result += convertGroup(thousand) + ' Thousand ';
  if (remainder > 0) result += convertGroup(remainder);

  result = result.trim() + ' Rupees';

  if (decPart > 0) {
    result += ' and ' + convertGroup(decPart) + ' Paise';
  }
  result += ' Only';

  return result;
}
```

---

### File: `src/lib/gst-parser.ts`

```typescript
export interface GSTApiResponse {
  success?: boolean
  data: any
}

export function formatGSTAddress(addrObj?: any): string {
  const addr = addrObj?.address || addrObj
  if (!addr) return 'Address not available'

  // Deduplicate location and district if identical
  const location = addr.location && addr.location !== addr.district ? addr.location : null

  const parts = [
    addr.buildingNumber,
    addr.buildingName,
    addr.street,
    addr.locality,
    location,
    addr.district,
    addr.stateCode && addr.pincode ? `${addr.stateCode} - ${addr.pincode}` : addr.stateCode || addr.pincode,
  ]

  return parts
    .map((p) => typeof p === 'string' ? p.trim() : p)
    .filter((p): p is string => Boolean(p && typeof p === 'string' && p.length > 0))
    .join(', ')
}

export function parseGSTRecord(apiResponse: GSTApiResponse) {
  // Defensively handle array or direct object
  const record = Array.isArray(apiResponse.data) ? apiResponse.data[0] : apiResponse.data

  if (!record) {
    throw new Error('No GST record found in the API response.')
  }

  if (record.status && record.status.toLowerCase() !== 'active') {
    throw new Error(`GSTIN is ${record.status}. Inactive entities cannot be billed.`)
  }

  const customerName = record.legalName?.trim() || record.tradeName?.trim() || 'Unknown Entity'
  const fullAddress = formatGSTAddress(record.principalAddress)

  return {
    customerName,
    customerAddress: fullAddress,
    gstNumber: record.gstNumber,
    status: record.status || 'Active',
  }
}
```

---

### File: `src/schemas/invoice.ts`

```typescript
import { z } from 'zod';

const VERIFICATION_TYPES = ['GST', 'Aadhar', 'PAN'] as const;

const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{3}$/;
const AADHAR_REGEX = /^\d{12}$/;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

const invoiceItemSchema = z.object({
  bundle_name: z.string().min(1, 'Product name is required'),
  hsn_code: z.string().default(''),
  quantity: z.coerce.number().min(0.01, 'Quantity must be positive'),
  rate: z.coerce.number().min(0, 'Rate must be positive'),
  amount: z.coerce.number().min(0),
});

export const invoiceSchema = z.object({
  invoice_date: z.string().min(1, 'Date is required'),
  customer_id: z.string().nullable().default(null),
  customer_name: z.string().min(1, 'Customer name is required'),
  customer_mobile: z.string().default(''),
  customer_email: z.string().default(''),
  customer_address: z.string().default(''),

  // Verification Details
  verification_type: z.enum(VERIFICATION_TYPES).optional().nullable(),
  verification_number: z.string().optional().nullable(),

  // Customer Location
  customer_location: z
    .enum(['Inside Tamil Nadu', 'Outside Tamil Nadu'])
    .default('Inside Tamil Nadu'),

  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
  gst_rate: z.coerce.number().min(0).max(100).default(5),
  notes: z.string().default(''),
  status: z.enum(['draft', 'unpaid', 'partial', 'paid', 'cancelled']).default('unpaid'),
  transport_mode: z.string().optional().default(''),
  shipping_address: z.string().optional().default(''),
  no_of_bundles: z.union([z.string(), z.number()]).optional().default(''),
}).superRefine((data, ctx) => {
  const { verification_type, verification_number } = data;
  if (!verification_number) return;

  const num = verification_number.trim().toUpperCase();

  if (verification_type === 'GST' && !GST_REGEX.test(num)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['verification_number'],
      message: 'Please enter a valid GST Number.',
    });
  } else if (verification_type === 'Aadhar' && !AADHAR_REGEX.test(num)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['verification_number'],
      message: 'Please enter a valid Aadhaar Number.',
    });
  } else if (verification_type === 'PAN' && !PAN_REGEX.test(num)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['verification_number'],
      message: 'Please enter a valid PAN Number.',
    });
  }
});

export type InvoiceSchemaType = z.infer<typeof invoiceSchema>;

export const paymentSchema = z.object({
  amount: z.coerce.number().min(0.01, 'Amount must be positive'),
  payment_date: z.string().min(1, 'Date is required'),
  payment_mode: z.enum(['cash', 'upi', 'bank_transfer', 'cheque', 'other']).default('cash'),
  notes: z.string().default(''),
});

export type PaymentSchemaType = z.infer<typeof paymentSchema>;
```

---

### File: `src/schemas/customer.ts`

```typescript
import { z } from 'zod';

const VERIFICATION_TYPES = ['GST', 'Aadhar', 'PAN'] as const;

const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{3}$/;
const AADHAR_REGEX = /^\d{12}$/;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

export const customerSchema = z.object({
  name: z.string().min(1, 'Customer name is required').max(200),
  mobile: z.string().max(15).default(''),
  email: z.string().email('Invalid email').or(z.literal('')).default(''),
  address: z.string().max(500).default(''),

  // Verification Details (replaces gst_number)
  verification_type: z.enum(VERIFICATION_TYPES, {
    error: 'Please select a verification type.',
  }),
  verification_number: z.string().min(1, 'Verification number is required'),
}).superRefine((data, ctx) => {
  const { verification_type, verification_number } = data;
  if (!verification_number) return;

  const num = verification_number.trim().toUpperCase();

  if (verification_type === 'GST' && !GST_REGEX.test(num)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['verification_number'],
      message: 'Please enter a valid GST Number.',
    });
  } else if (verification_type === 'Aadhar' && !AADHAR_REGEX.test(num)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['verification_number'],
      message: 'Please enter a valid Aadhaar Number.',
    });
  } else if (verification_type === 'PAN' && !PAN_REGEX.test(num)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['verification_number'],
      message: 'Please enter a valid PAN Number.',
    });
  }
});

export type CustomerSchemaType = z.infer<typeof customerSchema>;
```

---

### File: `src/schemas/bundle.ts`

```typescript
import { z } from 'zod';

export const bundleSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(200),
  hsn_code: z.string().max(50, 'HSN code max 50 chars').default(''),
  default_price: z.coerce
    .number()
    .min(0, 'Price must be positive')
    .multipleOf(0.01, 'Max 2 decimal places'),
  is_active: z.boolean().default(true),
});

export type BundleSchemaType = z.infer<typeof bundleSchema>;
```

---

### File: `src/schemas/payment.ts`

```typescript
import { z } from "zod";

export const paymentSchema = z.object({
  invoice_id: z.string().uuid("Invalid invoice ID"),
  amount: z.number().positive("Amount must be greater than 0"),
  payment_date: z.string(),
  payment_method: z.string().min(1, "Payment method is required"),
  reference_number: z.string().optional(),
  notes: z.string().optional(),
});

export type PaymentSchemaType = z.infer<typeof paymentSchema>;
```

---

### File: `src/schemas/settings.ts`

```typescript
import { z } from 'zod';

export const settingsSchema = z.object({
  company_name: z.string().default(''),
  company_address: z.string().default(''),
  gst_number: z.string().default(''),
  phone_number: z.string().default(''),
  email: z.string().default(''),
  upi_id: z.string().default(''),
  default_gst_rate: z.coerce.number().min(0).max(100).default(5),
  payment_method: z.string().default('both'),
  bank_account_number: z.string().default(''),
  bank_ifsc_code: z.string().default(''),
  bank_name: z.string().default(''),
  bank_account_holder: z.string().default(''),
  cash_instructions: z.string().default(''),
});

export type SettingsSchemaType = z.infer<typeof settingsSchema>;
```

---

## SECTION 3: Server Actions (`src/actions/`)

*Complete Server Actions executing all business logic, database transactions, GST split math, caching revalidations, and external RapidAPI calls.*

### File: `src/actions/invoices.ts`

```typescript
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
```

---

### File: `src/actions/customers.ts`

```typescript
"use server"

import { createClient } from "@/lib/supabase/server";
import { CustomerSchemaType } from "@/schemas/customer";
import { revalidatePath } from "next/cache";

export async function getCustomers(query: string = "", page: number = 1, pageSize: number = 50) {
  const supabase = await createClient();

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let request = supabase
    .from("customers")
    .select("*", { count: 'exact' })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (query) {
    request = request.or(
      `name.ilike.%${query}%,mobile.ilike.%${query}%,verification_number.ilike.%${query}%`
    );
  }

  const { data, count, error } = await request;

  if (error) {
    return { data: [], count: 0 };
  }

  return { data, count: count || 0 };
}

export async function searchCustomers(query: string) {
  const supabase = await createClient();

  let request = supabase
    .from("customers")
    .select("id, name, mobile, email, address, verification_type, verification_number, gst_number")
    .order("created_at", { ascending: false })
    .limit(15);

  // If a query is provided, filter by it
  if (query && query.length >= 2) {
    request = request.or(`name.ilike.%${query}%,mobile.ilike.%${query}%,verification_number.ilike.%${query}%`);
  }

  const { data, error } = await request;

  if (error) return [];
  return data;
}

export async function fetchGSTDetails(cleanGst: string) {
  const supabase = await createClient();

  // 1. Always verify with RapidAPI first
  const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
  const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || 'gst-insights-api.p.rapidapi.com'; 

  if (!RAPIDAPI_KEY) {
    throw new Error("GST API key is not configured. Please add RAPIDAPI_KEY to your .env file.");
  }

  try {
    const response = await fetch(`https://${RAPIDAPI_HOST}/getGSTDetailsUsingGST/${cleanGst}`, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to fetch GST details from API");
    }

    if (!result.success || !result.data) {
      throw new Error(result.message || "Invalid or Inactive GST number");
    }

    const data = result.data;
    
    // Parse address
    const addr = data.principalAddress?.address || {};
    const fullAddress = [
      addr.buildingName,
      addr.buildingNumber,
      addr.street,
      addr.location,
      addr.district,
      addr.streetcd,
      addr.pincode
    ].filter(Boolean).join(", ");
    
    const parsedName = data.tradeName || data.legalName || "Unknown Company";

    // 2. Check if customer already exists in our database
    const { data: existing } = await supabase
      .from("customers")
      .select("*")
      .eq("verification_number", cleanGst)
      .single();

    if (existing) {
      // Return fresh API data but include the existing customer ID
      return { 
        source: 'api', 
        data: { ...existing, name: parsedName, address: fullAddress } 
      };
    }

    // 3. Save brand new customer to database
    const newCustomerData = {
      name: parsedName,
      address: fullAddress,
      verification_type: "GST",
      verification_number: cleanGst,
      gst_number: cleanGst
    };

    const { data: savedCustomer, error: saveError } = await supabase
      .from("customers")
      .insert([newCustomerData])
      .select()
      .single();

    if (saveError) {
      console.error("Error saving fetched GST customer:", saveError);
      throw new Error("Fetched GST details successfully, but failed to save to database.");
    }

    revalidatePath("/customers");
    return { source: 'api', data: savedCustomer };

  } catch (error: any) {
    console.error("GST Fetch Error:", error);
    throw new Error(error.message || "An unexpected error occurred while fetching GST details.");
  }
}

export async function getCustomerById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error(`Error fetching customer ${id}:`, error);
    throw new Error("Failed to fetch customer details");
  }

  return data;
}

export async function createCustomer(data: CustomerSchemaType) {
  const supabase = await createClient();

  const { data: newCustomer, error } = await supabase
    .from("customers")
    .insert([{
      name: data.name,
      mobile: data.mobile,
      email: data.email,
      address: data.address,
      verification_type: data.verification_type,
      verification_number: data.verification_number?.trim().toUpperCase() || null,
      // Keep gst_number in sync for backward compatibility
      gst_number: data.verification_type === 'GST'
        ? data.verification_number?.trim().toUpperCase() || null
        : null,
    }])
    .select()
    .single();

  if (error) {
    console.error("Error creating customer:", error);
    throw new Error(error.message);
  }

  revalidatePath("/customers");
  return { success: true, data: newCustomer };
}

export async function updateCustomer(id: string, data: CustomerSchemaType) {
  const supabase = await createClient();

  const { data: updatedCustomer, error } = await supabase
    .from("customers")
    .update({
      name: data.name,
      mobile: data.mobile,
      email: data.email,
      address: data.address,
      verification_type: data.verification_type,
      verification_number: data.verification_number?.trim().toUpperCase() || null,
      // Keep gst_number in sync for backward compatibility
      gst_number: data.verification_type === 'GST'
        ? data.verification_number?.trim().toUpperCase() || null
        : null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating customer ${id}:`, error);
    throw new Error(error.message);
  }

  revalidatePath("/customers");
  revalidatePath(`/customers/${id}`);
  return { success: true, data: updatedCustomer };
}

export async function deleteCustomer(id: string) {
  const supabase = await createClient();

  // Note: The database schema uses ON DELETE RESTRICT (or SET NULL) for invoices.
  // If there are existing invoices, Supabase will throw an error automatically.
  const { error } = await supabase
    .from("customers")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(`Error deleting customer ${id}:`, error);

    // Check if it's a foreign key violation (23503)
    if (error.code === '23503') {
      throw new Error("Cannot delete customer because they have existing invoices. Please cancel or delete the invoices first.");
    }

    throw new Error(error.message);
  }

  revalidatePath("/customers");
  return { success: true };
}
```

---

### File: `src/actions/customer-actions.ts`

```typescript
"use server"

import { createClient } from "@/lib/supabase/server";
import { parseGSTRecord } from "@/lib/gst-parser";
import { revalidatePath } from "next/cache";

const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export async function fetchAndVerifyGST(gstNumber: string) {
  try {
    const cleanGst = gstNumber.trim().toUpperCase();

    if (!GST_REGEX.test(cleanGst)) {
      return { success: false, error: "Invalid GST Number format" };
    }

    const supabase = await createClient();

    // 1. Check if customer already exists locally to save API costs
    const { data: existing } = await supabase
      .from("customers")
      .select("*")
      .eq("verification_number", cleanGst)
      .single();

    if (existing) {
      return { success: true, source: 'db', data: existing };
    }

    // 2. Fetch from RapidAPI if not found locally
    const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
    const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || 'gst-insights-api.p.rapidapi.com';

    if (!RAPIDAPI_KEY) {
      return { success: false, error: "GST API key is not configured. Please add RAPIDAPI_KEY to your Vercel environment variables." };
    }

    const response = await fetch(`https://${RAPIDAPI_HOST}/getGSTDetailsUsingGST/${cleanGst}`, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.message || "Failed to fetch GST details from API" };
    }

    // 3. Parse the data defensively
    const parsedData = parseGSTRecord(result);

    // 4. Upsert the verified customer into the database
    const newCustomerData = {
      name: parsedData.customerName,
      address: parsedData.customerAddress,
      verification_type: "GST",
      verification_number: cleanGst,
      gst_number: cleanGst
    };

    const { data: savedCustomer, error: saveError } = await supabase
      .from("customers")
      .insert([newCustomerData])
      .select()
      .single();

    if (saveError) {
      console.error("Error saving fetched GST customer:", saveError);
      return { success: false, error: "Fetched GST details successfully, but failed to save to database." };
    }

    revalidatePath("/customers");
    return { success: true, source: 'api', data: savedCustomer };

  } catch (error: any) {
    console.error("GST Fetch Error:", error);
    return { success: false, error: error.message || "An unexpected error occurred while verifying GST." };
  }
}
```

---

### File: `src/actions/bundles.ts`

```typescript
"use server"

import { createClient } from "@/lib/supabase/server";
import { BundleSchemaType } from "@/schemas/bundle";
import { revalidatePath } from "next/cache";

export async function getBundles(activeOnly = false, page: number = 1, pageSize: number = 50) {
  const supabase = await createClient();

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let request = supabase
    .from("bundles")
    .select("*", { count: 'exact' })
    .order("name", { ascending: true })
    .range(from, to);

  if (activeOnly) {
    request = request.eq("is_active", true);
  }

  const { data, count, error } = await request;

  if (error) {
    return { data: [], count: 0 };
  }

  return { data, count: count || 0 };
}

export async function searchBundles(query: string) {
  const supabase = await createClient();

  let request = supabase
    .from("bundles")
    .select("id, name, hsn_code, default_price")
    .eq("is_active", true)
    .order("name", { ascending: true })
    .limit(20);

  if (query && query.trim().length > 0) {
    request = request.or(`name.ilike.%${query}%,hsn_code.ilike.%${query}%`);
  }

  const { data, error } = await request;

  if (error) return [];
  return data;
}

export async function createBundle(data: BundleSchemaType) {
  const supabase = await createClient();

  const { data: newBundle, error } = await supabase
    .from("bundles")
    .insert([data])
    .select()
    .single();

  if (error) {
    console.error("Error creating bundle:", error);
    throw new Error(error.message);
  }

  revalidatePath("/bundles");
  return { success: true, data: newBundle };
}

export async function updateBundle(id: string, data: BundleSchemaType) {
  const supabase = await createClient();

  const { data: updatedBundle, error } = await supabase
    .from("bundles")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating bundle ${id}:`, error);
    throw new Error(error.message);
  }

  revalidatePath("/bundles");
  return { success: true, data: updatedBundle };
}

export async function toggleBundleStatus(id: string, is_active: boolean) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("bundles")
    .update({ is_active })
    .eq("id", id);

  if (error) {
    console.error(`Error toggling bundle status ${id}:`, error);
    throw new Error("Failed to update status");
  }

  revalidatePath("/bundles");
  return { success: true };
}

export async function deleteBundle(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("bundles")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(`Error deleting bundle ${id}:`, error);
    throw new Error(error.message);
  }

  revalidatePath("/bundles");
  return { success: true };
}
```

---

### File: `src/actions/payments.ts`

```typescript
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
```

---

### File: `src/actions/dashboard.ts`

```typescript
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
```

---

### File: `src/actions/settings.ts`

```typescript
"use server"

import { createClient } from "@/lib/supabase/server";
import { revalidatePath, revalidateTag } from "next/cache";

export async function getSettings() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("company_settings")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Error fetching settings:", error);
    return null;
  }

  return data;
}

const ALLOWED_SETTINGS_KEYS = [
  "company_name",
  "company_address",
  "gst_number",
  "phone_number",
  "email",
  "upi_id",
  "default_gst_rate",
  "payment_method",
  "bank_account_number",
  "bank_ifsc_code",
  "bank_name",
  "bank_account_holder",
  "cash_instructions",
];

export async function updateSettings(data: any) {
  const supabase = await createClient();

  // Clean data payload to only include valid columns in company_settings table
  const cleanData: Record<string, any> = {};
  for (const key of ALLOWED_SETTINGS_KEYS) {
    if (key in data) {
      cleanData[key] = data[key];
    }
  }

  const { data: existing } = await supabase
    .from("company_settings")
    .select("id")
    .limit(1)
    .maybeSingle();

  let error;
  let savedData = null;

  if (existing?.id) {
    const { data: updated, error: updateError } = await supabase
      .from("company_settings")
      .update({
        ...cleanData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select()
      .single();
    error = updateError;
    savedData = updated;
  } else {
    const { data: inserted, error: insertError } = await supabase
      .from("company_settings")
      .insert([cleanData])
      .select()
      .single();
    error = insertError;
    savedData = inserted;
  }

  if (error) {
    console.error("Error updating settings:", error);
    throw new Error(error.message || "Failed to update settings");
  }

  revalidateTag("settings", "max");
  revalidatePath("/settings");
  revalidatePath("/invoices");


  return { success: true, data: savedData };
}
```

---

## SECTION 4: Invoice Creation & Viewing Components

*Core UI components for invoice authoring, customer selector tabs, line item table, totals calculation, 10-template invoice rendering, payment dialogs, and WhatsApp sharing.*

### File: `src/app/(dashboard)/invoices/new/page.tsx`

```tsx
import { getSettings } from "@/actions/settings";
import { NewInvoiceClient } from "./new-invoice-client";

export default async function NewInvoicePage() {
  // Provide a fallback for settings if not yet configured
  let settings;
  try {
    settings = await getSettings();
  } catch (error) {
    settings = { default_gst_rate: 5 };
  }

  return <NewInvoiceClient settings={settings} />;
}
```

---

### File: `src/app/(dashboard)/invoices/new/new-invoice-client.tsx`

```tsx
"use client";

import { useEffect, useState } from "react";
import { InvoiceForm } from "@/components/invoices/invoice-form";
import { TemplateSelector } from "@/components/invoices/template-selector";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Paintbrush } from "lucide-react";

export function NewInvoiceClient({ settings }: { settings: any }) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const stored = localStorage.getItem("selected_invoice_template");
    if (stored) {
      setSelectedTemplate(stored);
    }
  }, []);

  if (!isClient) return null; // Avoid hydration mismatch

  if (!selectedTemplate) {
    return (
      <div className="space-y-6">
        <TemplateSelector 
          onSelect={(id) => {
            localStorage.setItem("selected_invoice_template", id);
            setSelectedTemplate(id);
          }} 
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Create Invoice"
          description="Generate a new invoice for INFI Clothings."
        />
        <Button 
          variant="outline" 
          onClick={() => {
            // Optional: don't clear localStorage here if they cancel, but they want to change it.
            // If we clear it, it forces them to reselect.
            setSelectedTemplate(null);
          }}
          className="shrink-0 -mt-2 sm:-mt-6 shadow-sm bg-indigo-50/50 hover:bg-indigo-100/50 text-indigo-700 border-indigo-200"
        >
          <Paintbrush className="w-4 h-4 mr-2" />
          Change Template
        </Button>
      </div>

      <InvoiceForm 
        defaultGstRate={settings?.default_gst_rate || 5} 
        settings={settings}
      />
    </div>
  );
}
```

---

### File: `src/components/invoices/invoice-form.tsx`

```tsx
"use client"

import { useState } from "react";
import { useForm, useFieldArray, Controller, useWatch, Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { invoiceSchema, InvoiceSchemaType } from "@/schemas/invoice";
import { Bundle, Customer } from "@/types";
import { createInvoice, updateInvoice } from "@/actions/invoices";
import { fetchGSTDetails } from "@/actions/customers";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { CustomerSelector } from "@/components/invoices/customer-selector";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, ReceiptText, Store, Pencil, Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toDateInputValue, formatCurrency } from "@/lib/utils";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import dynamic from "next/dynamic";
const InvoiceDetailsView = dynamic(
  () => import("@/components/invoices/invoice-details-view").then(mod => mod.InvoiceDetailsView),
  { ssr: false, loading: () => <div className="p-8 text-center text-muted-foreground">Loading preview...</div> }
);
import { Eye, WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { QtyInput } from "@/components/invoices/qty-input";
import { ProductCombobox } from "@/components/invoices/product-combobox";

const GST_RATE = 5; // Fixed at 5%

interface InvoiceFormProps {
  defaultGstRate: number;
  initialData?: any;
  invoiceId?: string;
  settings?: any;
}

export function InvoiceForm({ defaultGstRate, initialData, invoiceId, settings }: InvoiceFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingGST, setIsFetchingGST] = useState(false);
  const [productMode, setProductMode] = useState<'store' | 'manual'>('store');
  const router = useRouter();
  const isOnline = useOnlineStatus();

  const form = useForm<InvoiceSchemaType>({
    resolver: zodResolver(invoiceSchema) as any,
    mode: "onChange",
    defaultValues: initialData ? {
      invoice_date: initialData.invoice_date,
      customer_id: initialData.customer_id,
      customer_name: initialData.customer_name,
      customer_mobile: initialData.customer_mobile || "",
      customer_email: initialData.customer_email || "",
      customer_address: initialData.customer_address || "",
      verification_type: initialData.verification_type || undefined,
      verification_number: initialData.verification_number || "",
      customer_location: initialData.customer_location || "Inside Tamil Nadu",
      items: initialData.items.map((item: any) => ({
        bundle_name: item.bundle_name,
        hsn_code: item.hsn_code || "",
        quantity: item.quantity,
        rate: item.rate,
        amount: item.amount
      })),
      gst_rate: GST_RATE,
      notes: initialData.notes || "",
      // Map DB status values ('created') to valid form enum values
      status: (['draft', 'unpaid', 'partial', 'paid', 'cancelled'].includes(initialData.status)
        ? initialData.status
        : 'unpaid') as any,
      transport_mode: initialData.transport_mode || "",
      shipping_address: initialData.shipping_address || "",
      no_of_bundles: initialData.no_of_bundles || "",
    } : {
      invoice_date: toDateInputValue(),
      customer_id: null,
      customer_name: "",
      customer_mobile: "",
      customer_email: "",
      customer_address: "",
      verification_type: undefined,
      verification_number: "",
      customer_location: "Inside Tamil Nadu",
      items: [{ bundle_name: "", hsn_code: "", quantity: 1, rate: 0, amount: 0 }],
      gst_rate: GST_RATE,
      notes: "",
      status: "unpaid",
      transport_mode: "",
      shipping_address: "",
      no_of_bundles: "",
    },
  });

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = form;

  // We don't watch items at the root to prevent full form re-renders on every keystroke
  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const { getValues } = form; // We actually get this from the destructured useForm above

  const handleBundleSelect = (index: number, bundle: Bundle) => {
    // @ts-ignore
    const items = control._formValues.items || [];
    const quantity = Number(items[index]?.quantity) || 1;
    setValue(`items.${index}.bundle_name`, bundle.name, { shouldValidate: true });
    setValue(`items.${index}.hsn_code`, bundle.hsn_code || "", { shouldValidate: true });
    setValue(`items.${index}.rate`, bundle.default_price, { shouldValidate: true });
    setValue(`items.${index}.amount`, bundle.default_price * quantity, { shouldValidate: true });
  };

  const calculateAmount = (index: number) => {
    // @ts-ignore
    const items = control._formValues.items || [];
    const quantity = Number(items[index]?.quantity) || 0;
    const rate = Number(items[index]?.rate) || 0;
    setValue(`items.${index}.amount`, quantity * rate, { shouldValidate: true });
  };

  const onSubmit = async (data: InvoiceSchemaType, status: 'draft' | 'unpaid') => {
    if (!isOnline) {
      toast.error("Internet connection required to save invoices.");
      return;
    }

    setIsLoading(true);
    try {
      data.status = status;
      data.gst_rate = GST_RATE;
      let result;
      if (invoiceId) {
        result = await updateInvoice(invoiceId, data);
        toast.success("Invoice updated successfully");
      } else {
        result = await createInvoice(data);
        toast.success("Invoice created successfully");
      }
      router.push(`/invoices/${result.id}`);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || `Failed to ${invoiceId ? 'update' : 'create'} invoice`);
      setIsLoading(false);
    }
  };

  const onInvalid = (errs: any) => {
    // Collect human-readable field names from errors
    const fieldLabels: Record<string, string> = {
      invoice_date: 'Invoice Date',
      customer_name: 'Customer Name',
      customer_location: 'Customer Location',
      verification_type: 'Verification Type',
      verification_number: 'Verification Number',
      items: 'Product Items',
    };
    const errFields = Object.keys(errs)
      .map((k) => fieldLabels[k] || k)
      .join(', ');
    // Also handle nested items errors
    const hasItemErrors = errs.items && Array.isArray(errs.items)
      ? errs.items.some((item: any) => item)
      : false;
    const msg = errFields
      ? `Please fix: ${errFields}`
      : 'Please fill all required fields correctly.';
    toast.error(msg);
    // Scroll to the first error field
    setTimeout(() => {
      const firstErrEl = document.querySelector('[data-field-error="true"]');
      if (firstErrEl) {
        firstErrEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  return (
    <form className="space-y-6 lg:space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Customer & Date Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ReceiptText className="w-5 h-5 text-primary" />
                Invoice Details
              </CardTitle>
            </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2" data-field-error={!!errors.invoice_date || undefined}>
                  <Label className={errors.invoice_date ? "text-destructive" : ""}>Invoice Date <span className="text-destructive">*</span></Label>
                  <Input
                    type="date"
                    {...register("invoice_date")}
                    disabled={isLoading}
                    className={errors.invoice_date ? "border-destructive ring-1 ring-destructive" : ""}
                  />
                  {errors.invoice_date && (
                    <p className="text-sm text-destructive">{errors.invoice_date.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <CustomerSelector form={form} isLoading={isLoading} />

            <Card>
              <CardContent className="pt-6 space-y-6">

              {/* Customer Location */}
              <div className="space-y-2 pt-2" data-field-error={!!errors.customer_location || undefined}>
                <Label className={errors.customer_location ? "text-destructive" : ""}>
                  Customer Location <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="customer_location"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isLoading}
                    >
                      <SelectTrigger className={`max-w-xs ${errors.customer_location ? "border-destructive ring-1 ring-destructive" : ""}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Inside Tamil Nadu">Inside Tamil Nadu</SelectItem>
                        <SelectItem value="Outside Tamil Nadu">Outside Tamil Nadu</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.customer_location && (
                  <p className="text-sm text-destructive">{errors.customer_location.message}</p>
                )}
              </div>

              {/* Transport Details */}
              <div className="space-y-3 pt-4 border-t">
                <p className="text-sm font-semibold text-foreground">Transport Details <span className="text-muted-foreground font-normal">(Optional)</span></p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Transport Mode</Label>
                    <Input placeholder="e.g. Road, Courier, Rail" {...register("transport_mode")} disabled={isLoading} />
                  </div>
                  <div className="space-y-2">
                    <Label>No. of Bundles</Label>
                    <Input type="number" min="0" placeholder="0" {...register("no_of_bundles")} disabled={isLoading} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Shipping Address</Label>
                    <Input placeholder="Leave blank if same as Customer Address" {...register("shipping_address")} disabled={isLoading} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
              <div>
                <CardTitle className="text-xl font-semibold">Product Items</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Add products to your invoice</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ bundle_name: "", hsn_code: "", quantity: 1, rate: 0, amount: 0 })}
                disabled={isLoading}
              >
                <Plus className="w-4 h-4 mr-2" /> Add Item
              </Button>
            </CardHeader>
            <CardContent className="p-0 sm:p-6 sm:pt-6">

              {/* Custom Tabs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div
                  className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all ${productMode === 'store' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/50'}`}
                  onClick={() => setProductMode('store')}
                >
                  <div className={`flex items-center gap-2 font-semibold mb-1 ${productMode === 'store' ? 'text-primary' : 'text-slate-700 dark:text-slate-300'}`}>
                    <Store className="w-5 h-5" /> Select from Product Store
                  </div>
                  <p className="text-xs text-muted-foreground">Choose from your existing products</p>
                </div>
                <div
                  className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all ${productMode === 'manual' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/50'}`}
                  onClick={() => setProductMode('manual')}
                >
                  <div className={`flex items-center gap-2 font-semibold mb-1 ${productMode === 'manual' ? 'text-primary' : 'text-slate-700 dark:text-slate-300'}`}>
                    <Pencil className="w-5 h-5" /> Create Manually
                  </div>
                  <p className="text-xs text-muted-foreground">Add a product not in the store</p>
                </div>
              </div>



              <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white dark:bg-card dark:border-slate-800">
                <Table className="min-w-[800px]">
                  <TableHeader className="bg-slate-50/80 dark:bg-slate-900/50">
                    <TableRow className="border-slate-200 dark:border-slate-800">
                      <TableHead className="w-[300px] font-semibold text-slate-700 dark:text-slate-300">Product Name</TableHead>
                      <TableHead className="w-[150px] font-semibold text-slate-700 dark:text-slate-300">HSN Code</TableHead>
                      <TableHead className="w-[140px] font-semibold text-center text-slate-700 dark:text-slate-300">Qty</TableHead>
                      <TableHead className="w-[150px] font-semibold text-right text-slate-700 dark:text-slate-300">Rate (₹)</TableHead>
                      <TableHead className="w-[150px] font-semibold text-right text-slate-700 dark:text-slate-300">Amount (₹)</TableHead>
                      <TableHead className="w-[60px] font-semibold text-center text-slate-700 dark:text-slate-300">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => {
                      const itemErrors = errors.items?.[index];
                      const hasItemError = !!(itemErrors?.bundle_name || itemErrors?.quantity || itemErrors?.rate);
                      return (
                        <TableRow key={field.id} className={`hover:bg-transparent border-slate-100 dark:border-slate-800 ${hasItemError ? 'bg-destructive/5' : ''}`} data-field-error={hasItemError || undefined}>
                          <TableCell className="p-3 align-top">
                            {productMode === 'store' ? (
                              <Controller
                                name={`items.${index}.bundle_name` as const}
                                control={control}
                                render={({ field }) => (
                                  <ProductCombobox
                                    value={field.value}
                                    onChange={field.onChange}
                                    onSelect={(bundle) => handleBundleSelect(index, bundle)}
                                    placeholder="Select a product..."
                                    disabled={isLoading}
                                    hasError={!!itemErrors?.bundle_name}
                                  />
                                )}
                              />
                            ) : (
                              <>
                                <Input
                                  {...register(`items.${index}.bundle_name` as const)}
                                  placeholder="Enter product name manually..."
                                  className={itemErrors?.bundle_name ? "border-destructive ring-1 ring-destructive" : ""}
                                  disabled={isLoading}
                                />
                                {itemErrors?.bundle_name && <p className="text-xs text-destructive mt-1">{itemErrors.bundle_name.message}</p>}
                              </>
                            )}
                          </TableCell>
                          <TableCell className="p-3 align-top">
                            <Input
                              {...register(`items.${index}.hsn_code` as const)}
                              placeholder="HSN Code"
                              disabled={isLoading}
                            />
                          </TableCell>
                          <TableCell className="p-3 align-top flex justify-center">
                            <Controller
                              name={`items.${index}.quantity` as const}
                              control={control}
                              render={({ field: { value, onChange } }) => (
                                <QtyInput
                                  value={Number(value)}
                                  onChange={(newVal) => {
                                    onChange(newVal);
                                    calculateAmount(index);
                                  }}
                                  disabled={isLoading}
                                />
                              )}
                            />
                          </TableCell>
                          <TableCell className="p-3 align-top">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              {...register(`items.${index}.rate` as const, {
                                onChange: () => calculateAmount(index)
                              })}
                              className={`text-right ${itemErrors?.rate ? 'border-destructive ring-1 ring-destructive' : ''}`}
                              disabled={isLoading}
                            />
                            {itemErrors?.rate && <p className="text-xs text-destructive mt-1">{itemErrors.rate.message}</p>}
                          </TableCell>
                          <TableCell className="p-3 align-top">
                            <Input
                              type="number"
                              readOnly
                              {...register(`items.${index}.amount` as const)}
                              className="text-right bg-slate-50/80 dark:bg-slate-900/80 font-medium"
                              disabled={isLoading}
                            />
                          </TableCell>
                          <TableCell className="p-3 align-top text-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10 h-10 w-10 mx-auto"
                              onClick={() => fields.length > 1 && remove(index)}
                              disabled={fields.length === 1 || isLoading}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Inner Totals Footer */}
              <InnerTotals control={control} fieldsLength={fields.length} />
              {errors.items && (
                <p className="text-sm text-destructive mt-4 px-4 sm:px-0">Please ensure all item details are correct.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Totals & Actions */}
        <div className="space-y-6">
          <TotalsCard
            control={control}
            isLoading={isLoading}
            isOnline={isOnline}
            invoiceId={invoiceId}
            initialData={initialData}
            settings={settings}
            onSubmitDraft={handleSubmit((data) => onSubmit(data, 'draft'), onInvalid)}
            onSubmitFinal={handleSubmit((data) => onSubmit(data, 'unpaid'), onInvalid)}
          />
        </div>
      </div>
    </form>
  );
}

// Subcomponents to isolate re-renders

function InnerTotals({ control, fieldsLength }: { control: Control<InvoiceSchemaType>; fieldsLength: number }) {
  const items = useWatch({ control, name: "items" }) || [];
  const subtotal = items.reduce((sum, item) => sum + (Number(item?.amount) || 0), 0);

  return (
    <div className="mt-6 border border-slate-200 dark:border-slate-800 bg-[#f8f9fc] dark:bg-slate-900 rounded-lg p-4 px-6 flex justify-between items-center">
      <div className="flex items-center gap-3 font-medium">
        <span className="text-slate-600 dark:text-slate-400">Total Items:</span>
        <span className="bg-[#e9e6ff] dark:bg-indigo-900/50 text-[#6039db] dark:text-indigo-400 px-3 py-1 rounded-md text-sm font-bold">{fieldsLength}</span>
      </div>
      <div className="flex items-center gap-3 font-medium">
        <span className="text-slate-600 dark:text-slate-400">Total Amount:</span>
        <span className="text-[#6039db] dark:text-indigo-400 text-xl font-bold tracking-tight">{formatCurrency(subtotal)}</span>
      </div>
    </div>
  );
}

function TotalsCard({
  control,
  isLoading,
  isOnline,
  invoiceId,
  initialData,
  settings,
  onSubmitDraft,
  onSubmitFinal
}: any) {
  const router = useRouter();
  const watchAll = useWatch({ control });
  const items = watchAll.items || [];
  const customerLocation = watchAll.customer_location || "Inside Tamil Nadu";

  const subtotal = items.reduce((sum: number, item: any) => sum + (Number(item?.amount) || 0), 0);

  let cgstRate = 0, sgstRate = 0, igstRate = 0;
  let cgstAmount = 0, sgstAmount = 0, igstAmount = 0;

  if (customerLocation === "Inside Tamil Nadu") {
    cgstRate = GST_RATE / 2;
    sgstRate = GST_RATE / 2;
    cgstAmount = Math.round(subtotal * cgstRate / 100 * 100) / 100;
    sgstAmount = Math.round(subtotal * sgstRate / 100 * 100) / 100;
  } else {
    igstRate = GST_RATE;
    igstAmount = Math.round(subtotal * igstRate / 100 * 100) / 100;
  }

  const gstAmount = cgstAmount + sgstAmount + igstAmount;
  const grandTotal = subtotal + gstAmount;

  const previewInvoiceData = {
    invoice_number: initialData?.invoice_number || "PREVIEW",
    invoice_date: watchAll.invoice_date,
    customer_name: watchAll.customer_name || "Customer Name",
    customer_mobile: watchAll.customer_mobile,
    customer_email: watchAll.customer_email,
    customer_address: watchAll.customer_address,
    verification_type: watchAll.verification_type,
    verification_number: watchAll.verification_number,
    customer_location: customerLocation,
    items: watchAll.items,
    subtotal,
    gst_rate: GST_RATE,
    gst_amount: gstAmount,
    cgst_rate: cgstRate,
    sgst_rate: sgstRate,
    igst_rate: igstRate,
    cgst_amount: cgstAmount,
    sgst_amount: sgstAmount,
    igst_amount: igstAmount,
    grand_total: grandTotal,
    paid_amount: initialData?.paid_amount || 0,
    balance_amount: grandTotal - (initialData?.paid_amount || 0),
    payment_status: watchAll.status,
    notes: watchAll.notes,
    transport_mode: watchAll.transport_mode,
    shipping_address: watchAll.shipping_address,
    no_of_bundles: watchAll.no_of_bundles
  };

  return (
    <Card className="sticky top-24">
      <CardHeader>
        <CardTitle className="text-lg">Totals</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium">{formatCurrency(subtotal)}</span>
        </div>

        {/* Dynamic GST split rows */}
        <div className="space-y-2 pt-2 border-t">
          {customerLocation === "Inside Tamil Nadu" ? (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">CGST ({cgstRate}%)</span>
                <span>{formatCurrency(cgstAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">SGST ({sgstRate}%)</span>
                <span>{formatCurrency(sgstAmount)}</span>
              </div>
            </>
          ) : (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">IGST ({igstRate}%)</span>
              <span>{formatCurrency(igstAmount)}</span>
            </div>
          )}
        </div>

        <div className="flex justify-between font-bold text-lg pt-4 border-t">
          <span>Grand Total</span>
          <span className="text-primary">{formatCurrency(grandTotal)}</span>
        </div>

      </CardContent>
      <CardFooter className="flex-col gap-3 pt-4 border-t bg-slate-50 dark:bg-card">
        {!isOnline && (
          <div className="w-full flex items-center justify-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-lg text-sm mb-2">
            <WifiOff className="w-4 h-4" />
            <span>Internet connection required to save invoices</span>
          </div>
        )}
        <Button
          type="button"
          className="w-full text-base py-6"
          onClick={onSubmitFinal}
          disabled={isLoading || !isOnline}
        >
          {isLoading ? 'Saving...' : (invoiceId ? "Update Invoice" : "Create Invoice")}
        </Button>
        <div className="flex w-full gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onSubmitDraft}
            disabled={isLoading || !isOnline}
          >
            {invoiceId ? "Update Draft" : "Save as Draft"}
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button type="button" variant="secondary" className="flex-1" disabled={isLoading}>
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] md:max-w-4xl max-h-[90vh] overflow-y-auto p-2 sm:p-6 bg-slate-50 dark:bg-slate-900 border-none shadow-xl">
              <InvoiceDetailsView invoice={previewInvoiceData} settings={settings} />
            </DialogContent>
          </Dialog>
        </div>
        <Button
          type="button"
          variant="ghost"
          className="w-full text-muted-foreground"
          onClick={() => router.push('/invoices')}
          disabled={isLoading}
        >
          Cancel
        </Button>
      </CardFooter>
    </Card>
  );
}
```

---

### File: `src/components/invoices/invoice-details-view.tsx`

```tsx
"use client"

import { formatCurrency, formatDate, formatDateTime, numberToWords } from "@/lib/utils";
import { useEffect, useState, useRef } from "react";
import QRCode from "qrcode";
import { TEMPLATES } from "./template-selector";

/* ─────────────────── Helper: UPI QR Code ─────────────────── */
function UpiQrCode({ upiId, amount, name }: { upiId: string; amount?: number; name?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!upiId || !canvasRef.current) return;
    let upiUrl = `upi://pay?pa=${upiId}`;
    if (name) upiUrl += `&pn=${encodeURIComponent(name)}`;
    if (amount && amount > 0) upiUrl += `&am=${amount}`;
    upiUrl += `&cu=INR`;
    QRCode.toCanvas(canvasRef.current, upiUrl, { width: 100, margin: 1 });
  }, [upiId, amount, name]);

  if (!upiId) return null;
  return <canvas ref={canvasRef} className="mx-auto" />;
}

/* ─────────────────── Helper: GST summary rows ─────────────────── */
function GstSummaryRows({ invoice }: { invoice: any }) {
  const location = invoice.customer_location;
  const hasSplitData = invoice.cgst_rate != null || invoice.igst_rate != null;

  if (hasSplitData) {
    if (location === "Inside Tamil Nadu") {
      return (
        <>
          <tr>
            <td colSpan={5} className="border border-black px-2 py-1 text-right text-xs font-semibold">
              CGST @ {invoice.cgst_rate ?? 2.5}%
            </td>
            <td className="border border-black px-2 py-1 text-right text-xs">
              {formatCurrency(invoice.cgst_amount ?? 0)}
            </td>
          </tr>
          <tr>
            <td colSpan={5} className="border border-black px-2 py-1 text-right text-xs font-semibold">
              SGST @ {invoice.sgst_rate ?? 2.5}%
            </td>
            <td className="border border-black px-2 py-1 text-right text-xs">
              {formatCurrency(invoice.sgst_amount ?? 0)}
            </td>
          </tr>
        </>
      );
    } else {
      return (
        <tr>
          <td colSpan={5} className="border border-black px-2 py-1 text-right text-xs font-semibold">
            IGST @ {invoice.igst_rate ?? 5}%
          </td>
          <td className="border border-black px-2 py-1 text-right text-xs">
            {formatCurrency(invoice.igst_amount ?? 0)}
          </td>
        </tr>
      );
    }
  }

  // Legacy fallback
  return (
    <tr>
      <td colSpan={5} className="border border-black px-2 py-1 text-right text-xs font-semibold">
        GST @ {invoice.gst_rate}%
      </td>
      <td className="border border-black px-2 py-1 text-right text-xs">
        {formatCurrency(invoice.gst_amount)}
      </td>
    </tr>
  );
}

/* ─────────────────── Helper: Verification display ─────────────────── */
function getVerificationDisplay(invoice: any): string | null {
  const type = invoice.verification_type;
  const num = invoice.verification_number;
  const legacyGst = invoice.customer_gst;

  if (!type && !num) {
    if (legacyGst) return `GSTIN: ${legacyGst}`;
    return null;
  }

  const displayNum =
    type === "Aadhar" && num && num.length === 12
      ? `●●●● ●●●● ${num.slice(-4)}`
      : num;

  return `${type}: ${displayNum}`;
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT — Traditional Indian Tax Invoice Layout
   ═══════════════════════════════════════════════════════════════════ */
export function LegacyInvoiceTemplate({ invoice, settings }: { invoice: any; settings: any }) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const savedLogo = localStorage.getItem("app_logo");
    if (savedLogo) setLogoUrl(savedLogo);
  }, []);

  /* ── Company settings ── */
  const companyName = settings?.company_name || "Your Company";
  const companyAddress = settings?.company_address || settings?.address || "";
  const companyPhone = settings?.phone_number || settings?.phone || "";
  const companyEmail = settings?.email || "";
  const companyGst = settings?.gst_number || "";

  // Payment settings
  const upiId = settings?.upi_id || "";
  const bankName = settings?.bank_name || "";
  const bankAccountNumber = settings?.bank_account_number || settings?.bank_account || "";
  const bankIfscCode = settings?.bank_ifsc_code || settings?.bank_ifsc || "";
  const bankAccountHolder = settings?.bank_account_holder || companyName;
  const bankBranch = settings?.bank_branch || "";
  const cashInstructions = settings?.cash_instructions || "";

  const verificationDisplay = getVerificationDisplay(invoice);

  /* Compute round-off */
  const roundOff = +(invoice.grand_total - Math.round(invoice.grand_total)).toFixed(2);
  const netTotal = Math.round(invoice.grand_total);

  return (
    <div className="bg-white text-black print:text-black max-w-4xl mx-auto print:max-w-none print:p-0 print:shadow-none print:border-0 shadow-sm border border-slate-200 rounded-xl overflow-hidden">
      {/* ═══════ Outermost table container ═══════ */}
      <table className="w-full border-collapse border border-black text-[11px] leading-snug" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
        <tbody>
          {/* ─── Row 1: Header (Logo + Company + QR) ─── */}
          <tr>
            <td colSpan={6} className="border border-black p-0">
              <table className="w-full border-collapse">
                <tbody>
                  <tr>
                    {/* Logo */}
                    <td className="w-[80px] border-r border-black p-2 align-middle text-center">
                      <img
                        src={logoUrl || "/logo.png"}
                        alt="Logo"
                        className="w-16 h-16 object-contain mx-auto print:border print:border-gray-300"
                      />
                    </td>
                    {/* Company Info */}
                    <td className="p-3 align-top">
                      <div className="text-lg font-extrabold uppercase tracking-wide">{companyName}</div>
                      {companyAddress && (
                        <div className="text-[10px] text-gray-700 whitespace-pre-wrap mt-0.5">{companyAddress}</div>
                      )}
                      {companyGst && (
                        <div className="text-[10px] mt-0.5">
                          <span className="font-semibold">GSTIN:</span>{" "}
                          <span className="uppercase">{companyGst}</span>
                        </div>
                      )}
                      {(companyPhone || companyEmail) && (
                        <div className="text-[10px] text-gray-600 mt-0.5">
                          {companyPhone && <span>Ph: {companyPhone}</span>}
                          {companyPhone && companyEmail && " | "}
                          {companyEmail && <span>{companyEmail}</span>}
                        </div>
                      )}
                    </td>
                    {/* QR Code (scan & pay) */}
                    {upiId && (
                      <td className="w-[120px] border-l border-black p-2 align-middle text-center">
                        <div className="text-[9px] font-bold mb-1 uppercase">Scan & Pay</div>
                        <UpiQrCode
                          upiId={upiId}
                          amount={invoice.balance_amount > 0 ? invoice.balance_amount : undefined}
                          name={companyName}
                        />
                      </td>
                    )}
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          {/* ─── Row 2: TAX INVOICE title bar ─── */}
          <tr>
            <td colSpan={6} className="border border-black text-center py-1.5 bg-gray-100">
              <span className="text-sm font-extrabold tracking-[0.3em] uppercase">Tax Invoice</span>
              <span className="float-right pr-3 text-[10px] italic text-gray-500">Original Copy</span>
            </td>
          </tr>

          {/* ─── Row 3: Invoice metadata (No, Date, Location) ─── */}
          <tr>
            <td colSpan={6} className="border border-black p-0">
              <table className="w-full border-collapse">
                <tbody>
                  <tr>
                    <td className="border-r border-black px-3 py-1.5 text-xs w-1/2">
                      <span className="font-semibold">Invoice No:</span>{" "}
                      <span className="font-bold text-black">{invoice.invoice_number}</span>
                    </td>
                    <td className="px-3 py-1.5 text-xs w-1/2 text-right">
                      <span className="font-semibold">Date & Time:</span>{" "}
                      <span className="font-bold">{formatDateTime(invoice.invoice_date, invoice.created_at)}</span>
                      {invoice.customer_location && (
                        <span className="ml-4 text-[10px] text-gray-500">
                          ({invoice.customer_location})
                        </span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          {/* ─── Row 4: Bill To + Shipped To ─── */}
          <tr>
            <td colSpan={6} className="border border-black p-0">
              <table className="w-full border-collapse">
                <tbody>
                  <tr>
                    {/* Bill To */}
                    <td className="border-r border-black p-3 align-top w-1/2">
                      <div className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Bill To</div>
                      <div className="font-bold text-sm">{invoice.customer_name}</div>
                      {invoice.customer_address && (
                        <div className="text-[10px] text-gray-700 whitespace-pre-wrap mt-0.5">{invoice.customer_address}</div>
                      )}
                      {verificationDisplay && (
                        <div className="text-[10px] mt-0.5">
                          <span className="uppercase font-medium">{verificationDisplay}</span>
                        </div>
                      )}
                      {invoice.customer_mobile && (
                        <div className="text-[10px] text-gray-600 mt-0.5">Mob: {invoice.customer_mobile}</div>
                      )}
                    </td>
                    {/* Shipped To / Transport */}
                    <td className="p-3 align-top w-1/2">
                      <div className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">
                        {invoice.shipping_address ? "Shipped To" : "Transport Details"}
                      </div>
                      {invoice.shipping_address && (
                        <div className="text-[10px] text-gray-700 whitespace-pre-wrap">{invoice.shipping_address}</div>
                      )}
                      {invoice.transport_mode && (
                        <div className="text-[10px] mt-0.5">
                          <span className="font-semibold">Mode:</span> {invoice.transport_mode}
                        </div>
                      )}
                      {invoice.no_of_bundles && (
                        <div className="text-[10px] mt-0.5">
                          <span className="font-semibold">Bundles:</span> {invoice.no_of_bundles}
                        </div>
                      )}
                      {!invoice.shipping_address && !invoice.transport_mode && !invoice.no_of_bundles && (
                        <div className="text-[10px] text-gray-400 italic">—</div>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          {/* ─── Row 5: Items table header ─── */}
          <tr className="bg-gray-100">
            <td className="border border-black px-2 py-1.5 text-center font-bold text-xs w-[40px]">S.No</td>
            <td className="border border-black px-2 py-1.5 font-bold text-xs">Particulars</td>
            <td className="border border-black px-2 py-1.5 text-center font-bold text-xs w-[80px]">HSN/SAC</td>
            <td className="border border-black px-2 py-1.5 text-center font-bold text-xs w-[50px]">Qty</td>
            <td className="border border-black px-2 py-1.5 text-right font-bold text-xs w-[90px]">Rate</td>
            <td className="border border-black px-2 py-1.5 text-right font-bold text-xs w-[100px]">Amount</td>
          </tr>

          {/* ─── Item rows ─── */}
          {invoice.items.map((item: any, index: number) => (
            <tr key={item.id || index}>
              <td className="border border-black px-2 py-1.5 text-center text-xs">{index + 1}</td>
              <td className="border border-black px-2 py-1.5 text-xs font-medium">{item.bundle_name}</td>
              <td className="border border-black px-2 py-1.5 text-center text-xs">{item.hsn_code || "—"}</td>
              <td className="border border-black px-2 py-1.5 text-center text-xs">{item.quantity}</td>
              <td className="border border-black px-2 py-1.5 text-right text-xs">{formatCurrency(item.rate)}</td>
              <td className="border border-black px-2 py-1.5 text-right text-xs">{formatCurrency(item.amount)}</td>
            </tr>
          ))}

          {/* ─── Empty rows to fill space (minimum 5 visible rows) ─── */}
          {Array.from({ length: Math.max(0, 5 - invoice.items.length) }).map((_, i) => (
            <tr key={`empty-${i}`}>
              <td className="border border-black px-2 py-1.5 text-xs">&nbsp;</td>
              <td className="border border-black px-2 py-1.5 text-xs">&nbsp;</td>
              <td className="border border-black px-2 py-1.5 text-xs">&nbsp;</td>
              <td className="border border-black px-2 py-1.5 text-xs">&nbsp;</td>
              <td className="border border-black px-2 py-1.5 text-xs">&nbsp;</td>
              <td className="border border-black px-2 py-1.5 text-xs">&nbsp;</td>
            </tr>
          ))}

          {/* ─── Subtotal ─── */}
          <tr className="bg-gray-50">
            <td colSpan={5} className="border border-black px-2 py-1 text-right text-xs font-semibold">
              Sub Total
            </td>
            <td className="border border-black px-2 py-1 text-right text-xs font-semibold">
              {formatCurrency(invoice.subtotal)}
            </td>
          </tr>

          {/* ─── GST rows (CGST+SGST or IGST) ─── */}
          <GstSummaryRows invoice={invoice} />

          {/* ─── Round Off ─── */}
          {roundOff !== 0 && (
            <tr>
              <td colSpan={5} className="border border-black px-2 py-1 text-right text-xs font-semibold">
                Round Off
              </td>
              <td className="border border-black px-2 py-1 text-right text-xs">
                {roundOff > 0 ? `- ${formatCurrency(roundOff)}` : `+ ${formatCurrency(Math.abs(roundOff))}`}
              </td>
            </tr>
          )}

          {/* ─── Net Total ─── */}
          <tr className="bg-gray-100">
            <td colSpan={5} className="border border-black px-2 py-1.5 text-right text-sm font-extrabold">
              Net Total
            </td>
            <td className="border border-black px-2 py-1.5 text-right text-sm font-extrabold">
              {formatCurrency(invoice.grand_total)}
            </td>
          </tr>

          {/* ─── Amount in Words ─── */}
          <tr>
            <td colSpan={6} className="border border-black px-3 py-2">
              <span className="text-[10px] font-semibold">Amount in Words: </span>
              <span className="text-[10px] italic">{numberToWords(invoice.grand_total)}</span>
            </td>
          </tr>

          {/* ─── Payment / Notes / Balance ─── */}
          <tr>
            <td colSpan={6} className="border border-black p-0">
              <table className="w-full border-collapse">
                <tbody>
                  <tr>
                    {/* Left: Payment Details & Notes */}
                    <td className="border-r border-black p-3 align-top w-1/2">
                      {/* Payment & Bank Details */}
                      {(bankAccountNumber || bankName || bankIfscCode || upiId) && (
                        <div className="mb-2">
                          <div className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-1">
                            Payment Details
                          </div>
                          
                          {/* Bank Details */}
                          {(bankAccountNumber || bankName || bankIfscCode) && (
                            <div className="text-[10px] space-y-0.5 mb-1.5">
                              {bankAccountHolder && <div><span className="font-semibold">A/C Name:</span> {bankAccountHolder}</div>}
                              {bankName && <div><span className="font-semibold">Bank:</span> {bankName}</div>}
                              {bankAccountNumber && <div><span className="font-semibold">A/C No:</span> {bankAccountNumber}</div>}
                              {bankIfscCode && <div><span className="font-semibold">IFSC:</span> <span className="uppercase">{bankIfscCode}</span></div>}
                              {bankBranch && <div><span className="font-semibold">Branch:</span> {bankBranch}</div>}
                            </div>
                          )}

                          {/* UPI Details */}
                          {upiId && (
                            <div className="text-[10px] mt-1 pt-1 border-t border-gray-200">
                              <span className="font-semibold">UPI ID:</span> {upiId}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Notes */}
                      {invoice.notes && (
                        <div>
                          <div className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-1">Remarks / Terms</div>
                          <div className="text-[10px] text-gray-700 whitespace-pre-wrap">{invoice.notes}</div>
                        </div>
                      )}
                    </td>

                    {/* Right: Paid / Balance */}
                    <td className="p-3 align-top w-1/2">
                      <table className="w-full text-xs">
                        <tbody>
                          <tr>
                            <td className="py-1 font-semibold text-emerald-700 print:text-black">Paid Amount</td>
                            <td className="py-1 text-right font-semibold text-emerald-700 print:text-black">
                              {formatCurrency(invoice.paid_amount)}
                            </td>
                          </tr>
                          <tr className="border-t border-gray-300">
                            <td className="py-1.5 font-extrabold text-sm text-red-700 print:text-black">Balance Due</td>
                            <td className="py-1.5 text-right font-extrabold text-sm text-red-700 print:text-black">
                              {formatCurrency(invoice.balance_amount)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          {/* ─── Footer: Signature + Thank you ─── */}
          <tr>
            <td colSpan={6} className="border border-black p-0">
              <table className="w-full border-collapse">
                <tbody>
                  <tr>
                    <td className="border-r border-black p-3 align-bottom w-1/2 h-20">
                      <div className="text-[10px] text-gray-500 text-center">Customer Signature</div>
                    </td>
                    <td className="p-3 align-bottom w-1/2 h-20 text-right">
                      <div className="text-[10px] font-bold">For {companyName}</div>
                      <div className="text-[10px] text-gray-500 mt-6">Authorised Signatory</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          {/* ─── Row: Thank you bar ─── */}
          <tr>
            <td colSpan={6} className="border border-black text-center py-1.5 bg-gray-50 text-[10px] text-gray-500">
              Thank you for your business! This is a computer generated invoice.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function InvoiceDetailsView({ invoice, settings }: { invoice: any; settings: any }) {
  const [templateId, setTemplateId] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("selected_invoice_template");
    if (saved) {
      setTemplateId(saved);
    }
  }, []);

  const selectedTemplate = TEMPLATES.find(t => t.id === templateId);

  let content;
  if (selectedTemplate) {
    const TemplateComponent = selectedTemplate.component;
    // @ts-ignore
    content = <TemplateComponent invoice={invoice} settings={settings} />;
  } else {
    content = <LegacyInvoiceTemplate invoice={invoice} settings={settings} />;
  }

  return (
    <div className="w-full overflow-x-auto pb-4 custom-scrollbar print:overflow-visible print:pb-0">
       <div className="min-w-[800px] w-full max-w-4xl mx-auto print:min-w-0 print:max-w-none print:w-full">
         {content}
       </div>
    </div>
  );
}
```

---

### File: `src/components/invoices/whatsapp-share.tsx`

```tsx
"use client"

import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export function WhatsAppShare({ invoice, settings }: { invoice: any, settings: any }) {
  const handleShare = () => {
    // Generate text message for WhatsApp
    const companyName = settings?.company_name || "Our Company";
    
    let message = `*Invoice from ${companyName}*\n`;
    message += `Invoice #: ${invoice.invoice_number}\n`;
    message += `Date: ${new Date(invoice.invoice_date).toLocaleDateString()}\n\n`;
    
    message += `*Items:*\n`;
    invoice.items.forEach((item: any) => {
      message += `- ${item.bundle_name} (${item.quantity} x ${formatCurrency(item.rate)}) = ${formatCurrency(item.amount)}\n`;
    });
    
    message += `\n*Total:* ${formatCurrency(invoice.grand_total)}\n`;
    
    if (invoice.balance_amount > 0) {
      message += `*Balance Due:* ${formatCurrency(invoice.balance_amount)}\n`;
    } else {
      message += `*Status:* Paid in full\n`;
    }

    if (settings?.upi_id) {
      message += `\n*UPI ID for Payment:* ${settings.upi_id}\n`;
    }

    const encodedMessage = encodeURIComponent(message);
    
    // Use customer mobile if available, otherwise just open WA to select contact
    const mobile = invoice.customer_mobile ? invoice.customer_mobile.replace(/\D/g, '') : '';
    
    const whatsappUrl = mobile 
      ? `https://wa.me/91${mobile}?text=${encodedMessage}` 
      : `https://wa.me/?text=${encodedMessage}`;
      
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Button variant="outline" className="gap-2 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 hover:text-[#25D366] border-[#25D366]/20" onClick={handleShare}>
      <Send className="w-4 h-4" />
      <span className="hidden sm:inline">Share on WhatsApp</span>
    </Button>
  );
}
```

---

### File: `src/components/payments/payment-actions.tsx`

```tsx
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
```

---

### File: `src/app/(dashboard)/invoices/page.tsx`

```tsx
import { getInvoices } from "@/actions/invoices";
import { InvoiceList } from "@/components/invoices/invoice-list";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function InvoicesPage() {
  return (
    <div>
      <PageHeader
        title="Invoices"
        description="Manage your sales invoices and track payments."
        action={
          <Button asChild>
            <Link href="/invoices/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Invoice
            </Link>
          </Button>
        }
      />
      
      <Suspense fallback={<InvoicesSkeleton />}>
        <InvoicesContent />
      </Suspense>
    </div>
  );
}

function InvoicesSkeleton() {
  return (
    <div className="space-y-4 mt-6">
      <Skeleton className="h-10 w-full md:w-1/3" />
      <Skeleton className="h-64 w-full rounded-md" />
    </div>
  );
}

async function InvoicesContent() {
  const invoices = await getInvoices();
  return <InvoiceList initialInvoices={invoices} />;
}
```

---

## SECTION 5: Navigation & Mobile Layout Shell

*Layout shell, sidebar, mobile header/sheet, topbar, and Tailwind CSS v4 styling rules with PWA standalone safe-area handling and print stylesheet.*

### File: `src/app/(dashboard)/layout.tsx`

```tsx
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { MobileNav } from "@/components/layout/mobile-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 flex overflow-hidden overscroll-none bg-slate-50 dark:bg-background print:relative print:h-auto print:bg-white">
      <div className="print:hidden">
        <Sidebar />
      </div>
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden print:overflow-visible">
        <div className="print:hidden">
          <MobileNav />
          <Topbar />
        </div>
        <main className="flex-1 overflow-y-auto overscroll-none bg-slate-50/50 dark:bg-background/95 print:overflow-visible print:bg-white pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
          <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-[1600px] print:p-0 print:max-w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
```

---

### File: `src/components/layout/sidebar.tsx`

```tsx
"use client";

import { NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Receipt, LayoutDashboard, Plus, FileText, Users, Package, Settings, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const iconMap = {
  LayoutDashboard,
  Plus,
  FileText,
  Users,
  Package,
  Settings,
};

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    // Load saved logo from local storage
    const savedLogo = localStorage.getItem("app_logo");
    if (savedLogo) {
      setLogoUrl(savedLogo);
    }
    
    // Optional: listen for storage changes so it updates instantly when topbar changes it
    const handleStorageChange = () => {
      const updatedLogo = localStorage.getItem("app_logo");
      setLogoUrl(updatedLogo);
    };
    
    window.addEventListener("storage", handleStorageChange);
    // Also poll occasionally in case it was changed in the same tab
    const interval = setInterval(handleStorageChange, 1000);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  return (
    <aside className="hidden lg:flex w-64 flex-col border-r bg-white dark:bg-card px-4 py-6 justify-between h-screen sticky top-0">
      <div className="space-y-8">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-md overflow-hidden bg-black flex-shrink-0">
            <img src={logoUrl || "/logo.png"} alt="INFI Clothings Logo" className="w-full h-full object-cover" />
          </div>
          <span className="font-bold text-xl tracking-tight text-foreground line-clamp-1">
            INFI Clothings
          </span>
        </div>

        <nav className="space-y-1.5">
          {NAV_ITEMS.map((item) => {
            const Icon = iconMap[item.icon as keyof typeof iconMap];
            const isActive = pathname.startsWith(item.href) && (item.href !== '/dashboard' || pathname === '/dashboard');
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-slate-100 hover:text-foreground dark:hover:bg-accent dark:hover:text-accent-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="pt-6 border-t">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition-colors duration-200"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
```

---

### File: `src/components/layout/mobile-nav.tsx`

```tsx
"use client"

import { NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Plus, FileText, Users, Package, Settings, Menu, LogOut, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";
import { updateSettings } from "@/actions/settings";

const iconMap = {
  LayoutDashboard,
  Plus,
  FileText,
  Users,
  Package,
  Settings,
};

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const result = reader.result as string;
        setLogoUrl(result);
        localStorage.setItem("app_logo", result);
        try {
          await updateSettings({ logo_url: result });
        } catch (error) {
          console.error("Failed to update logo in database:", error);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerLogoUpload = () => {
    fileInputRef.current?.click();
  };

  useEffect(() => {
    const savedLogo = localStorage.getItem("app_logo");
    if (savedLogo) {
      setLogoUrl(savedLogo);
    }

    const handleStorageChange = () => {
      const updatedLogo = localStorage.getItem("app_logo");
      setLogoUrl(updatedLogo);
    };

    window.addEventListener("storage", handleStorageChange);
    const interval = setInterval(handleStorageChange, 1000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="flex items-center justify-between px-4 pl-[max(env(safe-area-inset-left),1rem)] pr-[max(env(safe-area-inset-right),1rem)] pt-[max(env(safe-area-inset-top),0.75rem)] pb-3 border-b bg-white dark:bg-card lg:hidden sticky top-0 z-40">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-md overflow-hidden bg-black flex-shrink-0">
            <img src={logoUrl || "/logo.png"} alt="INFI Clothings" className="w-full h-full object-cover" />
          </div>
        <span className="font-bold text-lg text-foreground truncate">INFI Clothings</span>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="p-2 -mr-2 text-muted-foreground hover:bg-slate-100 dark:hover:bg-accent rounded-md">
              <Menu className="w-6 h-6" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] flex flex-col">
            <SheetHeader className="p-6 text-left border-b border-border/50 shrink-0">
              <SheetTitle className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-md overflow-hidden bg-black flex-shrink-0">
                  <img src={logoUrl || "/logo.png"} alt="INFI Clothings" className="w-full h-full object-cover" />
                </div>
                <span className="font-bold text-xl truncate">INFI Clothings</span>
              </SheetTitle>
            </SheetHeader>
            <div className="flex flex-col justify-between flex-1 overflow-y-auto p-4">
              <nav className="space-y-1.5">
                {NAV_ITEMS.map((item) => {
                  const Icon = iconMap[item.icon as keyof typeof iconMap];
                  const isActive = pathname.startsWith(item.href) && (item.href !== '/dashboard' || pathname === '/dashboard');

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-slate-100 hover:text-foreground dark:hover:bg-accent dark:hover:text-accent-foreground"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              <div className="pt-6 border-t border-border/50 space-y-2">
                <button
                  onClick={() => {
                    setOpen(false);
                    triggerLogoUpload();
                  }}
                  className="flex w-full items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-slate-100 hover:text-foreground dark:hover:bg-accent dark:hover:text-accent-foreground transition-colors"
                >
                  <ImageIcon className="w-5 h-5" />
                  Change Logo
                </button>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleLogoUpload} 
        accept="image/*" 
        className="hidden" 
      />
    </div>
  );
}
```

---

### File: `src/components/layout/topbar.tsx`

```tsx
"use client"

import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { useEffect, useState, useRef } from "react";
import { ThemeToggle } from "./theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { Image as ImageIcon, Settings, LogOut } from "lucide-react";
import { updateSettings } from "@/actions/settings";

export function Topbar() {
  const [user, setUser] = useState<User | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // Load saved logo from local storage
    const savedLogo = localStorage.getItem("app_logo");
    if (savedLogo) {
      setLogoUrl(savedLogo);
    }
  }, [supabase.auth]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const result = reader.result as string;
        setLogoUrl(result);
        localStorage.setItem("app_logo", result);
        try {
          await updateSettings({ logo_url: result });
        } catch (error) {
          console.error("Failed to update logo in database:", error);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerLogoUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <header className="hidden lg:flex h-16 items-center justify-between border-b bg-white dark:bg-card px-6 pl-[max(env(safe-area-inset-left),1.5rem)] pr-[max(env(safe-area-inset-right),1.5rem)] sticky top-0 z-30 pt-[env(safe-area-inset-top)]">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          INFI Clothings
        </h2>
      </div>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 hover:opacity-80 transition-opacity focus:outline-none">
              <div className="flex flex-col items-end">
                <span className="text-sm font-medium leading-none">
                  {user?.email?.split('@')[0] || 'Admin'}
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  {user?.email}
                </span>
              </div>
              <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold overflow-hidden border border-border/50 shadow-sm">
                <img src={logoUrl || "/logo.png"} alt="Logo" className="w-full h-full object-cover" />
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onSelect={(e) => {
                e.preventDefault();
                triggerLogoUpload();
              }} 
              className="cursor-pointer"
            >
              <ImageIcon className="mr-2 h-4 w-4" />
              <span>Change Logo</span>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-600 focus:text-red-600 cursor-pointer"
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = '/login';
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleLogoUpload} 
        accept="image/*" 
        className="hidden" 
      />
    </header>
  );
}
```

---

### File: `src/app/globals.css`

```css
@import "tailwindcss";

@custom-variant dark (&:is(.dark *));

@theme {
  --font-sans: var(--font-inter), ui-sans-serif, system-ui, sans-serif,
    "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";

  --color-border: hsl(var(--border));
  --color-input: hsl(var(--input));
  --color-ring: hsl(var(--ring));
  --color-background: hsl(var(--background));
  --color-foreground: hsl(var(--foreground));

  --color-primary: hsl(var(--primary));
  --color-primary-foreground: hsl(var(--primary-foreground));

  --color-secondary: hsl(var(--secondary));
  --color-secondary-foreground: hsl(var(--secondary-foreground));

  --color-destructive: hsl(var(--destructive));
  --color-destructive-foreground: hsl(var(--destructive-foreground));

  --color-muted: hsl(var(--muted));
  --color-muted-foreground: hsl(var(--muted-foreground));

  --color-accent: hsl(var(--accent));
  --color-accent-foreground: hsl(var(--accent-foreground));

  --color-popover: hsl(var(--popover));
  --color-popover-foreground: hsl(var(--popover-foreground));

  --color-card: hsl(var(--card));
  --color-card-foreground: hsl(var(--card-foreground));

  --radius-lg: var(--radius);
  --radius-md: calc(var(--radius) - 2px);
  --radius-sm: calc(var(--radius) - 4px);

  --animate-accordion-down: accordion-down 0.2s ease-out;
  --animate-accordion-up: accordion-up 0.2s ease-out;
  --animate-slide-up: slide-up 0.35s cubic-bezier(0.16, 1, 0.3, 1);

  @keyframes accordion-down {
    from {
      height: 0;
    }
    to {
      height: var(--radix-accordion-content-height);
    }
  }
  @keyframes accordion-up {
    from {
      height: var(--radix-accordion-content-height);
    }
    to {
      height: 0;
    }
  }
  @keyframes slide-up {
    from {
      transform: translateY(100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
}

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;

    --card: 0 0% 100%;
    --card-foreground: 240 10% 3.9%;

    --popover: 0 0% 100%;
    --popover-foreground: 240 10% 3.9%;

    /* Minimalist Black/Zinc for Professional Look */
    --primary: 240 5.9% 10%;
    --primary-foreground: 0 0% 98%;

    --secondary: 240 4.8% 95.9%;
    --secondary-foreground: 240 5.9% 10%;

    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;

    --accent: 240 4.8% 95.9%;
    --accent-foreground: 240 5.9% 10%;

    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;

    --border: 240 5.9% 90%;
    --input: 240 5.9% 90%;
    --ring: 240 5.9% 10%;

    --radius: 0.5rem;
  }

  .dark {
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;

    --card: 240 10% 3.9%;
    --card-foreground: 0 0% 98%;

    --popover: 240 10% 3.9%;
    --popover-foreground: 0 0% 98%;

    --primary: 0 0% 98%;
    --primary-foreground: 240 5.9% 10%;

    --secondary: 240 3.7% 15.9%;
    --secondary-foreground: 0 0% 98%;

    --muted: 240 3.7% 15.9%;
    --muted-foreground: 240 5% 64.9%;

    --accent: 240 3.7% 15.9%;
    --accent-foreground: 0 0% 98%;

    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;

    --border: 240 5% 38%;
    --input: 240 5% 38%;
    --ring: 240 4.9% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground bg-slate-50 dark:bg-background;
  }
}

/* ===== PWA / Standalone Mode Styles ===== */

/* Safe area insets for notched devices (iPhone X+) */
@supports (padding: env(safe-area-inset-top)) {
  .standalone-safe-top {
    padding-top: env(safe-area-inset-top);
  }
  .standalone-safe-bottom {
    padding-bottom: env(safe-area-inset-bottom);
  }
  
  @media all and (display-mode: standalone) {
    body {
      padding-top: env(safe-area-inset-top);
      padding-bottom: env(safe-area-inset-bottom);
      padding-left: env(safe-area-inset-left);
      padding-right: env(safe-area-inset-right);
    }
  }
}

/* Prevent overscroll bounce in standalone mode (native app feel) */
@media all and (display-mode: standalone) {
  html {
    overscroll-behavior: none;
  }
  
  body {
    -webkit-overflow-scrolling: touch;
  }
}

/* Disable text selection on UI chrome elements (not content) */
@media all and (display-mode: standalone) {
  nav,
  header,
  aside,
  .mobile-nav-bar {
    -webkit-user-select: none;
    user-select: none;
  }
}

/* Slide-up animation for install banner */
.animate-slide-up {
  animation: slide-up 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

/* Offline banner styling */
.offline-banner {
  @apply fixed top-0 left-0 right-0 z-[200] bg-amber-500 text-white text-center text-xs font-medium py-1.5 px-4;
}

@media all and (display-mode: standalone) {
  .offline-banner {
    padding-top: calc(env(safe-area-inset-top, 0px) + 6px);
  }
}

/* ===== Print Styles for Invoice ===== */
@media print {
  /* Hide everything except the invoice */
  body {
    background: white !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  /* Reset page margins for tight fit */
  @page {
    margin: 8mm;
    size: A4;
  }

  /* Hide navigation, sidebar, header, action buttons */
  nav,
  aside,
  header,
  [class*="print:hidden"] {
    display: none !important;
  }

  /* Ensure the invoice container is full-width */
  .max-w-4xl {
    max-width: 100% !important;
  }

  /* Remove shadows and rounded corners for clean print */
  .shadow-sm,
  .rounded-xl {
    box-shadow: none !important;
    border-radius: 0 !important;
  }
}
```

---
