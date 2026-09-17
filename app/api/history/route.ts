import { withOwner } from "@/lib/api";
import { listHistory } from "@/lib/inventory";

export const dynamic = "force-dynamic";

export async function GET() {
  return withOwner((owner) => listHistory(owner));
}
