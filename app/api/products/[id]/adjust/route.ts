import { NextRequest } from "next/server";
import { badRequest, withOwner } from "@/lib/api";
import { adjustQuantity } from "@/lib/inventory";
import { adjustSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Context) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = adjustSchema.safeParse(body);
  if (!parsed.success) return badRequest("invalid_delta");
  return withOwner(async (owner) => {
    const updated = await adjustQuantity(owner, id, parsed.data.delta);
    if (!updated) throw new Error("not_found");
    return updated;
  });
}
