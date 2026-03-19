import { z } from "zod";

import { categorySlugs } from "@/lib/categories/catalog";
import {
  getCategoryLabel,
  isValidCategorySlug
} from "@/lib/categories/catalog";

export const transactionTypes = ["expense", "income"] as const;

export const transactionSchema = z.object({
  id: z.string().uuid().optional(),
  amount: z
    .string()
    .trim()
    .min(1, "Inserisci un importo.")
    .refine((value) => !Number.isNaN(Number(value)), "Importo non valido.")
    .refine((value) => Number(value) > 0, "L'importo deve essere maggiore di zero."),
  date: z.string().trim().min(1, "Seleziona una data."),
  categorySlug: z.enum(categorySlugs, {
    errorMap: () => ({ message: "Seleziona una categoria supportata." })
  }),
  category: z.string().trim().max(50, "La categoria deve avere massimo 50 caratteri.").optional(),
  note: z
    .string()
    .trim()
    .max(240, "La nota deve avere massimo 240 caratteri.")
    .default(""),
  source: z
    .string()
    .trim()
    .min(2, "La fonte deve avere almeno 2 caratteri.")
    .max(80, "La fonte deve avere massimo 80 caratteri."),
  type: z.enum(transactionTypes, {
    errorMap: () => ({ message: "Seleziona un tipo valido." })
  })
}).superRefine((value, ctx) => {
  if (!isValidCategorySlug(value.categorySlug, value.type)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["categorySlug"],
      message: "Seleziona una categoria supportata."
    });
  }
}).transform((value) => ({
  ...value,
  category: getCategoryLabel(value.categorySlug, value.type)
}));

export type TransactionSchemaInput = z.infer<typeof transactionSchema>;
