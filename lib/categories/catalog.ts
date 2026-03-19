import type { LucideIcon } from "lucide-react";
import {
  BanknoteArrowUp,
  BriefcaseBusiness,
  Building2,
  CircleDollarSign,
  Gift,
  GraduationCap,
  HandCoins,
  HeartPulse,
  Home,
  Landmark,
  MoreHorizontal,
  Plane,
  Popcorn,
  ReceiptText,
  Repeat,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  TrainFront,
  UtensilsCrossed
} from "lucide-react";

export const categoryScopes = ["expense", "income", "both"] as const;

export type CategoryScope = (typeof categoryScopes)[number];

export type CategoryDefinition<TSlug extends string = string> = {
  slug: TSlug;
  label: string;
  icon: LucideIcon;
  scope: CategoryScope;
  isFallback?: boolean;
  legacyAliases?: readonly string[];
};

export type ResolvedCategoryCompatibility<TSlug extends string = string> = {
  slug: TSlug;
  displayLabel: string;
  canonicalLabel: string;
  originalLabel: string | null;
  isLegacyFallback: boolean;
  wasMatched: boolean;
};

const EXPENSE_CATEGORIES = [
  {
    slug: "groceries",
    label: "Spesa alimentare",
    icon: ShoppingCart,
    scope: "expense",
    legacyAliases: [
      "spesa",
      "alimentari",
      "supermercato",
      "groceries",
      "spesa alimentare",
      "spesa alimentari"
    ]
  },
  {
    slug: "dining",
    label: "Mangiare fuori",
    icon: UtensilsCrossed,
    scope: "expense",
    legacyAliases: [
      "ristorante",
      "cena",
      "pranzo",
      "bar",
      "mangiare fuori",
      "food",
      "aperitivo"
    ]
  },
  {
    slug: "transport",
    label: "Trasporti",
    icon: TrainFront,
    scope: "expense",
    legacyAliases: [
      "trasporti",
      "benzina",
      "taxi",
      "mezzi",
      "carburante",
      "treno",
      "metro",
      "auto"
    ]
  },
  {
    slug: "housing",
    label: "Casa",
    icon: Home,
    scope: "expense",
    legacyAliases: ["casa", "affitto", "mutuo", "rent", "home"]
  },
  {
    slug: "utilities",
    label: "Bollette",
    icon: ReceiptText,
    scope: "expense",
    legacyAliases: ["bollette", "utenze", "luce", "gas", "internet"]
  },
  {
    slug: "health",
    label: "Salute",
    icon: HeartPulse,
    scope: "expense",
    legacyAliases: ["salute", "farmacia", "medico"]
  },
  {
    slug: "shopping",
    label: "Shopping",
    icon: ShoppingBag,
    scope: "expense",
    legacyAliases: ["shopping", "acquisti", "abbigliamento", "vestiti", "amazon"]
  },
  {
    slug: "entertainment",
    label: "Svago",
    icon: Popcorn,
    scope: "expense",
    legacyAliases: ["svago", "entertainment", "cinema", "hobby"]
  },
  {
    slug: "travel",
    label: "Viaggi",
    icon: Plane,
    scope: "expense",
    legacyAliases: ["viaggi", "vacanze", "travel"]
  },
  {
    slug: "subscriptions",
    label: "Abbonamenti",
    icon: Repeat,
    scope: "expense",
    legacyAliases: ["abbonamenti", "subscription", "streaming", "netflix", "spotify"]
  },
  {
    slug: "education",
    label: "Formazione",
    icon: GraduationCap,
    scope: "expense",
    legacyAliases: ["formazione", "corso", "education", "libri"]
  },
  {
    slug: "family",
    label: "Famiglia",
    icon: Sparkles,
    scope: "expense",
    legacyAliases: ["famiglia", "bambini"]
  },
  {
    slug: "taxes",
    label: "Tasse",
    icon: Landmark,
    scope: "expense",
    legacyAliases: ["tasse", "imposte", "f24", "agenzia entrate"]
  },
  {
    slug: "personal-care",
    label: "Cura personale",
    icon: Sparkles,
    scope: "expense",
    legacyAliases: ["cura personale", "beauty", "benessere"]
  },
  {
    slug: "gifts",
    label: "Regali",
    icon: Gift,
    scope: "expense",
    legacyAliases: ["regali", "gift"]
  },
  {
    slug: "other-expense",
    label: "Altro",
    icon: MoreHorizontal,
    scope: "expense",
    isFallback: true,
    legacyAliases: ["altro", "uncategorized", "uncategorised"]
  }
] as const satisfies readonly CategoryDefinition[];

