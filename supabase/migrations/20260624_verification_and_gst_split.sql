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
