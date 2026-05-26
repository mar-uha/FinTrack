import { prisma } from "@/lib/prisma";
import { BudgetForm } from "@/components/budget-form";

export default async function BudgetsPage() {
  const [categories, budgets] = await Promise.all([
    prisma.category.findMany({
      orderBy: [{ parentName: "asc" }, { name: "asc" }],
    }),
    prisma.budget.findMany(),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Budgets</h1>

      <p className="text-sm text-muted-foreground">
        Définis un montant <strong>mensuel cible</strong> par catégorie. Le même
        montant s'applique à chaque mois et sert de référence sur le tableau de
        bord. Les valeurs vides ou à 0 ne sont pas enregistrées.
      </p>

      <BudgetForm
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
