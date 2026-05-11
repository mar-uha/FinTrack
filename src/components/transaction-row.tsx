"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Category = { id: string; name: string; parentName: string };

type Props = {
  id: string;
  date: string;          // pre-formatted "30 avr."
  label: string;
  amount: number;        // raw signed amount
  amountText: string;    // pre-formatted "-45,00 €"
  categoryId: string | null;
  categories: Category[];
};

const SELECT_CLASS =
  "appearance-none rounded-full bg-secondary text-secondary-foreground text-[10px] font-normal px-2 py-0.5 max-w-full truncate focus:outline-none focus:ring-2 focus:ring-ring";

export function TransactionRow({
  id,
  date,
  label,
  amount,
  amountText,
  categoryId,
  categories,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onChange(nextId: string) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ categoryId: nextId || null }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? "Erreur");
        return;
      }
      startTransition(() => router.refresh());
    } finally {
      setSaving(false);
    }
  }

  const grouped = categories.reduce<Record<string, Category[]>>((acc, c) => {
    (acc[c.parentName] ??= []).push(c);
    return acc;
  }, {});

  const isUnset = !categoryId;
  const dim = saving || pending;

  return (
    <li className={`p-3 flex items-start gap-3 ${dim ? "opacity-60" : ""}`}>
      <div className="text-xs text-muted-foreground w-12 shrink-0 pt-1">
        {date}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">{label}</p>
        <div className="mt-1 flex items-center gap-2">
          <select
            aria-label="Catégorie"
            className={`${SELECT_CLASS} ${isUnset ? "italic text-muted-foreground" : ""}`}
            value={categoryId ?? ""}
            disabled={dim}
            onChange={(e) => onChange(e.target.value)}
          >
            <option value="">— sans catégorie —</option>
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
          {error && (
            <span className="text-[10px] text-red-600">{error}</span>
          )}
        </div>
      </div>
      <div
        className={`text-sm font-medium tabular-nums shrink-0 ${
          amount < 0 ? "text-red-600" : "text-emerald-600"
        }`}
      >
        {amountText}
      </div>
    </li>
  );
}
