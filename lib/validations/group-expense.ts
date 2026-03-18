import { z } from "zod";

export const groupIdSchema = z.string().uuid("Gruppo non valido.");
export const groupMemberIdSchema = z.string().uuid("Membro non valido.");

export const createGroupSchema = z.object({
  name: z.string().trim().min(2, "Il nome gruppo deve avere almeno 2 caratteri.").max(80),
  description: z.string().trim().max(180).default("")
});

export const addGroupMemberSchema = z.object({
  groupId: groupIdSchema,
  email: z.string().trim().email("Inserisci un'email valida.").or(z.literal("")),
  displayName: z.string().trim().max(80),
  guestEmail: z.string().trim().email("Email non valida.").or(z.literal("")),
  memberType: z.enum(["app_user", "guest"])
}).superRefine((value, ctx) => {
  if (value.memberType === "app_user" && !value.email) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Seleziona un utente via email.",
      path: ["email"]
    });
  }

  if (value.memberType === "guest" && value.displayName.trim().length < 2) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Inserisci un nome valido per l'ospite.",
      path: ["displayName"]
    });
  }
});

export const createSharedExpenseSchema = z.object({
  groupId: groupIdSchema,
  title: z.string().trim().min(2, "Il titolo deve avere almeno 2 caratteri.").max(120),
  description: z.string().trim().max(200).default(""),
  amount: z
    .string()
    .trim()
    .min(1, "Inserisci un importo.")
    .refine((value) => !Number.isNaN(Number(value)), "Importo non valido.")
    .refine((value) => Number(value) > 0, "L'importo deve essere maggiore di zero."),
  expenseDate: z.string().trim().min(1, "Seleziona una data."),
  splitMethod: z.enum(["equal", "custom"]),
  paidByMemberId: z.string().uuid("Seleziona chi ha pagato."),
  splitValues: z.string().trim().min(2, "Configura almeno una quota.")
});

export const settleSplitSchema = z.object({
  groupId: groupIdSchema,
  expenseId: z.string().uuid("Spesa non valida."),
  splitId: z.string().uuid("Quota non valida."),
  payerMemberId: z.string().uuid("Pagatore non valido."),
  payeeMemberId: z.string().uuid("Beneficiario non valido."),
  amount: z
    .string()
    .trim()
    .min(1, "Inserisci un importo.")
    .refine((value) => !Number.isNaN(Number(value)), "Importo non valido.")
    .refine((value) => Number(value) > 0, "L'importo deve essere maggiore di zero."),
  note: z.string().trim().max(180).default("")
});
