import { NextResponse } from "next/server";
import { requireOwner, UnauthorizedError } from "./auth";
import type { Owner } from "./db/schema";

export async function withOwner<T>(fn: (owner: Owner) => Promise<T>): Promise<NextResponse> {
  try {
    const owner = await requireOwner();
    const data = await fn(owner);
    return NextResponse.json(data ?? { ok: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export function badRequest(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function notFound(): NextResponse {
  return NextResponse.json({ error: "not_found" }, { status: 404 });
}
