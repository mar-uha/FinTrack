"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { formatMonthLong } from "@/lib/months";

const SELECT_CLASS =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring";

type Props = {
  months: string[];
  value: string;
  basePath: string; // e.g. "/budgets"
};

export function MonthPicker({ months, value, basePath }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <select
      className={`${SELECT_CLASS} ${pending ? "opacity-60" : ""}`}
      value={value}
      onChange={(e) => {
        const next = e.target.value;
        startTransition(() => router.push(`${basePath}?month=${next}`));
      }}
    >
      {months.map((m) => (
        <option key={m} value={m}>
          {formatMonthLong(m)}
        </option>
      ))}
    </select>
  );
}
