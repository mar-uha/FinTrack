import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const BodySchema = z.object({
  budgets: z.array(
    z.object({
      categoryId: z.string().min(1),
      // null or 0 removes the budget; positive number upserts.
      amount: z.number().nonnegative().nullable(),
    }),
  ),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Payload invalide", details: parsed.error.issues },
      { status: 400 },
    );
  }

  const { budgets } = parsed.data;

  // Validate every categoryId actually exists, in one query.
  const categoryIds = [...new Set(budgets.map((b) => b.categoryId))];
  const existing = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true },
  });
  if (existing.length !== categoryIds.length) {
    return NextResponse.json(
      { error: "Une ou plusieurs catégories sont inconnues" },
      { status: 400 },
    );
  }

  let upserted = 0;
  let deleted = 0;

  for (const b of budgets) {
    const isZeroOrNull = b.amount === null || b.amount === 0;
    if (isZeroOrNull) {
      const res = await prisma.budget.deleteMany({
        where: { categoryId: b.categoryId },
      });
      deleted += res.count;
    } else {
      await prisma.budget.upsert({
        where: { categoryId: b.categoryId },
        update: { amount: b.amount! },
        create: { categoryId: b.categoryId, amount: b.amount! },
      });
      upserted += 1;
    }
  }

  return NextResponse.json({ upserted, deleted });
}
