import { createHash } from "node:crypto";
import Papa from "papaparse";

export type BoursoRow = {
  dateOp: string;
  dateVal: string;
  label: string;
  category: string;
  categoryParent: string;
  supplierFound: string;
  amount: string;
  comment: string;
  accountNum: string;
  accountLabel: string;
  accountbalance: string;
};

export type ParsedTransaction = {
  dateOp: Date;
  dateVal: Date;
  label: string;
  amount: number;
  comment: string | null;
  supplierFound: string | null;
  accountNum: string;
  accountLabel: string | null;
  categoryName: string;
  categoryParentName: string;
  dedupHash: string;
};

const REQUIRED_HEADERS = [
  "dateOp",
  "dateVal",
  "label",
  "category",
  "categoryParent",
  "amount",
  "accountNum",
] as const;

function parseFrenchAmount(raw: string): number {
  // BoursoBank exports use ',' as decimal separator and no thousands separator.
  const normalized = raw.trim().replace(/\s/g, "").replace(",", ".");
  const n = Number(normalized);
  if (Number.isNaN(n)) throw new Error(`Invalid amount: ${raw}`);
  return n;
}

function parseDate(raw: string): Date {
  // BoursoBank exports use YYYY-MM-DD.
  const [y, m, d] = raw.trim().split("-").map(Number);
  if (!y || !m || !d) throw new Error(`Invalid date: ${raw}`);
  return new Date(Date.UTC(y, m - 1, d));
}

export function computeDedupHash(input: {
  dateOp: string;
  label: string;
  amount: number;
  accountNum: string;
  occurrence: number;
}): string {
  return createHash("sha1")
    .update(
      `${input.dateOp}|${input.label}|${input.amount.toFixed(2)}|${input.accountNum}|${input.occurrence}`,
    )
    .digest("hex");
}

export function parseBoursoCsv(content: string): {
  rows: ParsedTransaction[];
  errors: string[];
} {
  // Strip UTF-8 BOM if present.
  const clean = content.replace(/^﻿/, "");

  const parsed = Papa.parse<BoursoRow>(clean, {
    header: true,
    delimiter: ";",
    skipEmptyLines: true,
  });

  const errors: string[] = [];
  for (const e of parsed.errors) {
    errors.push(`Ligne ${e.row}: ${e.message}`);
  }

  const headers = parsed.meta.fields ?? [];
  for (const h of REQUIRED_HEADERS) {
    if (!headers.includes(h)) {
      errors.push(`Colonne manquante: ${h}`);
    }
  }
  if (errors.length > 0) {
    return { rows: [], errors };
  }

  const rows: ParsedTransaction[] = [];
  // Track per-identity occurrence index so legitimate same-day same-amount
  // duplicates (e.g. two identical transfers) get distinct dedup hashes.
  // Order is preserved across re-imports because BoursoBank's CSV order is
  // stable for already-exported rows.
  const occurrenceCounts = new Map<string, number>();

  parsed.data.forEach((row, idx) => {
    try {
      const amount = parseFrenchAmount(row.amount);
      const dateOpRaw = row.dateOp.trim();
      const labelTrim = row.label.trim();
      const accountNumTrim = row.accountNum.trim();
      const identityKey = `${dateOpRaw}|${labelTrim}|${amount.toFixed(2)}|${accountNumTrim}`;
      const occurrence = occurrenceCounts.get(identityKey) ?? 0;
      occurrenceCounts.set(identityKey, occurrence + 1);

      const parsedRow: ParsedTransaction = {
        dateOp: parseDate(dateOpRaw),
        dateVal: parseDate(row.dateVal),
        label: labelTrim,
        amount,
        comment: row.comment?.trim() || null,
        supplierFound: row.supplierFound?.trim() || null,
        accountNum: accountNumTrim,
        accountLabel: row.accountLabel?.trim() || null,
        categoryName: row.category?.trim() || "Non catégorisé",
        categoryParentName: row.categoryParent?.trim() || "Non catégorisé",
        dedupHash: computeDedupHash({
          dateOp: dateOpRaw,
          label: labelTrim,
          amount,
          accountNum: accountNumTrim,
          occurrence,
        }),
      };
      rows.push(parsedRow);
    } catch (err) {
      errors.push(`Ligne ${idx + 2}: ${(err as Error).message}`);
    }
  });

  return { rows, errors };
}
