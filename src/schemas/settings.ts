import { z } from 'zod';

export const settingsSchema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  address: z.string().default(''),
  phone: z.string().default(''),
  email: z.string().email('Invalid email').or(z.literal('')).default(''),
  gst_number: z.string().default(''),
  pan_number: z.string().default(''),
  bank_name: z.string().default(''),
  bank_account: z.string().default(''),
  bank_ifsc: z.string().default(''),
  bank_branch: z.string().default(''),
  default_gst_rate: z.coerce.number().min(0).max(100).default(5),
  invoice_prefix: z.string().min(1).max(10).default('INV'),
  invoice_notes: z.string().default(''),
});

export type SettingsSchemaType = z.infer<typeof settingsSchema>;
