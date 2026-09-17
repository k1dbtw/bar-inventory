import { withOwner } from "@/lib/api";
import { getStats } from "@/lib/inventory";

export const dynamic = "force-dynamic";

export async function GET() {
  return withOwner((owner) => getStats(owner));
}
