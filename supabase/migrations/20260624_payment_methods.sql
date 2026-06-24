-- Migration: Add Payment Method fields to company_settings
-- Date: 2026-06-24

ALTER TABLE company_settings
ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'upi',
ADD COLUMN IF NOT EXISTS bank_account_number text,
ADD COLUMN IF NOT EXISTS bank_ifsc_code text,
ADD COLUMN IF NOT EXISTS bank_name text,
ADD COLUMN IF NOT EXISTS bank_account_holder text,
ADD COLUMN IF NOT EXISTS cash_instructions text;
