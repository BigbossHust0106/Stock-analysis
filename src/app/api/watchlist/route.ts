import { NextResponse } from "next/server";
import { z } from "zod";
import { listStocks, setWatchlist } from "@/lib/db";
import { mutationGuard, readJson } from "@/lib/http";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const blocked = mutationGuard(request);
  if (blocked) return blocked;
  let data: unknown;
  try {
    data = await readJson(request);
  } catch {
    return NextResponse.json({ error: "JSON không hợp lệ." }, { status: 400 });
  }
  const result = z
    .object({
      symbol: z.string().regex(/^[A-Z][A-Z0-9]{1,9}$/),
      enabled: z.boolean(),
    })
    .strict()
    .safeParse(data);
  if (!result.success)
    return NextResponse.json(
      { error: "Mã hoặc trạng thái không hợp lệ." },
      { status: 422 },
    );
  if (
    result.data.enabled &&
    !listStocks().some((s) => s.symbol === result.data.symbol)
  )
    return NextResponse.json({ error: "Mã chưa có dữ liệu." }, { status: 404 });
  setWatchlist(result.data.symbol, result.data.enabled);
  return NextResponse.json({ ok: true });
}
