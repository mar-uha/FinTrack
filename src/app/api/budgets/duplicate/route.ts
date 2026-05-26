import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isValidMonth } from "@/lib/months";

const BodySchema = z
  .object({
    from: z.string().refine(isValidMonth, "Mois source invalide"),
    to: z.string().refine(isValidMonth, "Mois cible invalide"),
  })
  .refine((d) => d.from !== d.to, { message: "Les mois source et cible doivent différer" });

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Payload invalide", details: parsed.error.issues },
      { status: 400 },
    );
  }
  const { from, to } = parsed.data;

  const source = await prisma.budget.findMany({ where: { month: from } });
  if (source.length === 0) {
    return NextResponse.json(
      { error: `Aucun budget défini pour ${from}` },
      { status: 404 },
    );
  }

  // Replace the target month entirely so the operation is idempotent.
  const deleted = await prisma.budget.deleteMany({ where: { month: to } });
  const created = await prisma.budget.createMany({
    data: source.map((b) => ({
      categoryId: b.categoryId,
      month: to,
      amount: b.amount,
    })),
  });

  return NextResponse.json({
    from,
    to,
    deleted: deleted.count,
    created: created.count,
  });
}
