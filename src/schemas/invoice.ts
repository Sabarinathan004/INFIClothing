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
