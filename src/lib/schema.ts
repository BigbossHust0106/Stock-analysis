import { z } from "zod";

const timestamp = z.iso
  .datetime({ offset: true })
  .refine(
    (v) => Date.parse(v) <= Date.now() + 60_000,
    "Thời điểm dữ liệu không được ở tương lai",
  );
const optionalNumber = z
  .number()
  .finite()
  .nullable()
  .optional()
  .transform((v) => v ?? null);
export const stockSchema = z
  .object({
    symbol: z.string().regex(/^[A-Z][A-Z0-9]{1,9}$/),
    name: z.string().trim().min(1).max(200),
    exchange: z.enum(["HOSE", "HNX", "UPCoM"]),
    sector: z.enum(["nonfinancial", "financial"]),
    price: z.number().finite().positive(),
    priceAsOf: timestamp,
    financialAsOf: timestamp,
    roe: optionalNumber,
    debtToEquity: optionalNumber.pipe(z.number().nonnegative().nullable()),
    netMargin: optionalNumber,
    eps: optionalNumber,
    bvps: optionalNumber,
    revenueGrowth: optionalNumber,
    epsGrowth: optionalNumber,
    return63d: optionalNumber,
    momentumAsOf: timestamp.nullable().optional(),
  })
  .strict()
  .refine(
    (s) => s.return63d === null || !!s.momentumAsOf,
    "return63d cần momentumAsOf",
  );

export const importSchema = z
  .object({
    conventions: z
      .object({
        currency: z.literal("VND"),
        epsBasis: z.literal("TTM"),
        growthBasis: z.literal("YoY_TTM"),
        pricesAndPerShareMetricsConsistent: z.literal(true),
        return63dFromAdjustedPrices: z.literal(true),
      })
      .strict(),
    source: z
      .object({
        name: z.string().trim().min(2).max(200),
        url: z
          .url()
          .refine(
            (v) => new URL(v).protocol === "https:",
            "Nguồn phải dùng HTTPS",
          ),
        license: z.string().trim().min(5).max(1000),
        rightsConfirmed: z.literal(true),
      })
      .strict(),
    stocks: z.array(stockSchema).min(1).max(5000),
  })
  .strict()
  .refine(
    (v) => new Set(v.stocks.map((s) => s.symbol)).size === v.stocks.length,
    "Mã cổ phiếu trùng trong một lần nhập",
  );

export type Stock = z.infer<typeof stockSchema>;
export type ImportBatch = z.infer<typeof importSchema>;
export type StockRecord = Stock & {
  source: ImportBatch["source"];
  importedAt: string;
};
