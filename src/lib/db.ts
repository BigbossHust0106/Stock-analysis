import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { ImportBatch, StockRecord } from "./schema";

let db: DatabaseSync | undefined;
function database() {
  if (!db) {
    const path = resolve(process.env.STOCK_DB_PATH || ".data/stocks.sqlite");
    mkdirSync(dirname(path), { recursive: true });
    db = new DatabaseSync(path);
    db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS snapshots (id INTEGER PRIMARY KEY, symbol TEXT NOT NULL, price_as_of TEXT NOT NULL, imported_at TEXT NOT NULL, payload TEXT NOT NULL);
      CREATE INDEX IF NOT EXISTS snapshot_symbol ON snapshots(symbol, price_as_of, id);
      CREATE TABLE IF NOT EXISTS watchlist (symbol TEXT PRIMARY KEY, created_at TEXT NOT NULL);`);
  }
  return db;
}
export function importStocks(batch: ImportBatch) {
  const connection = database();
  const importedAt = new Date().toISOString();
  const stmt = connection.prepare(
    "INSERT INTO snapshots(symbol, price_as_of, imported_at, payload) VALUES (?, ?, ?, ?)",
  );
  connection.exec("BEGIN IMMEDIATE");
  try {
    for (const stock of batch.stocks)
      stmt.run(
        stock.symbol,
        new Date(stock.priceAsOf).toISOString(),
        importedAt,
        JSON.stringify({
          ...stock,
          source: batch.source,
          conventions: batch.conventions,
          importedAt,
        }),
      );
    connection.exec("COMMIT");
  } catch (error) {
    connection.exec("ROLLBACK");
    throw error;
  }
  return batch.stocks.length;
}
export function listStocks(): StockRecord[] {
  return database()
    .prepare(
      `SELECT payload FROM (SELECT payload, ROW_NUMBER() OVER(PARTITION BY symbol ORDER BY price_as_of DESC, id DESC) AS rank FROM snapshots) WHERE rank = 1`,
    )
    .all()
    .map((row) => JSON.parse(String(row.payload)));
}
export function listWatchlist(): string[] {
  return database()
    .prepare("SELECT symbol FROM watchlist ORDER BY created_at DESC")
    .all()
    .map((row) => String(row.symbol));
}
export function setWatchlist(symbol: string, enabled: boolean) {
  if (enabled)
    database()
      .prepare("INSERT OR IGNORE INTO watchlist VALUES (?, ?)")
      .run(symbol, new Date().toISOString());
  else database().prepare("DELETE FROM watchlist WHERE symbol = ?").run(symbol);
}
