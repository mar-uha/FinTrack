import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const PatchSchema = z.object({
  type: z.enum(["RECURRENT", "VARIABLE"]),
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

  const updated = await prisma.category.update({
    where: { id },
    data: { type: parsed.data.type },
    select: { id: true, type: true },
  });

  // Category type drives the recurrent/variable split on the dashboard,
  // the type filter on /transactions, and the form on /budgets.
  revalidatePath("/");
  revalidatePath("/transactions");
  revalidatePath("/budgets");
  revalidatePath("/settings/categories");

  return NextResponse.json(updated);
}
