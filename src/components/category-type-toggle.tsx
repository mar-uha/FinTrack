"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  id: string;
  type: "RECURRENT" | "VARIABLE";
};

export function CategoryTypeToggle({ id, type }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onChange(next: "RECURRENT" | "VARIABLE") {
    if (next === type) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: next }),
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

  const busy = saving || pending;

  return (
    <div className="flex items-center gap-1">
      <div
        role="radiogroup"
        aria-label="Type"
        className={`inline-flex rounded-md border border-input p-0.5 text-xs ${busy ? "opacity-60" : ""}`}
      >
        <button
          type="button"
          role="radio"
          aria-checked={type === "RECURRENT"}
          onClick={() => onChange("RECURRENT")}
          disabled={busy}
          className={`px-2 py-0.5 rounded transition-colors ${
            type === "RECURRENT"
              ? "bg-primary text-primary-foreground"
              : "hover:bg-accent"
          }`}
        >
          Récurrent
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={type === "VARIABLE"}
          onClick={() => onChange("VARIABLE")}
          disabled={busy}
          className={`px-2 py-0.5 rounded transition-colors ${
            type === "VARIABLE"
              ? "bg-primary text-primary-foreground"
              : "hover:bg-accent"
          }`}
        >
          Variable
        </button>
      </div>
      {error && <span className="text-[10px] text-destructive">{error}</span>}
    </div>
  );
}
