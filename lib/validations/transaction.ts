import { z } from "zod";

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
  category: z
    .string()
    .trim()
    .min(2, "La categoria deve avere almeno 2 caratteri.")
    .max(50, "La categoria deve avere massimo 50 caratteri."),
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
});

export type TransactionSchemaInput = z.infer<typeof transactionSchema>;
