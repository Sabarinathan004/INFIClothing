import { z } from 'zod';

export const settingsSchema = z.object({
  company_name: z.string().default(''),
  company_address: z.string().default(''),
  gst_number: z.string().default(''),
  phone_number: z.string().default(''),
  email: z.string().default(''),
  upi_id: z.string().default(''),
  default_gst_rate: z.coerce.number().min(0).max(100).default(5),
  payment_method: z.string().default('both'),
  bank_account_number: z.string().default(''),
  bank_ifsc_code: z.string().default(''),
  bank_name: z.string().default(''),
  bank_account_holder: z.string().default(''),
  cash_instructions: z.string().default(''),
});

export type SettingsSchemaType = z.infer<typeof settingsSchema>;
