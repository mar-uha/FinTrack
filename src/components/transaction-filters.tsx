"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Input } from "@/components/ui/input";

const SELECT_CLASS =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring";

type Category = { id: string; name: string; parentName: string };

type Props = {
  months: string[];
  categories: Category[];
  defaultValues: {
    month: string;
    categoryId: string;
    type: string;
    q: string;
  };
};

function formatMonth(yyyymm: string): string {
  const [y, m] = yyyymm.split("-").map(Number);
  return new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(y, m - 1, 1)));
}

export function TransactionFilters({ months, categories, defaultValues }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  function update(key: string, value: string) {
    const next = new URLSearchParams(params?.toString() ?? "");
    if (value) next.set(key, value);
    else next.delete(key);
    startTransition(() => {
      router.push(`/?${next.toString()}`);
    });
  }

  const grouped = categories.reduce<Record<string, Category[]>>((acc, c) => {
    (acc[c.parentName] ??= []).push(c);
    return acc;
  }, {});

  return (
    <div className={`grid grid-cols-2 gap-2 ${pending ? "opacity-60" : ""}`}>
      <select
        className={SELECT_CLASS}
        value={defaultValues.month}
        onChange={(e) => update("month", e.target.value)}
      >
        <option value="">Tous les mois</option>
        {months.map((m) => (
          <option key={m} value={m}>
            {formatMonth(m)}
          </option>
        ))}
      </select>

      <select
        className={SELECT_CLASS}
        value={defaultValues.type}
        onChange={(e) => update("type", e.target.value)}
      >
        <option value="">Récurrent + variable</option>
        <option value="RECURRENT">Récurrent</option>
        <option value="VARIABLE">Variable</option>
      </select>

      <select
        className={`${SELECT_CLASS} col-span-2`}
        value={defaultValues.categoryId}
        onChange={(e) => update("categoryId", e.target.value)}
      >
        <option value="">Toutes les catégories</option>
        {Object.entries(grouped).map(([parent, items]) => (
          <optgroup key={parent} label={parent}>
            {items.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      <Input
        className="col-span-2"
        placeholder="Rechercher dans le libellé…"
        defaultValue={defaultValues.q}
        onChange={(e) => {
          const v = e.target.value;
          // debounce-lite: update on each keystroke, React batch will coalesce
          update("q", v);
        }}
      />
    </div>
  );
}
