-- Migration: Swipe Parity & Single-Handed Billing Upgrade
-- Date: 2026-10-19

-- ============================================================
-- 1. BUNDLES TABLE UPGRADE
--    Add units, mrp, stock tracking, and per-item GST rates
-- ============================================================
ALTER TABLE bundles
  ADD COLUMN IF NOT EXISTS unit VARCHAR(20) DEFAULT 'BDL',
  ADD COLUMN IF NOT EXISTS mrp DECIMAL(10,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS gst_rate DECIMAL(5,2) DEFAULT 5.00,
  ADD COLUMN IF NOT EXISTS current_stock INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS low_stock_alert INTEGER DEFAULT 10;

-- ============================================================
-- 2. INVOICES TABLE UPGRADE
--    Add document type, tax inclusive flag, discounts, round-off,
--    vehicle number, and e-way bill number
-- ============================================================
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS doc_type VARCHAR(20) DEFAULT 'invoice',
  ADD COLUMN IF NOT EXISTS is_tax_inclusive BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS total_discount DECIMAL(12,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS extra_discount DECIMAL(12,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS round_off DECIMAL(10,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS vehicle_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS eway_bill_number VARCHAR(50);

-- ============================================================
-- 3. INVOICE_ITEMS TABLE UPGRADE
--    Add item units, line-item discounts, taxable amounts, and GST
-- ============================================================
ALTER TABLE invoice_items
  ADD COLUMN IF NOT EXISTS unit VARCHAR(20) DEFAULT 'BDL',
  ADD COLUMN IF NOT EXISTS discount_percent DECIMAL(5,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(12,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS taxable_amount DECIMAL(12,2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS gst_rate DECIMAL(5,2) DEFAULT 5.00,
  ADD COLUMN IF NOT EXISTS gst_amount DECIMAL(12,2) DEFAULT 0.00;

-- ============================================================
-- 4. SEQUENCES & MULTI-DOC NUMBER GENERATION
--    Support Quotations (QUO) and Delivery Challans (DC)
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS quotation_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS challan_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_invoice_number(prefix text DEFAULT 'INV')
RETURNS text AS $$
DECLARE
    next_val int;
    year text;
BEGIN
    year := to_char(CURRENT_DATE, 'YY');
    
    IF upper(prefix) = 'QUO' THEN
        SELECT nextval('quotation_number_seq') INTO next_val;
    ELSIF upper(prefix) = 'DC' THEN
        SELECT nextval('challan_number_seq') INTO next_val;
    ELSE
        SELECT nextval('invoice_number_seq') INTO next_val;
    END IF;
    
    RETURN upper(prefix) || '-' || year || '-' || lpad(next_val::text, 4, '0');
END;
$$ LANGUAGE plpgsql;