const INCOME_CATEGORIES = [
  {
    slug: "salary",
    label: "Stipendio",
    icon: BriefcaseBusiness,
    scope: "income",
    legacyAliases: ["stipendio", "salary", "busta paga"]
  },
  {
    slug: "freelance",
    label: "Freelance",
    icon: BriefcaseBusiness,
    scope: "income",
    legacyAliases: ["freelance", "consulenza"]
  },
  {
    slug: "business",
    label: "Attivita",
    icon: Building2,
    scope: "income",
    legacyAliases: ["attivita", "business", "azienda"]
  },
  {
    slug: "bonus",
    label: "Bonus",
    icon: Sparkles,
    scope: "income",
    legacyAliases: ["bonus", "premio", "premio produzione"]
  },
  {
    slug: "refund",
    label: "Rimborso",
    icon: HandCoins,
    scope: "income",
    legacyAliases: ["rimborso", "refund", "restituzione"]
  },
  {
    slug: "investments",
    label: "Investimenti",
    icon: Landmark,
    scope: "income",
    legacyAliases: ["investimenti", "investment", "dividendi", "cedola"]
  },
  {
    slug: "rental",
    label: "Affitti",
    icon: Home,
    scope: "income",
    legacyAliases: ["affitti", "rent", "locazione", "affitto attivo"]
  },
  {
    slug: "gift-income",
    label: "Regalo ricevuto",
    icon: Gift,
    scope: "income",
    legacyAliases: ["regalo ricevuto", "gift income", "regalo"]
  },
  {
    slug: "pension",
    label: "Pensione",
    icon: BanknoteArrowUp,
    scope: "income",
    legacyAliases: ["pensione", "pension"]
  },
  {
    slug: "other-income",
    label: "Altro",
    icon: CircleDollarSign,
    scope: "income",
    isFallback: true,
    legacyAliases: ["altro", "income", "other"]
  }
] as const satisfies readonly CategoryDefinition[];

export const CATEGORY_CATALOG = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES] as const;

export type ExpenseCategorySlug = (typeof EXPENSE_CATEGORIES)[number]["slug"];
export type IncomeCategorySlug = (typeof INCOME_CATEGORIES)[number]["slug"];
export type CategorySlug = (typeof CATEGORY_CATALOG)[number]["slug"];

export const expenseCategorySlugs = EXPENSE_CATEGORIES.map((category) => category.slug) as [
  ExpenseCategorySlug,
  ...ExpenseCategorySlug[]
];

export const incomeCategorySlugs = INCOME_CATEGORIES.map((category) => category.slug) as [
  IncomeCategorySlug,
  ...IncomeCategorySlug[]
];

export const categorySlugs = CATEGORY_CATALOG.map((category) => category.slug) as [
  CategorySlug,
  ...CategorySlug[]
];

const categoryCatalogList: readonly CategoryDefinition<CategorySlug>[] = CATEGORY_CATALOG;
const expenseCategoryCatalog: readonly CategoryDefinition<ExpenseCategorySlug>[] =
  EXPENSE_CATEGORIES;
const incomeCategoryCatalog: readonly CategoryDefinition<IncomeCategorySlug>[] =
  INCOME_CATEGORIES;

const categoryBySlug = new Map<CategorySlug, CategoryDefinition<CategorySlug>>(
  categoryCatalogList.map((category) => [category.slug as CategorySlug, category])
);

const fallbackByScope: Record<
  Exclude<CategoryScope, "both">,
  CategoryDefinition<CategorySlug>
> = {
  expense: categoryCatalogList.find(
    (category) => category.scope === "expense" && category.isFallback
  )!,
  income: categoryCatalogList.find(
    (category) => category.scope === "income" && category.isFallback
  )!
};

function sanitizeCategoryValue(value: string | null | undefined) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim().replace(/\s+/g, " ");
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeLegacyCategory(value: string) {
  return sanitizeCategoryValue(value)?.toLowerCase() ?? "";
}

export function getCategoriesForScope(scope: Exclude<CategoryScope, "both">) {
  return categoryCatalogList.filter(
    (category) => category.scope === scope || category.scope === "both"
  );
}

export function getExpenseCategories() {
  return expenseCategoryCatalog;
}

export function getIncomeCategories() {
  return incomeCategoryCatalog;
}

export function getFallbackCategory(scope: Exclude<CategoryScope, "both">) {
  return fallbackByScope[scope];
}

export function getExpenseFallbackCategory() {
  return fallbackByScope.expense as CategoryDefinition<ExpenseCategorySlug>;
}

export function getIncomeFallbackCategory() {
  return fallbackByScope.income as CategoryDefinition<IncomeCategorySlug>;
}

export function getCategoryDefinition(
  slug: string | null | undefined
): CategoryDefinition<CategorySlug> | null {
  if (!slug) {
    return null;
  }

  return categoryBySlug.get(slug as CategorySlug) ?? null;
}

