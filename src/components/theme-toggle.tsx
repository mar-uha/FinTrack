"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun, Monitor } from "lucide-react";

const ORDER = ["light", "dark", "system"] as const;
type Theme = (typeof ORDER)[number];

const ICONS: Record<Theme, React.ComponentType<{ className?: string }>> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

const LABELS: Record<Theme, string> = {
  light: "Thème clair",
  dark: "Thème sombre",
  system: "Thème système",
};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch — next-themes resolves the theme on the client.
  useEffect(() => setMounted(true), []);

  const current: Theme = ((mounted ? theme : "system") as Theme) ?? "system";
  const Icon = ICONS[current] ?? Monitor;

  function cycle() {
    const idx = ORDER.indexOf(current);
    const next = ORDER[(idx + 1) % ORDER.length];
    setTheme(next);
  }

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={LABELS[current]}
      title={LABELS[current]}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-transparent hover:bg-accent hover:text-accent-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
