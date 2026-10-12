import test from "node:test";
import assert from "node:assert/strict";
import { analyze, grahamValue } from "../src/lib/analysis";
import { importSchema } from "../src/lib/schema";
import { fixture } from "./fixtures";

test("calculates four scores from explicit inputs", () => {
  const a = analyze(fixture().stocks[0]);
  assert.deepEqual(a.scores, {
    quality: 100,
    value: 100,
    growth: 100,
    momentum: 100,
  });
  assert.equal(a.total, 100);
  assert.equal(a.pe, 5);
  assert.equal(a.pb, 1);
});
test("missing input stays unknown and excludes overall ranking", () => {
  const a = analyze({ ...fixture().stocks[0], roe: null });
  assert.equal(a.scores.quality, null);
  assert.equal(a.total, null);
});
test("negative EPS never creates a cheap PE score", () => {
  const a = analyze({ ...fixture().stocks[0], eps: -100 });
  assert.equal(a.pe, null);
  assert.equal(a.scores.value, null);
  assert.equal(a.total, null);
});
test("stale data excludes ranking and financial sectors are unsupported", () => {
  assert.equal(
    analyze({ ...fixture().stocks[0], priceAsOf: "2020-01-01T00:00:00Z" })
      .total,
    null,
  );
  assert.equal(
    analyze({ ...fixture().stocks[0], financialAsOf: "2020-01-01T00:00:00Z" })
      .total,
    null,
  );
  assert.equal(
    analyze({ ...fixture().stocks[0], momentumAsOf: "2020-01-01T00:00:00Z" })
      .scores.momentum,
    null,
  );
  assert.equal(
    analyze({ ...fixture().stocks[0], sector: "financial" }).total,
    null,
  );
});
test("Graham formula and margin of safety use explicit assumptions", () => {
  const v = grahamValue(2000, 10000, 25);
  assert.ok(Math.abs(v.referenceValue - Math.sqrt(450000000)) < 0.001);
  assert.equal(v.buyCeiling, v.referenceValue * 0.75);
  for (const args of [
    [0, 1, 0],
    [-1, 1, 0],
    [1, 1, 100],
    [1, 1, -1],
    [Infinity, 1, 0],
  ])
    assert.throws(() => grahamValue(...(args as [number, number, number])));
});
test("requires provenance, HTTPS, valid exchanges and usage confirmation", () => {
  assert.equal(importSchema.safeParse(fixture()).success, true);
  for (const batch of [
    { ...fixture(), source: { ...fixture().source, rightsConfirmed: false } },
    {
      ...fixture(),
      source: { ...fixture().source, url: "javascript:alert(1)" },
    },
    { ...fixture(), stocks: [{ ...fixture().stocks[0], exchange: "FAKE" }] },
    { ...fixture(), stocks: [{ ...fixture().stocks[0], price: -10 }] },
    { ...fixture(), stocks: [{ ...fixture().stocks[0], debtToEquity: -1 }] },
    { ...fixture(), stocks: [{ ...fixture().stocks[0], momentumAsOf: null }] },
    {
      ...fixture(),
      stocks: [{ ...fixture().stocks[0], priceAsOf: "2099-01-01T00:00:00Z" }],
    },
  ])
    assert.equal(importSchema.safeParse(batch).success, false);
});
test("rejects duplicate symbols and undeclared payload fields", () => {
  const batch = fixture();
  batch.stocks.push(batch.stocks[0]);
  assert.equal(importSchema.safeParse(batch).success, false);
  assert.equal(
    importSchema.safeParse({ ...fixture(), apiKey: "must-not-store-secrets" })
      .success,
    false,
  );
});
test("omitted metrics normalize to null rather than zero", () => {
  const { roe, ...stock } = fixture().stocks[0];
  const parsed = importSchema.parse({ ...fixture(), stocks: [stock] });
  assert.equal(parsed.stocks[0].roe, null);
});
