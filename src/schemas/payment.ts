import { z } from "zod";

export const paymentSchema = z.object({
  invoice_id: z.string().uuid("Invalid invoice ID"),
  amount: z.number().positive("Amount must be greater than 0"),
  payment_date: z.string(),
  payment_method: z.string().min(1, "Payment method is required"),
  reference_number: z.string().optional(),
  notes: z.string().optional(),
});

export type PaymentSchemaType = z.infer<typeof paymentSchema>;
