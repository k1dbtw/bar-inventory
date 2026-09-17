import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { badRequest, withOwner } from "@/lib/api";
import { getDb } from "@/lib/db";
import { owners } from "@/lib/db/schema";
import { ownerSettings } from "@/lib/settings";
import { settingsSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  return withOwner(async (owner) => ownerSettings(owner));
}

export async function PUT(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) return badRequest("invalid_settings");
  return withOwner(async (owner) => {
    const db = await getDb();
    const updated = await db
      .update(owners)
      .set(parsed.data)
      .where(eq(owners.id, owner.id))
      .returning();
    return ownerSettings(updated[0] as typeof owner);
  });
}
