import { z } from 'zod';

export const bundleSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(200),
  hsn_code: z.string().max(50, 'HSN code max 50 chars').default(''),
  default_price: z.coerce
    .number()
    .min(0, 'Price must be positive')
    .multipleOf(0.01, 'Max 2 decimal places'),
  is_active: z.boolean().default(true),
});

export type BundleSchemaType = z.infer<typeof bundleSchema>;
