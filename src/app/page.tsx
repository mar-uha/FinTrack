import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryPie } from "@/components/category-pie";
import { MonthPicker } from "@/components/month-picker";
import {
  currentMonth,
  formatMonthLong,
  isValidMonth,
  lastMonths,
  previousMonth,
} from "@/lib/months";

type SearchParams = { month?: string };

const EUR = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

const EUR0 = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

function monthRange(yyyymm: string): { start: Date; end: Date } {
  const [y, m] = yyyymm.split("-").map(Number);
  return {
    start: new Date(Date.UTC(y, m - 1, 1)),
    end: new Date(Date.UTC(y, m, 1)),
  };
}

type Tx = {
  amount: { toString(): string } | number | string;
  categoryId: string | null;
  category: {
    id: string;
    name: string;
    parentName: string;
    type: "RECURRENT" | "VARIABLE";
  } | null;
};

type Aggregate = {
  totalSpent: number;     // positive number (sum of -amount where amount<0)
  totalIncome: number;    // positive number (sum of amount where amount>0)
  byCategory: Map<
    string,
    {
      id: string;
      name: string;
      parentName: string;
      type: "RECURRENT" | "VARIABLE";
      spent: number;
    }
  >;
  uncategorizedSpent: number;
  byType: { RECURRENT: number; VARIABLE: number };
};