export function getExpenseCategoryDefinition(
  slug: string | null | undefined
): CategoryDefinition<ExpenseCategorySlug> | null {
  const category = getCategoryDefinition(slug);

  if (!category || (category.scope !== "expense" && category.scope !== "both")) {
    return null;
  }

  return category as CategoryDefinition<ExpenseCategorySlug>;
}

export function getIncomeCategoryDefinition(
  slug: string | null | undefined
): CategoryDefinition<IncomeCategorySlug> | null {
  const category = getCategoryDefinition(slug);

  if (!category || (category.scope !== "income" && category.scope !== "both")) {
    return null;
  }

  return category as CategoryDefinition<IncomeCategorySlug>;
}

export function getCategoryLabel(
  slug: string | null | undefined,
  scope?: Exclude<CategoryScope, "both">
) {
  const category = getCategoryDefinition(slug);

  if (category) {
    return category.label;
  }

  return scope ? getFallbackCategory(scope).label : "Altro";
}

export function getCategoryIcon(
  slug: string | null | undefined,
  scope?: Exclude<CategoryScope, "both">
) {
  const category = getCategoryDefinition(slug);

  if (category) {
    return category.icon;
  }

  return scope ? getFallbackCategory(scope).icon : MoreHorizontal;
}

export function isValidCategorySlug(
  slug: string | null | undefined,
  scope?: Exclude<CategoryScope, "both">
) {
  const category = getCategoryDefinition(slug);

  if (!category) {
    return false;
  }

  if (!scope) {
    return true;
  }

  return category.scope === scope || category.scope === "both";
}

export function resolveLegacyCategory(
  input: string | null | undefined,
  scope: Exclude<CategoryScope, "both">
) {
  return findCategoryByLegacyValue(input, scope) ?? getFallbackCategory(scope);
}

export function findCategoryByLegacyValue(
  input: string | null | undefined,
  scope: Exclude<CategoryScope, "both">
) {
  const sanitized = sanitizeCategoryValue(input);

  if (!sanitized) {
    return null;
  }

  const normalized = normalizeLegacyCategory(sanitized);

  return (
    getCategoriesForScope(scope).find(
      (category) =>
        category.slug === normalized ||
        normalizeLegacyCategory(category.label) === normalized ||
        category.legacyAliases?.some((alias) => normalizeLegacyCategory(alias) === normalized)
    ) ?? null
  );
}

export function resolveCategoryCompatibility(
  input: string | null | undefined,
  scope: Exclude<CategoryScope, "both">
): ResolvedCategoryCompatibility<CategorySlug> {
  const originalLabel = sanitizeCategoryValue(input);
  const matchedCategory = findCategoryByLegacyValue(originalLabel, scope);
  const resolvedCategory = matchedCategory ?? getFallbackCategory(scope);

  return {
    slug: resolvedCategory.slug,
    displayLabel: matchedCategory?.label ?? originalLabel ?? resolvedCategory.label,
    canonicalLabel: resolvedCategory.label,
    originalLabel,
    isLegacyFallback: Boolean(originalLabel && !matchedCategory),
    wasMatched: Boolean(matchedCategory)
  };
}

export function findExpenseCategoryByLegacyValue(input: string | null | undefined) {
  return findCategoryByLegacyValue(input, "expense") as CategoryDefinition<ExpenseCategorySlug> | null;
}

export function findIncomeCategoryByLegacyValue(input: string | null | undefined) {
  return findCategoryByLegacyValue(input, "income") as CategoryDefinition<IncomeCategorySlug> | null;
}

export function resolveLegacyExpenseCategory(input: string | null | undefined) {
  return resolveLegacyCategory(input, "expense") as CategoryDefinition<ExpenseCategorySlug>;
}

export function resolveLegacyIncomeCategory(input: string | null | undefined) {
  return resolveLegacyCategory(input, "income") as CategoryDefinition<IncomeCategorySlug>;
}

export function resolveExpenseCategoryCompatibility(input: string | null | undefined) {
  return resolveCategoryCompatibility(
    input,
    "expense"
  ) as ResolvedCategoryCompatibility<ExpenseCategorySlug>;
}

export function resolveIncomeCategoryCompatibility(input: string | null | undefined) {
  return resolveCategoryCompatibility(
    input,
    "income"
  ) as ResolvedCategoryCompatibility<IncomeCategorySlug>;
}

export function getCategoryOptions(scope: Exclude<CategoryScope, "both">) {
  return getCategoriesForScope(scope).map((category) => ({
    slug: category.slug,
    label: category.label,
    icon: category.icon,
    isFallback: category.isFallback ?? false
  }));
}
