import { z } from "zod";

export const goalPriorities = ["low", "medium", "high"] as const;
export const savingGoalIdSchema = z.string().uuid("Goal non valido.");

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`));
}

export const savingGoalSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Il titolo deve avere almeno 2 caratteri.")
    .max(100, "Il titolo deve avere massimo 100 caratteri."),
  description: z
    .string()
    .trim()
    .max(240, "La descrizione deve avere massimo 240 caratteri.")
    .default(""),
  targetAmount: z
    .string()
    .trim()
    .min(1, "Inserisci un target.")
    .refine((value) => !Number.isNaN(Number(value)), "Target non valido.")
    .refine((value) => Number(value) > 0, "Il target deve essere maggiore di zero."),
  targetDate: z
    .string()
    .trim()
    .refine((value) => value === "" || isIsoDate(value), "Data desiderata non valida."),
  priority: z.enum(goalPriorities, {
    errorMap: () => ({ message: "Seleziona una priorita valida." })
  })
});

export const goalContributionSchema = z.object({
  goalId: z.string().uuid("Goal non valido."),
  amount: z
    .string()
    .trim()
    .min(1, "Inserisci un importo.")
    .refine((value) => !Number.isNaN(Number(value)), "Importo non valido.")
    .refine((value) => Number(value) > 0, "L'importo deve essere maggiore di zero."),
  note: z
    .string()
    .trim()
    .max(180, "La nota deve avere massimo 180 caratteri.")
    .default("")
});
