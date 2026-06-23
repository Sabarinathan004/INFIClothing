import { z } from 'zod';

const invoiceItemSchema = z.object({
  bundle_name: z.string().min(1, 'Bundle name is required'),
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
  customer_gst: z.string().default(''),
  customer_address: z.string().default(''),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
  gst_rate: z.coerce.number().min(0).max(100).default(0),
  notes: z.string().default(''),
  status: z.enum(['draft', 'unpaid', 'partial', 'paid', 'cancelled']).default('unpaid'),
});

export type InvoiceSchemaType = z.infer<typeof invoiceSchema>;

export const paymentSchema = z.object({
  amount: z.coerce.number().min(0.01, 'Amount must be positive'),
  payment_date: z.string().min(1, 'Date is required'),
  payment_mode: z.enum(['cash', 'upi', 'bank_transfer', 'cheque', 'other']).default('cash'),
  notes: z.string().default(''),
});

export type PaymentSchemaType = z.infer<typeof paymentSchema>;
