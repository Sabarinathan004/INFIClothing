-- Migration: Add Transport Details to Invoices
-- Date: 2026-06-24

ALTER TABLE invoices
ADD COLUMN transport_mode text,
ADD COLUMN shipping_address text,
ADD COLUMN no_of_bundles integer;
