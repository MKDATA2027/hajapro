import { z } from "zod";

export const businessTypeSchema = z.enum(["tailor", "trading"]);

export const businessSetupSchema = z.object({
  name: z.string().trim().min(2, "Enter at least 2 characters").max(100),
  type: businessTypeSchema,
});

export type BusinessType = z.infer<typeof businessTypeSchema>;
