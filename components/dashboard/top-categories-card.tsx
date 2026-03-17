import { DashboardShellCard } from "@/components/dashboard/dashboard-shell-card";

type CategoryItem = {
  name: string;
  amount: string;
  value: number;
  colorClassName: string;
};

type TopCategoriesCardProps = {
  categories: CategoryItem[];
};

export function TopCategoriesCard({ categories }: TopCategoriesCardProps) {
  if (categories.length === 0) {
    return (
      <DashboardShellCard
        title="Top Categorie Spesa"
        subtitle="Dove stai spendendo di piu questo mese"
        contentClassName="rounded-3xl border border-dashed border-slate-300 bg-slate-50/80 px-6 py-10 text-center text-sm text-slate-500"
      >
        Nessuna spesa registrata nel mese corrente.
      </DashboardShellCard>
    );
  }

  const max = Math.max(...categories.map((item) => item.value), 1);

  return (
    <DashboardShellCard
      title="Top Categorie Spesa"
      subtitle="Dove stai spendendo di piu questo mese"
      contentClassName="space-y-4"
    >
      {categories.map((category) => (
        <div key={category.name} className="space-y-2">
          <div className="flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-3">
              <span className={`h-3 w-3 rounded-full ${category.colorClassName}`} />
              <span className="font-medium text-slate-800">{category.name}</span>
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
      ))}
    </DashboardShellCard>
  );
}
