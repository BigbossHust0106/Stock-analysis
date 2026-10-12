import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fixture } from "./fixtures";

test("SQLite persists watchlist and selects latest market timestamp, retaining history", async () => {
  process.env.STOCK_DB_PATH = join(
    mkdtempSync(join(tmpdir(), "ai-stock-db-test-")),
    "test.sqlite",
  );
  const { importStocks, listStocks, listWatchlist, setWatchlist } =
    await import("../src/lib/db");
  const batch = fixture();
  importStocks(batch);
  setWatchlist("TEST", true);
  setWatchlist("TEST", true);
  assert.deepEqual(listWatchlist(), ["TEST"]);
  importStocks({
    ...batch,
    stocks: [
      { ...batch.stocks[0], price: 1, priceAsOf: "2020-01-01T00:00:00Z" },
    ],
  });
  assert.equal(listStocks()[0].price, 10000);
  const child = spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--input-type=module",
      "-e",
      "import { listStocks, listWatchlist } from './src/lib/db.ts'; console.log(JSON.stringify({stocks:listStocks().length,watchlist:listWatchlist()}));",
    ],
    { encoding: "utf8", env: process.env },
  );
  assert.equal(child.status, 0, child.stderr);
  assert.deepEqual(JSON.parse(child.stdout), {
    stocks: 1,
    watchlist: ["TEST"],
  });
  setWatchlist("TEST", false);
  assert.deepEqual(listWatchlist(), []);
});
