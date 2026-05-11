import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { TransactionFilters } from "@/components/transaction-filters";
import { TransactionRow } from "@/components/transaction-row";

type SearchParams = {
  month?: string;
  categoryId?: string;
  type?: "RECURRENT" | "VARIABLE";
  q?: string;
};

function monthRange(yyyymm: string): { start: Date; end: Date } | null {
  const m = /^(\d{4})-(\d{2})$/.exec(yyyymm);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  if (mo < 1 || mo > 12) return null;
  return {
    start: new Date(Date.UTC(y, mo - 1, 1)),
    end: new Date(Date.UTC(y, mo, 1)),
  };
}

function formatAmount(value: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
  }).format(d);
}

function lastMonths(count: number): string[] {
  const now = new Date();
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    out.push(
      `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`,
    );
  }
  return out;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;

  const where: Prisma.TransactionWhereInput = {};
  if (sp.month) {
    const range = monthRange(sp.month);
    if (range) {
      where.dateOp = { gte: range.start, lt: range.end };
    }
  }
  if (sp.categoryId) {
    where.categoryId = sp.categoryId;
  }
  if (sp.type) {
    where.category = { type: sp.type };
  }
  if (sp.q) {
    where.label = { contains: sp.q };
  }

  const [transactions, categories, totalCount] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { dateOp: "desc" },
      include: { category: true },
      take: 200,
    }),
    prisma.category.findMany({
      orderBy: [{ parentName: "asc" }, { name: "asc" }],
    }),
    prisma.transaction.count({ where }),
  ]);

  const total = transactions.reduce((sum, t) => sum + Number(t.amount), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">Transactions</h1>
        <span className="text-sm text-muted-foreground">
          {totalCount} entrée{totalCount > 1 ? "s" : ""}
        </span>
      </div>

      <TransactionFilters
        months={lastMonths(12)}
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          parentName: c.parentName,
        }))}
        defaultValues={{
          month: sp.month ?? "",
          categoryId: sp.categoryId ?? "",
          type: sp.type ?? "",
          q: sp.q ?? "",
        }}
      />

      {transactions.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Aucune transaction. Commence par{" "}
            <a href="/import" className="underline">
              importer un relevé
            </a>
            .
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Total {transactions.length > 199 ? "(200 premières)" : ""}
            </span>
            <span className={total < 0 ? "text-red-600" : "text-emerald-600"}>
              {formatAmount(total)}
            </span>
          </div>

          <ul className="divide-y rounded-lg border bg-card">
            {transactions.map((t) => {
              const amount = Number(t.amount);
              return (
                <TransactionRow
                  key={t.id}
                  id={t.id}
                  date={formatDate(t.dateOp)}
                  label={t.label}
                  amount={amount}
                  amountText={formatAmount(amount)}
                  categoryId={t.categoryId}
                  categories={categories.map((c) => ({
                    id: c.id,
                    name: c.name,
                    parentName: c.parentName,
                  }))}
                />
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
