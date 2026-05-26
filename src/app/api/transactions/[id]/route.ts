import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const PatchSchema = z.object({
  categoryId: z.string().min(1).nullable(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Payload invalide", details: parsed.error.issues },
      { status: 400 },
    );
  }

  if (parsed.data.categoryId !== null) {
    const exists = await prisma.category.findUnique({
      where: { id: parsed.data.categoryId },
      select: { id: true },
    });
    if (!exists) {
      return NextResponse.json({ error: "Catégorie inconnue" }, { status: 400 });
    }
  }

  const updated = await prisma.transaction.update({
    where: { id },
    data: { categoryId: parsed.data.categoryId },
    include: { category: true },
  });

  // Transaction category affects dashboard aggregates and the list filters.
  revalidatePath("/");
  revalidatePath("/transactions");

  return NextResponse.json({
    id: updated.id,
    categoryId: updated.categoryId,
    categoryName: updated.category?.name ?? null,
  });
}
