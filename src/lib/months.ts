// YYYY-MM helpers shared by transactions and budgets pages.

const MONTH_RE = /^(\d{4})-(\d{2})$/;

export function isValidMonth(m: string): boolean {
  const match = MONTH_RE.exec(m);
  if (!match) return false;
  const mo = Number(match[2]);
  return mo >= 1 && mo <= 12;
}

export function currentMonth(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function previousMonth(yyyymm: string): string | null {
  const match = MONTH_RE.exec(yyyymm);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = new Date(Date.UTC(y, m - 2, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function lastMonths(count: number, anchor?: string): string[] {
  const out: string[] = [];
  let base: Date;
  if (anchor && isValidMonth(anchor)) {
    const [y, m] = anchor.split("-").map(Number);
    base = new Date(Date.UTC(y, m - 1, 1));
  } else {
    const now = new Date();
    base = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  }
  for (let i = 0; i < count; i++) {
    const d = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() - i, 1));
    out.push(
      `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`,
    );
  }
  return out;
}

export function formatMonthLong(yyyymm: string): string {
  const [y, m] = yyyymm.split("-").map(Number);
  return new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(y, m - 1, 1)));
}
