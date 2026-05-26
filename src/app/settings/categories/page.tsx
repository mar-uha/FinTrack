import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { CategoryTypeToggle } from "@/components/category-type-toggle";

export default async function CategoriesSettingsPage() {
  const categories = await prisma.category.findMany({
    orderBy: [{ parentName: "asc" }, { name: "asc" }],
  });

  const grouped = categories.reduce<Record<string, typeof categories>>((acc, c) => {
    (acc[c.parentName] ??= []).push(c);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Catégories</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Marque chaque catégorie comme <strong>récurrente</strong> (loyer,
          abonnements…) ou <strong>variable</strong> (courses, sorties…). Le
          tableau de bord regroupe les deux séparément.
        </p>
      </div>

      <Card>
        <CardContent className="divide-y p-0">
          {Object.entries(grouped).map(([parent, items]) => (
            <div key={parent} className="p-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                {parent}
              </h3>
              <ul className="space-y-2">
                {items.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3">
                    <span className="text-sm flex-1 min-w-0 truncate">{c.name}</span>
                    <CategoryTypeToggle id={c.id} type={c.type} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
