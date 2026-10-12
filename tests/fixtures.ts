// Synthetic fixtures exclusively for automated tests. Never seed the application database.
import type { ImportBatch } from "../src/lib/schema";
export const fixture = (): ImportBatch => ({
  conventions: {
    currency: "VND",
    epsBasis: "TTM",
    growthBasis: "YoY_TTM",
    pricesAndPerShareMetricsConsistent: true,
    return63dFromAdjustedPrices: true,
  },
  source: {
    name: "Automated test fixture",
    url: "https://example.org/test-only",
    license: "Synthetic test input, not market data",
    rightsConfirmed: true,
  },
  stocks: [
    {
      symbol: "TEST",
      name: "Synthetic test company",
      exchange: "HOSE",
      sector: "nonfinancial",
      price: 10000,
      priceAsOf: new Date().toISOString(),
      financialAsOf: new Date().toISOString(),
      momentumAsOf: new Date().toISOString(),
      roe: 20,
      netMargin: 20,
      debtToEquity: 0,
      eps: 2000,
      bvps: 10000,
      revenueGrowth: 25,
      epsGrowth: 25,
      return63d: 20,
    },
  ],
});
