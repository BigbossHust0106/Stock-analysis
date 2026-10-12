import { test, expect } from "@playwright/test";
import { fixture } from "../fixtures";
test("empty state, real API validation, import, search, scoring, valuation and persistent watchlist", async ({
  page,
  request,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Bắt đầu từ dữ liệu đáng tin cậy" }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/desktop-empty.png",
    fullPage: true,
  });
  const crossOrigin = await request.post("/api/import", {
    data: fixture(),
    headers: { Origin: "https://elsewhere.example" },
  });
  expect(crossOrigin.status()).toBe(403);
  const invalid = await request.post("/api/import", {
    data: { ...fixture(), stocks: [{ ...fixture().stocks[0], price: -1 }] },
    headers: { Origin: "http://127.0.0.1:3101" },
  });
  expect(invalid.status()).toBe(422);
  expect((await (await request.get("/api/stocks")).json()).stocks).toHaveLength(
    0,
  );
  await page.getByRole("button", { name: "Nhập dữ liệu", exact: true }).click();
  await page
    .getByLabel("Nhập tệp dữ liệu JSON")
    .setInputFiles({
      name: "test-only.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(fixture())),
    });
  await expect(page.getByRole("status")).toContainText("Đã lưu 1 mã");
  await page.getByRole("button", { name: "Tổng quan", exact: true }).click();
  await page.getByLabel("Tìm mã cổ phiếu").fill("TEST");
  await expect(
    page.getByRole("button", { name: "TEST HOSE Synthetic test company" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Theo dõi TEST", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Bỏ theo dõi TEST" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Bỏ theo dõi TEST" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "TEST HOSE Synthetic test company" })
    .click();
  await expect(page.getByRole("dialog")).toContainText("Điểm tổng: 100/100");
  await page.getByLabel("EPS TTM (VND)").fill("2000");
  await page.getByLabel("BVPS (VND)").fill("10000");
  await page.getByLabel("Biên an toàn (%)").fill("25");
  await expect(page.locator(".valuation-result")).toContainText("21.213");
  await expect(page.locator(".valuation-result")).toContainText("15.910");
  await page.getByRole("button", { name: "Đóng báo cáo" }).click();
  await page.getByLabel("Tìm mã cổ phiếu").fill("UNKNOWN");
  await expect(
    page.getByRole("heading", { name: "Chưa có mã phù hợp" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("responsive layout has no horizontal overflow and navigation works", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Phương pháp phân tích", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Mỗi điểm số đều có lý do." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/mobile-methodology.png",
    fullPage: true,
  });
});
