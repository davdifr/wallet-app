import { z } from "zod";

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
    category: z
      .string()
      .trim()
      .min(2, "La categoria deve avere almeno 2 caratteri.")
      .max(50, "La categoria deve avere massimo 50 caratteri."),
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
  );

export type RecurringIncomeSchemaInput = z.infer<typeof recurringIncomeSchema>;
