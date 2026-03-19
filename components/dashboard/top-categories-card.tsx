import { DashboardShellCard } from "@/components/dashboard/dashboard-shell-card";
import { getCategoryIcon } from "@/lib/categories/catalog";
import type { DashboardTopCategory } from "@/types/dashboard";

type TopCategoriesCardProps = {
  categories: DashboardTopCategory[];
};

export function TopCategoriesCard({ categories }: TopCategoriesCardProps) {
  if (categories.length === 0) {
    return (
      <DashboardShellCard
        title="Dove Stai Spendendo"
        subtitle="Le categorie che consumano piu velocemente il margine mensile"
        contentClassName="rounded-3xl border border-dashed border-slate-300 bg-slate-50/80 px-6 py-10 text-center text-sm text-slate-500"
      >
        Nessuna spesa registrata nel mese corrente.
      </DashboardShellCard>
    );
  }

  const max = Math.max(...categories.map((item) => item.value), 1);

  return (
    <DashboardShellCard
      title="Dove Stai Spendendo"
      subtitle="Le categorie che consumano piu velocemente il margine mensile"
      contentClassName="space-y-4"
    >
      {categories.map((category) => {
        const Icon = getCategoryIcon(category.categorySlug, "expense");

        return (
          <div key={category.name} className="space-y-2">
            <div className="flex items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-2xl ${category.colorClassName} text-white`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-800">{category.name}</span>
                  {category.isLegacyFallback ? (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                      storico
                    </span>
                  ) : null}
                </div>
              </div>
              <span className="font-semibold text-slate-950">{category.amount}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
              <div
                className={`h-full rounded-full ${category.colorClassName}`}
                style={{ width: `${Math.max((category.value / max) * 100, 10)}%` }}
              />
            </div>
          </div>
        );
      })}
    </DashboardShellCard>
  );
}
