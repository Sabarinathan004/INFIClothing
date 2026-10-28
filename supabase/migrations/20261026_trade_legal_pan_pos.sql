-- Migration: Add trade_name, legal_name, pan_number, and place_of_supply
-- Date: 2026-10-26

-- ============================================================
-- 1. CUSTOMERS TABLE
-- ============================================================
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS trade_name TEXT,
  ADD COLUMN IF NOT EXISTS legal_name TEXT,
  ADD COLUMN IF NOT EXISTS pan_number VARCHAR(20),
  ADD COLUMN IF NOT EXISTS place_of_supply VARCHAR(50);

-- Backfill customers trade_name and legal_name
UPDATE customers
SET trade_name = name
WHERE trade_name IS NULL AND name IS NOT NULL;

UPDATE customers
SET legal_name = name
WHERE legal_name IS NULL AND name IS NOT NULL;

-- Backfill customers pan_number from 15-char GSTIN
UPDATE customers
SET pan_number = SUBSTRING(verification_number FROM 3 FOR 10)
WHERE pan_number IS NULL AND verification_type = 'GST' AND LENGTH(verification_number) = 15;

-- ============================================================
-- 2. INVOICES TABLE
-- ============================================================
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS trade_name TEXT,
  ADD COLUMN IF NOT EXISTS legal_name TEXT,
  ADD COLUMN IF NOT EXISTS pan_number VARCHAR(20),
  ADD COLUMN IF NOT EXISTS place_of_supply VARCHAR(50);

-- Backfill invoices trade_name and legal_name
UPDATE invoices
SET trade_name = customer_name
WHERE trade_name IS NULL AND customer_name IS NOT NULL;

UPDATE invoices
SET legal_name = customer_name
WHERE legal_name IS NULL AND customer_name IS NOT NULL;

-- Backfill invoices pan_number from 15-char GSTIN
UPDATE invoices
SET pan_number = SUBSTRING(verification_number FROM 3 FOR 10)
WHERE pan_number IS NULL AND verification_type = 'GST' AND LENGTH(verification_number) = 15;
