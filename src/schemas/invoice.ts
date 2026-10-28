import { z } from 'zod';

const VERIFICATION_TYPES = ['GST', 'Aadhar', 'PAN'] as const;
const DOC_TYPES = ['invoice', 'quotation', 'proforma', 'challan'] as const;
const SETTLEMENT_MODES = ['credit', 'cash', 'upi', 'bank_transfer'] as const;

const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{3}$/;
const AADHAR_REGEX = /^\d{12}$/;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

const invoiceItemSchema = z.object({
  bundle_name: z.string().min(1, 'Product name is required'),
  hsn_code: z.string().default(''),
  unit: z.string().default('BDL'),
  quantity: z.coerce.number().min(0.01, 'Quantity must be positive'),
  rate: z.coerce.number().min(0, 'Rate must be positive'),
  discount_percent: z.coerce.number().min(0).max(100).default(0),
  discount_amount: z.coerce.number().min(0).default(0),
  taxable_amount: z.coerce.number().min(0).default(0),
  gst_rate: z.coerce.number().min(0).max(28).default(5),
  gst_amount: z.coerce.number().min(0).default(0),
  amount: z.coerce.number().min(0),
});

export const invoiceSchema = z.object({
  doc_type: z.enum(DOC_TYPES).default('invoice'),
  invoice_date: z.string().min(1, 'Date is required'),
  customer_id: z.string().nullable().default(null),
  customer_name: z.string().min(1, 'Customer name is required'),
  trade_name: z.string().optional().default(''),
  legal_name: z.string().optional().default(''),
  pan_number: z.string().optional().default(''),
  place_of_supply: z.string().optional().default(''),
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

  // Tax Mode & Discounts
  is_tax_inclusive: z.boolean().default(false),
  gst_rate: z.coerce.number().min(0).max(100).default(5),
  extra_discount: z.coerce.number().min(0).default(0),
  round_off: z.coerce.number().optional().default(0),
  auto_round_off: z.boolean().default(true),

  // Instant 1-Tap Settlement on Create
  settlement_mode: z.enum(SETTLEMENT_MODES).default('credit'),

  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
  notes: z.string().default(''),
  status: z.enum(['draft', 'unpaid', 'partial', 'paid', 'cancelled']).default('unpaid'),

  // Logistics & E-Way Bill
  transport_mode: z.string().optional().default(''),
  shipping_address: z.string().optional().default(''),
  no_of_bundles: z.union([z.string(), z.number()]).optional().default(''),
  vehicle_number: z.string().optional().default(''),
  eway_bill_number: z.string().optional().default(''),
}).superRefine((data, ctx) => {
  const { verification_type, verification_number } = data;
  if (!verification_number) return;

  const num = verification_number.trim().toUpperCase();

  if (verification_type === 'GST' && !GST_REGEX.test(num)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['verification_number'],
      message: 'Please enter a valid 15-digit GST Number.',
    });
  } else if (verification_type === 'Aadhar' && !AADHAR_REGEX.test(num)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['verification_number'],
      message: 'Please enter a valid 12-digit Aadhaar Number.',
    });
  } else if (verification_type === 'PAN' && !PAN_REGEX.test(num)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['verification_number'],
      message: 'Please enter a valid 10-character PAN Number.',
    });
  }
});

export type InvoiceSchemaType = z.infer<typeof invoiceSchema>;