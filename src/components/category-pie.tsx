"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

type Slice = { name: string; value: number };

type Props = {
  data: Slice[];
};

// Curated palette — distinct hues at consistent saturation/luminance.
const COLORS = [
  "#0ea5e9", // sky-500
  "#22c55e", // green-500
  "#f59e0b", // amber-500
  "#a855f7", // purple-500
  "#ef4444", // red-500
  "#14b8a6", // teal-500
  "#ec4899", // pink-500
  "#84cc16", // lime-500
  "#6b7280", // gray-500 — fallback / "Autres"
];

const EUR = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export function CategoryPie({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-6">
        Aucune dépense ce mois-ci.
      </div>
    );
  }

  return (
    <div className="w-full" style={{ height: 240 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={50}
            outerRadius={90}
            paddingAngle={1}
            strokeWidth={0}
          >
            {data.map((_, idx) => (
              <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => EUR.format(Number(value ?? 0))}
            contentStyle={{
              fontSize: 12,
              borderRadius: 6,
              border: "1px solid var(--border)",
              background: "var(--card)",
              color: "var(--foreground)",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        {data.map((d, idx) => (
          <li key={d.name} className="flex items-center gap-2 min-w-0">
            <span
              aria-hidden
              className="h-2 w-2 rounded-sm shrink-0"
              style={{ background: COLORS[idx % COLORS.length] }}
            />
            <span className="truncate flex-1">{d.name}</span>
            <span className="tabular-nums text-muted-foreground">
              {EUR.format(d.value)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
