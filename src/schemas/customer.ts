import { z } from 'zod';

export const customerSchema = z.object({
  name: z.string().min(1, 'Customer name is required').max(200),
  mobile: z.string().max(15).default(''),
  email: z.string().email('Invalid email').or(z.literal('')).default(''),
  gst_number: z
    .string()
    .regex(/^$|^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GST format')
    .default(''),
  address: z.string().max(500).default(''),
});

export type CustomerSchemaType = z.infer<typeof customerSchema>;
