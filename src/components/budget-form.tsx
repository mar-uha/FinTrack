"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

type Category = { id: string; name: string; parentName: string };
type BudgetItem = { categoryId: string; amount: number };

type Props = {
  categories: Category[];
  existing: BudgetItem[];
};

type Status =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved"; upserted: number; deleted: number }
  | { kind: "error"; message: string };

export function BudgetForm({ categories, existing }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const initialValues = useMemo(() => {
    const map: Record<string, string> = {};
    for (const b of existing) {
      map[b.categoryId] = b.amount.toString();
    }
    return map;
  }, [existing]);

  const [values, setValues] = useState<Record<string, string>>(initialValues);

  const grouped = useMemo(() => {
    return categories.reduce<Record<string, Category[]>>((acc, c) => {
      (acc[c.parentName] ??= []).push(c);
      return acc;
    }, {});
  }, [categories]);

  const total = useMemo(() => {
    let sum = 0;
    for (const v of Object.values(values)) {
      const n = Number(v.replace(",", "."));
      if (Number.isFinite(n)) sum += n;
    }
    return sum;
  }, [values]);

  async function save() {
    setStatus({ kind: "saving" });
    const payload = {
      budgets: categories.map((c) => {
        const raw = values[c.id]?.trim() ?? "";
        const n = raw === "" ? null : Number(raw.replace(",", "."));
        return {
          categoryId: c.id,
          amount: n !== null && Number.isFinite(n) ? n : null,
        };
      }),
    };

    const res = await fetch("/api/budgets", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) {
      setStatus({ kind: "error", message: json.error ?? "Erreur" });
      return;
    }
    setStatus({ kind: "saved", upserted: json.upserted, deleted: json.deleted });
    startTransition(() => router.refresh());
  }

  const busy = status.kind === "saving" || pending;
  const formatEur = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });

  return (
    <div className="space-y-4">
      {status.kind === "saved" && (
        <Alert>
          <AlertTitle>Budgets enregistrés</AlertTitle>
          <AlertDescription>
            {status.upserted} ligne(s) mises à jour, {status.deleted} supprimée(s).
          </AlertDescription>
        </Alert>
      )}
      {status.kind === "error" && (
        <Alert variant="destructive">
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{status.message}</AlertDescription>
        </Alert>
      )}

      <div className="rounded-lg border bg-card divide-y">
        {Object.entries(grouped).map(([parent, items]) => (
          <div key={parent} className="p-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              {parent}
            </h3>
            <div className="space-y-2">
              {items.map((c) => (
                <div key={c.id} className="flex items-center gap-3">
                  <label
                    htmlFor={`b-${c.id}`}
                    className="flex-1 text-sm min-w-0 truncate"
                  >
                    {c.name}
                  </label>
                  <div className="relative w-28 shrink-0">
                    <Input
                      id={`b-${c.id}`}
                      inputMode="decimal"
                      placeholder="0"
                      className="pr-6 text-right tabular-nums"
                      value={values[c.id] ?? ""}
                      onChange={(e) =>
                        setValues((v) => ({ ...v, [c.id]: e.target.value }))
                      }
                      disabled={busy}
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      €
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Total mensuel cible</span>
        <span className="font-medium tabular-nums">{formatEur.format(total)}</span>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={save} disabled={busy}>
          {status.kind === "saving" ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </div>
    </div>
  );
}
