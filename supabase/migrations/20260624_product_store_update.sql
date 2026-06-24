-- Add HSN Code to bundles and invoice_items tables

-- Add hsn_code to bundles
ALTER TABLE public.bundles 
ADD COLUMN hsn_code VARCHAR(50);

-- Add hsn_code to invoice_items
ALTER TABLE public.invoice_items 
ADD COLUMN hsn_code VARCHAR(50);
