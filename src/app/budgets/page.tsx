import { prisma } from "@/lib/prisma";
import { BudgetForm } from "@/components/budget-form";
import { MonthPicker } from "@/components/month-picker";
import {
  currentMonth,
  formatMonthLong,
  isValidMonth,
  lastMonths,
  previousMonth,
} from "@/lib/months";

type SearchParams = { month?: string };

export default async function BudgetsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const month = sp.month && isValidMonth(sp.month) ? sp.month : currentMonth();
  const prev = previousMonth(month) ?? month;
  const months = lastMonths(12, month);

  const [categories, budgets] = await Promise.all([
    prisma.category.findMany({
      orderBy: [{ parentName: "asc" }, { name: "asc" }],
    }),
    prisma.budget.findMany({ where: { month } }),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="text-2xl font-semibold">Budgets</h1>
        <div className="w-44 shrink-0">
          <MonthPicker months={months} value={month} basePath="/budgets" />
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Définis un montant mensuel par catégorie pour <strong>{formatMonthLong(month)}</strong>. Les
        valeurs vides ou à 0 ne sont pas enregistrées.
      </p>

      <BudgetForm
        month={month}
        previousMonth={prev}
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          parentName: c.parentName,
        }))}
        existing={budgets.map((b) => ({
          categoryId: b.categoryId,
          amount: Number(b.amount),
        }))}
      />
    </div>
  );
}
