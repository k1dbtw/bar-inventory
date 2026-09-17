import { NextRequest } from "next/server";
import { withOwner } from "@/lib/api";
import { archiveProduct, restoreProduct } from "@/lib/inventory";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, { params }: Context) {
  const { id } = await params;
  return withOwner(async (owner) => ({ ok: await archiveProduct(owner, id) }));
}

export async function DELETE(_request: NextRequest, { params }: Context) {
  const { id } = await params;
  return withOwner(async (owner) => ({ ok: await restoreProduct(owner, id) }));
}
