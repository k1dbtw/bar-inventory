import { NextRequest } from "next/server";
import { badRequest, withOwner } from "@/lib/api";
import { deleteProduct, updateProduct } from "@/lib/inventory";
import { productInputSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Context) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = productInputSchema.safeParse(body);
  if (!parsed.success) return badRequest("invalid_product");
  return withOwner(async (owner) => {
    const updated = await updateProduct(owner, id, parsed.data);
    if (!updated) throw new Error("not_found");
    return updated;
  });
}

export async function DELETE(_request: NextRequest, { params }: Context) {
  const { id } = await params;
  return withOwner(async (owner) => {
    const deleted = await deleteProduct(owner, id);
    return { ok: deleted };
  });
}
