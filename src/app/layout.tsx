import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "AI Stock Intelligence | Phân tích cổ phiếu Việt Nam",
  description:
    "Phân tích minh bạch, dữ liệu có nguồn gốc và watchlist cho cổ phiếu HOSE, HNX, UPCoM.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
