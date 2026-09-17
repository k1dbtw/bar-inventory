import { withOwner } from "@/lib/api";
import { listProducts } from "@/lib/inventory";
import { ownerSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  return withOwner(async (owner) => ({
    settings: ownerSettings(owner),
    products: await listProducts(owner),
  }));
}
