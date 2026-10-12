import { NextResponse } from "next/server";
import { importSchema } from "@/lib/schema";
import { importStocks } from "@/lib/db";
import { mutationGuard, readJson } from "@/lib/http";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const blocked = mutationGuard(request);
  if (blocked) return blocked;
  let data: unknown;
  try {
    data = await readJson(request);
  } catch {
    return NextResponse.json(
      { error: "JSON không hợp lệ hoặc vượt quá 5 MB." },
      { status: 400 },
    );
  }
  const result = importSchema.safeParse(data);
  if (!result.success)
    return NextResponse.json(
      {
        error: "Dữ liệu không hợp lệ.",
        issues: result.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 422 },
    );
  const imported = importStocks(result.data);
  return NextResponse.json({
    imported,
    provenance: "user_supplied_unverified",
  });
}
