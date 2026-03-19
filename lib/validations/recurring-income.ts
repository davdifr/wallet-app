import { z } from "zod";

import {
  getCategoryLabel,
  incomeCategorySlugs,
  isValidCategorySlug
} from "@/lib/categories/catalog";

export const recurringIncomeFrequencies = ["weekly", "monthly", "yearly"] as const;
export const recurringIncomeIdSchema = z.string().uuid("Entrata ricorrente non valida.");

export const recurringIncomeSchema = z
  .object({
    amount: z
      .string()
      .trim()
      .min(1, "Inserisci un importo.")
      .refine((value) => !Number.isNaN(Number(value)), "Importo non valido.")
      .refine((value) => Number(value) > 0, "L'importo deve essere maggiore di zero."),
    categorySlug: z.enum(incomeCategorySlugs, {
      errorMap: () => ({ message: "Seleziona una categoria supportata." })
    }),
    category: z
      .string()
      .trim()
      .max(50, "La categoria deve avere massimo 50 caratteri.")
      .optional(),
    description: z
      .string()
      .trim()
      .min(2, "La descrizione deve avere almeno 2 caratteri.")
      .max(120, "La descrizione deve avere massimo 120 caratteri."),
    source: z
      .string()
      .trim()
      .min(2, "La fonte deve avere almeno 2 caratteri.")
      .max(80, "La fonte deve avere massimo 80 caratteri."),
    frequency: z.enum(recurringIncomeFrequencies, {
      errorMap: () => ({ message: "Seleziona una frequenza valida." })
    }),
    startsOn: z.string().trim().min(1, "Seleziona una data di inizio."),
    endsOn: z.string().trim().optional().default("")
  })
  .refine(
    (value) => !value.endsOn || value.endsOn >= value.startsOn,
    {
      message: "La data di fine deve essere successiva o uguale alla data di inizio.",
      path: ["endsOn"]
    }
  )
  .superRefine((value, ctx) => {
    if (!isValidCategorySlug(value.categorySlug, "income")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["categorySlug"],
        message: "Seleziona una categoria di entrata supportata."
      });
    }
  })
  .transform((value) => ({
    ...value,
    category: getCategoryLabel(value.categorySlug, "income")
  }));

export type RecurringIncomeSchemaInput = z.infer<typeof recurringIncomeSchema>;
