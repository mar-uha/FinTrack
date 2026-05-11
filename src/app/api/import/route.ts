import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseBoursoCsv } from "@/lib/csv";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
  }

  const content = await file.text();
  const { rows, errors } = parseBoursoCsv(content);

  if (errors.length > 0 && rows.length === 0) {
    return NextResponse.json({ error: "Parsing impossible", details: errors }, { status: 400 });
  }

  // Resolve / auto-create categories.
  const uniqueCategories = new Map<string, string>();
  for (const r of rows) uniqueCategories.set(r.categoryName, r.categoryParentName);

  const existing = await prisma.category.findMany({
    where: { name: { in: [...uniqueCategories.keys()] } },
    select: { id: true, name: true },
  });
  const nameToId = new Map(existing.map((c) => [c.name, c.id]));

  for (const [name, parentName] of uniqueCategories) {
    if (!nameToId.has(name)) {
      const created = await prisma.category.create({
        data: { name, parentName, type: "VARIABLE" },
      });
      nameToId.set(name, created.id);
    }
  }

  // Create the import batch first so transactions can reference it.
  const batch = await prisma.importBatch.create({
    data: { filename: file.name, count: 0 },
  });

  // SQLite via the driver adapter doesn't accept `skipDuplicates` — pre-filter
  // existing dedupHashes ourselves so the createMany only inserts new rows.
  const hashes = rows.map((r) => r.dedupHash);
  const existingHashes = await prisma.transaction.findMany({
    where: { dedupHash: { in: hashes } },
    select: { dedupHash: true },
  });
  const existingSet = new Set(existingHashes.map((t) => t.dedupHash));
  const newRows = rows.filter((r) => !existingSet.has(r.dedupHash));

  const data = newRows.map((r) => ({
    dateOp: r.dateOp,
    dateVal: r.dateVal,
    label: r.label,
    amount: r.amount,
    comment: r.comment,
    supplierFound: r.supplierFound,
    accountNum: r.accountNum,
    accountLabel: r.accountLabel,
    categoryId: nameToId.get(r.categoryName) ?? null,
    importBatchId: batch.id,
    dedupHash: r.dedupHash,
  }));

  const result = data.length > 0
    ? await prisma.transaction.createMany({ data })
    : { count: 0 };

  await prisma.importBatch.update({
    where: { id: batch.id },
    data: { count: result.count },
  });

  return NextResponse.json({
    inserted: result.count,
    skipped: rows.length - result.count,
    parseErrors: errors,
    batchId: batch.id,
  });
}
