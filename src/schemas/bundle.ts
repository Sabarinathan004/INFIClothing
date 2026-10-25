import { z } from 'zod';

export const bundleSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(200),
  hsn_code: z.string().max(50, 'HSN code max 50 chars').default(''),
  unit: z.string().default('BDL'),
  default_price: z.coerce
    .number()
    .min(0, 'Price must be positive')
    .multipleOf(0.01, 'Max 2 decimal places'),
  mrp: z.coerce.number().min(0).default(0),
  gst_rate: z.coerce.number().min(0).max(28).default(5),
  current_stock: z.coerce.number().default(0),
  low_stock_alert: z.coerce.number().default(10),
  is_active: z.boolean().default(true),
});

export type BundleSchemaType = z.infer<typeof bundleSchema>;