function aggregate(transactions: Tx[]): Aggregate {
  const byCategory = new Map<string, Aggregate["byCategory"] extends Map<string, infer V> ? V : never>();
  const byType = { RECURRENT: 0, VARIABLE: 0 };
  let totalSpent = 0;
  let totalIncome = 0;
  let uncategorizedSpent = 0;

  for (const t of transactions) {
    const amount = Number(t.amount);
    if (amount > 0) {
      totalIncome += amount;
      continue;
    }
    const spent = -amount;
    totalSpent += spent;

    if (!t.category) {
      uncategorizedSpent += spent;
      continue;
    }
    const c = t.category;
    const existing = byCategory.get(c.id);
    if (existing) {
      existing.spent += spent;
    } else {
      byCategory.set(c.id, {
        id: c.id,
        name: c.name,
        parentName: c.parentName,
        type: c.type,
        spent,
      });
    }
    byType[c.type] += spent;
  }

  return { totalSpent, totalIncome, byCategory, uncategorizedSpent, byType };
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const month = sp.month && isValidMonth(sp.month) ? sp.month : currentMonth();
  const prev = previousMonth(month)!;

  const [thisMonthTx, prevMonthTx, budgets] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        dateOp: { gte: monthRange(month).start, lt: monthRange(month).end },
      },
      include: { category: true },
    }),
    prisma.transaction.findMany({
      where: {
        dateOp: { gte: monthRange(prev).start, lt: monthRange(prev).end },
      },
      include: { category: true },
    }),
    prisma.budget.findMany({
      include: { category: true },
    }),
  ]);

  const agg = aggregate(thisMonthTx);
  const prevAgg = aggregate(prevMonthTx);

  // Sum of budgets, and per-type budget totals.
  const totalBudgeted = budgets.reduce((s, b) => s + Number(b.amount), 0);
  const budgetByCat = new Map<string, number>();
  const budgetByType = { RECURRENT: 0, VARIABLE: 0 };
  for (const b of budgets) {
    budgetByCat.set(b.categoryId, Number(b.amount));
    if (b.category) budgetByType[b.category.type] += Number(b.amount);
  }

  const balance = totalBudgeted - agg.totalSpent;
  const deltaPct =
    prevAgg.totalSpent > 0
      ? ((agg.totalSpent - prevAgg.totalSpent) / prevAgg.totalSpent) * 100
      : null;

  // Build the "all categories with non-zero spent OR non-zero budget" list,
  // sorted by spent descending.
  const allCategoryIds = new Set<string>([
    ...agg.byCategory.keys(),
    ...budgetByCat.keys(),
  ]);
  const rows = [...allCategoryIds].map((id) => {
    const cat = agg.byCategory.get(id);
    const budget = budgetByCat.get(id) ?? 0;
    // For categories with a budget but no spend, look up name from budgets list.
    const b = budgets.find((x) => x.categoryId === id);
    return {
      id,
      name: cat?.name ?? b?.category?.name ?? "Inconnu",
      parentName: cat?.parentName ?? b?.category?.parentName ?? "",
      type: cat?.type ?? b?.category?.type ?? ("VARIABLE" as const),
      spent: cat?.spent ?? 0,
      budget,
    };
  });
  rows.sort((a, b) => b.spent - a.spent);

  // Pie slices: top 8 categories by spend, lump the rest into "Autres".
  const top = [...agg.byCategory.values()].sort((a, b) => b.spent - a.spent);
  const top8 = top.slice(0, 8);
  const restSpent = top.slice(8).reduce((s, c) => s + c.spent, 0);
  const slices = top8.map((c) => ({ name: c.name, value: c.spent }));
  if (restSpent > 0) slices.push({ name: "Autres", value: restSpent });
  if (agg.uncategorizedSpent > 0)
    slices.push({ name: "Sans catégorie", value: agg.uncategorizedSpent });

  const months = lastMonths(12, month);

  const summaryPct =
    totalBudgeted > 0 ? Math.min(100, (agg.totalSpent / totalBudgeted) * 100) : 0;
  const summaryOver = totalBudgeted > 0 && agg.totalSpent > totalBudgeted;

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {formatMonthLong(month)}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Tableau de bord</h1>
        </div>
        <div className="w-40 shrink-0">
          <MonthPicker months={months} value={month} basePath="/" />
        </div>
      </div>

      {thisMonthTx.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p className="text-sm">
              Aucune transaction pour {formatMonthLong(month)}.
            </p>
            <Link
              href="/import"
              className="inline-block mt-2 text-primary hover:underline"
            >
              Importer un relevé →
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Hero summary */}
          <Card>
            <CardContent className="py-6 space-y-4">
              <div className="text-center">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Dépensé
                </p>
                <p className="mt-1 text-4xl font-bold tabular-nums tracking-tight">
                  {EUR.format(agg.totalSpent)}
                </p>
              </div>

              {totalBudgeted > 0 ? (
                <div className="space-y-2">
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-[width] duration-500 ease-out ${
                        summaryOver ? "bg-destructive" : "bg-primary"
                      }`}
                      style={{ width: `${summaryPct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Budget {EUR0.format(totalBudgeted)}
                    </span>
                    <span
                      className={
                        balance < 0
                          ? "text-destructive font-medium"
                          : "text-primary font-medium"
                      }
                    >
                      {balance < 0 ? "Dépassé de " : "Restant "}
                      {EUR0.format(Math.abs(balance))}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-center text-xs text-muted-foreground">
                  Aucun budget défini —{" "}
                  <Link href="/budgets" className="text-primary hover:underline">
                    en saisir
                  </Link>
                </p>
              )}

              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground border-t border-border/60 pt-3">
                {deltaPct !== null ? (
                  <span className="inline-flex items-center gap-1">
                    <span aria-hidden>{deltaPct >= 0 ? "↑" : "↓"}</span>
                    <span>
                      {Math.abs(deltaPct).toFixed(1)}% vs {formatMonthLong(prev)}
                    </span>
                  </span>
                ) : (
                  <span>Pas d'historique pour {formatMonthLong(prev)}</span>
                )}
                {agg.totalIncome > 0 && (
                  <>
                    <span aria-hidden>·</span>
                    <span>Revenus {EUR0.format(agg.totalIncome)}</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Récurrent / Variable */}
          <div className="grid grid-cols-2 gap-3">
            <TypeCard
              label="Récurrent"
              spent={agg.byType.RECURRENT}
              budget={budgetByType.RECURRENT}
            />
            <TypeCard
              label="Variable"
              spent={agg.byType.VARIABLE}
              budget={budgetByType.VARIABLE}
            />
          </div>

          {/* Pie chart */}
          <Card>
            <CardHeader className="pb-0">
              <CardTitle className="text-base">Répartition des dépenses</CardTitle>
            </CardHeader>
            <CardContent>
              <CategoryPie data={slices} />
            </CardContent>
          </Card>

          {/* Per-category progress */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Par catégorie</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5">
              {rows.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune donnée.</p>
              ) : (
                rows.map((r) => (
                  <CategoryProgressRow
                    key={r.id}
                    name={r.name}
                    parentName={r.parentName}
                    spent={r.spent}
                    budget={r.budget}
                  />
                ))
              )}
              {agg.uncategorizedSpent > 0 && (
                <CategoryProgressRow
                  key="__none__"
                  name="Sans catégorie"
                  parentName=""
                  spent={agg.uncategorizedSpent}
                  budget={0}
                />
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function TypeCard({
  label,
  spent,
  budget,
}: {
  label: string;
  spent: number;
  budget: number;
}) {
  const pct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;
  const over = budget > 0 && spent > budget;
  return (
    <Card>
      <CardContent className="py-3 space-y-2">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className="text-lg font-semibold tabular-nums leading-none">
          {EUR0.format(spent)}
          {budget > 0 && (
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              / {EUR0.format(budget)}
            </span>
          )}
        </div>
        {budget > 0 && (
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-[width] duration-500 ease-out ${
                over ? "bg-destructive" : "bg-primary"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CategoryProgressRow({
  name,
  parentName,
  spent,
  budget,
}: {
  name: string;
  parentName: string;
  spent: number;
  budget: number;
}) {
  const pct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;
  const over = budget > 0 && spent > budget;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-sm truncate">{name}</div>
          {parentName && (
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {parentName}
            </div>
          )}
        </div>
        <div className="text-sm tabular-nums shrink-0">
          <span className={over ? "text-destructive font-medium" : ""}>
            {EUR0.format(spent)}
          </span>
          {budget > 0 && (
            <span className="text-muted-foreground">
              {" / "}
              {EUR0.format(budget)}
            </span>
          )}
        </div>
      </div>
      <div className="mt-1.5 h-1.5 w-full rounded-full bg-muted overflow-hidden">
        {budget > 0 ? (
          <div
            className={`h-full rounded-full transition-[width] duration-500 ease-out ${
              over ? "bg-destructive" : "bg-primary"
            }`}
            style={{ width: `${pct}%` }}
          />
        ) : spent > 0 ? (
          <div
            className="h-full rounded-full bg-muted-foreground/30"
            style={{ width: "100%" }}
          />
        ) : null}
      </div>
    </div>
  );
}
