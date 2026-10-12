import type { Stock } from "./schema";

export const methodology = [
  {
    key: "quality",
    name: "Chất lượng",
    formula:
      "100 × trung bình(clamp(ROE / 20), clamp(biên LN ròng / 20), clamp(1 − D/E / 2))",
    required: "ROE, biên lợi nhuận ròng (%), nợ/vốn chủ sở hữu (lần).",
  },
  {
    key: "value",
    name: "Định giá",
    formula: "100 × trung bình(clamp((25 − P/E) / 20), clamp((4 − P/B) / 3))",
    required: "P/E = giá / EPS; P/B = giá / BVPS. EPS và BVPS phải dương.",
  },
  {
    key: "growth",
    name: "Tăng trưởng",
    formula:
      "100 × trung bình(clamp(tăng trưởng doanh thu / 25), clamp(tăng trưởng EPS / 25))",
    required: "Tăng trưởng so với cùng kỳ (%), cùng phạm vi báo cáo.",
  },
  {
    key: "momentum",
    name: "Động lượng",
    formula: "100 × clamp((lợi suất 63 phiên + 10) / 30)",
    required:
      "Lợi suất 63 phiên (%) từ chuỗi giá đã điều chỉnh, có thời điểm riêng.",
  },
];
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const mean = (values: number[]) =>
  Math.round((100 * values.reduce((a, b) => a + b, 0)) / values.length);
const daysOld = (value: string, now: number) =>
  (now - Date.parse(value)) / 86_400_000;

export function analyze(stock: Stock, now = Date.now()) {
  const {
    roe,
    netMargin,
    debtToEquity,
    eps,
    bvps,
    revenueGrowth,
    epsGrowth,
    return63d,
  } = stock;
  const warnings: string[] = [];
  const stalePrice = daysOld(stock.priceAsOf, now) > 7;
  const staleFinancials = daysOld(stock.financialAsOf, now) > 550;
  const staleMomentum =
    !stock.momentumAsOf || daysOld(stock.momentumAsOf, now) > 7;
  if (stalePrice) warnings.push("Giá đã quá 7 ngày; không tham gia xếp hạng.");
  if (staleFinancials)
    warnings.push("Kỳ tài chính đã quá 550 ngày; không tham gia xếp hạng.");
  if (return63d !== null && staleMomentum)
    warnings.push("Động lượng thiếu thời điểm hoặc quá 7 ngày.");
  if (stock.sector === "financial")
    warnings.push(
      "Chưa áp dụng mô hình này cho ngân hàng, chứng khoán và bảo hiểm.",
    );
  const supported = stock.sector === "nonfinancial";
  const quality =
    supported && roe !== null && netMargin !== null && debtToEquity !== null
      ? mean([
          clamp(roe / 20),
          clamp(netMargin / 20),
          clamp(1 - debtToEquity / 2),
        ])
      : null;
  const pe = eps !== null && eps > 0 ? stock.price / eps : null;
  const pb = bvps !== null && bvps > 0 ? stock.price / bvps : null;
  const value =
    supported && pe !== null && pb !== null
      ? mean([clamp((25 - pe) / 20), clamp((4 - pb) / 3)])
      : null;
  const growth =
    supported && revenueGrowth !== null && epsGrowth !== null
      ? mean([clamp(revenueGrowth / 25), clamp(epsGrowth / 25)])
      : null;
  const momentum =
    supported && return63d !== null && !staleMomentum
      ? mean([clamp((return63d + 10) / 30)])
      : null;
  const scores = { quality, value, growth, momentum };
  const complete = Object.values(scores).every((v) => v !== null);
  const total =
    complete && !stalePrice && !staleFinancials
      ? Math.round(
          Object.values(scores).reduce<number>((a, b) => a + (b ?? 0), 0) / 4,
        )
      : null;
  if (!complete)
    warnings.push("Thiếu chỉ tiêu hợp lệ; không tính điểm tổng hoặc xếp hạng.");
  return { scores, total, pe, pb, warnings, stalePrice, staleFinancials };
}

export function grahamValue(eps: number, bvps: number, margin: number) {
  if (
    ![eps, bvps, margin].every(Number.isFinite) ||
    eps <= 0 ||
    bvps <= 0 ||
    margin < 0 ||
    margin >= 100
  )
    throw new Error("EPS, BVPS phải dương; biên an toàn từ 0 đến dưới 100%.");
  const referenceValue = Math.sqrt(22.5 * eps * bvps);
  if (!Number.isFinite(referenceValue))
    throw new Error("Đầu vào vượt phạm vi tính toán.");
  return { referenceValue, buyCeiling: referenceValue * (1 - margin / 100) };
}
