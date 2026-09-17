import { NextRequest } from "next/server";
import { badRequest, withOwner } from "@/lib/api";
import { writeOffProduct } from "@/lib/inventory";
import { writeOffSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Context) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = writeOffSchema.safeParse(body);
  if (!parsed.success) return badRequest("invalid_write_off");
  return withOwner(async (owner) => {
    const updated = await writeOffProduct(owner, id, parsed.data.amount, parsed.data.reason);
    if (!updated) throw new Error("not_found");
    return updated;
  });
}
