import test from "node:test";
import assert from "node:assert/strict";
import { mutationGuard, readJson } from "../src/lib/http";

test("same-origin accepts external Host when Next request URL uses localhost", () => {
  const request = new Request("http://localhost:3101/api/import", {
    method: "POST",
    headers: {
      Host: "127.0.0.1:3101",
      Origin: "http://127.0.0.1:3101",
      "Content-Type": "application/json",
    },
    body: "{}",
  });
  assert.equal(mutationGuard(request), undefined);
});
test("rejects absent, foreign, malformed origin and ignores forwarded-host spoofing", () => {
  for (const origin of ["", "https://elsewhere.example", "not-a-url"]) {
    const request = new Request("http://localhost:3101/api/import", {
      method: "POST",
      headers: {
        Host: "127.0.0.1:3101",
        Origin: origin,
        "X-Forwarded-Host": "elsewhere.example",
        "Content-Type": "application/json",
      },
      body: "{}",
    });
    assert.equal(mutationGuard(request)?.status, 403);
  }
});
test("requires JSON and parses body without changing content", async () => {
  const request = new Request("http://localhost:3101/api/import", {
    method: "POST",
    headers: {
      Host: "localhost:3101",
      Origin: "http://localhost:3101",
      "Content-Type": "text/plain",
    },
    body: "{}",
  });
  assert.equal(mutationGuard(request)?.status, 415);
  assert.deepEqual(
    await readJson(
      new Request("http://localhost/", {
        method: "POST",
        body: '{"stocks":[]}',
      }),
    ),
    { stocks: [] },
  );
});
test("rejects oversized request before JSON decoding", async () => {
  await assert.rejects(
    readJson(
      new Request("http://localhost/", {
        method: "POST",
        body: "x".repeat(5_000_001),
      }),
    ),
    /5 MB/,
  );
});
