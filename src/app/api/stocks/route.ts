import { NextResponse } from "next/server";
import { listStocks, listWatchlist } from "@/lib/db";
import { analyze } from "@/lib/analysis";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  const stocks = listStocks().map((stock) => ({
    ...stock,
    analysis: analyze(stock),
  }));
  return NextResponse.json(
    {
      stocks,
      watchlist: listWatchlist(),
      providerConnected: false,
      universe: "user_imported",
      generatedAt: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
