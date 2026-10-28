import { z } from 'zod';

const VERIFICATION_TYPES = ['GST', 'Aadhar', 'PAN'] as const;

const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{3}$/;
const AADHAR_REGEX = /^\d{12}$/;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

export const customerSchema = z.object({
  name: z.string().min(1, 'Customer name is required').max(200),
  trade_name: z.string().max(200).optional().default(''),
  legal_name: z.string().max(200).optional().default(''),
  pan_number: z.string().max(20).optional().default(''),
  place_of_supply: z.string().max(50).optional().default(''),
  mobile: z.string().max(15).default(''),
  email: z.string().email('Invalid email').or(z.literal('')).default(''),
  address: z.string().max(500).default(''),

  // Verification Details (replaces gst_number)
  verification_type: z.enum(VERIFICATION_TYPES, {
    error: 'Please select a verification type.',
  }),
  verification_number: z.string().min(1, 'Verification number is required'),
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

export type CustomerSchemaType = z.infer<typeof customerSchema>;
