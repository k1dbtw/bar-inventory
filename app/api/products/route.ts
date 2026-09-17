import { NextRequest } from "next/server";
import { badRequest, withOwner } from "@/lib/api";
import { createProduct, listProducts } from "@/lib/inventory";
import { productInputSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const archived = request.nextUrl.searchParams.get("archived") === "1";
  return withOwner((owner) => listProducts(owner, { archived }));
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = productInputSchema.safeParse(body);
  if (!parsed.success) return badRequest("invalid_product");
  return withOwner((owner) => createProduct(owner, parsed.data));
}
