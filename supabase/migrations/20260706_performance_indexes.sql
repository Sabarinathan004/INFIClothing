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
