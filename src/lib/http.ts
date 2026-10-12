import { NextResponse } from "next/server";

export function mutationGuard(request: Request) {
  const origin = request.headers.get("origin");
  // Next's internal request URL may use localhost even when the browser uses 127.0.0.1.
  // Match the browser's Origin to the actual Host, without trusting forwarded host headers.
  let sameOrigin = false;
  try {
    const parsed = new URL(origin || "");
    sameOrigin =
      parsed.host === request.headers.get("host") &&
      parsed.protocol === new URL(request.url).protocol;
  } catch {
    /* malformed origin */
  }
  if (!sameOrigin)
    return NextResponse.json(
      { error: "Yêu cầu ghi phải đến từ cùng ứng dụng." },
      { status: 403 },
    );
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return NextResponse.json({ error: "Chỉ hỗ trợ JSON." }, { status: 415 });
}
export async function readJson(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Thiếu nội dung.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 5_000_000) {
      await reader.cancel();
      throw new Error("Tệp vượt quá 5 MB.");
    }
    chunks.push(value);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
