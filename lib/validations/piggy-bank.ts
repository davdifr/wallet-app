import { z } from "zod";

export const piggyBankMovementTypes = ["manual_add", "manual_release"] as const;

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`));
}

export const piggyBankSettingsSchema = z.object({
  autoMonthlyAmount: z
    .string()
    .trim()
    .min(1, "Inserisci un importo mensile.")
    .refine((value) => !Number.isNaN(Number(value)), "Importo non valido.")
    .refine((value) => Number(value) >= 0, "L'importo non puo essere negativo."),
  isAutoEnabled: z.boolean(),
  startsOnMonth: z
    .string()
    .trim()
    .min(1, "Seleziona il mese di partenza.")
    .refine((value) => isIsoDate(value), "Mese di partenza non valido.")
    .refine(
      (value) => value.endsWith("-01"),
      "Il piano mensile deve partire dal primo giorno del mese."
    )
});

export const piggyBankMovementSchema = z.object({
  amount: z
    .string()
    .trim()
    .min(1, "Inserisci un importo.")
    .refine((value) => !Number.isNaN(Number(value)), "Importo non valido.")
    .refine((value) => Number(value) > 0, "L'importo deve essere maggiore di zero."),
  movementType: z.enum(piggyBankMovementTypes, {
    errorMap: () => ({ message: "Seleziona un movimento valido." })
  }),
  note: z
    .string()
    .trim()
    .max(180, "La nota deve avere massimo 180 caratteri.")
    .default("")
});
