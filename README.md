# AI Stock Intelligence

Ứng dụng nghiên cứu cổ phiếu Việt Nam cho nhà đầu tư cá nhân. Giai đoạn 1: nhập dữ liệu có nguồn gốc, sàng lọc định lượng, báo cáo từng mã, Graham Number theo giả định và watchlist.

**Chưa có provider thị trường, tin tức hoặc nhận định AI. Không có dữ liệu thị trường giả.** Xem [phạm vi, nghiệm thu và lộ trình](docs/PHASES.md), [định dạng dữ liệu](docs/DATA_FORMAT.md).

## Chạy tại máy phát triển

Node 24 (đã kiểm tra 24.19.0), npm 11. Dependency được khóa trong package-lock.json.

```bash
cd /workspace/Stock-analysis
npm ci --cache /tmp/ai-stock-npm
npm run dev
```

Production local:

```bash
npm run build
npm run start
```

Server lắng nghe 127.0.0.1, cổng 3000. Dữ liệu SQLite tại `.data/stocks.sqlite` (ignored); tùy chọn `STOCK_DB_PATH` phía server. Snapshot và watchlist tồn tại khi restart. Không cần API key ở giai đoạn 1.

Đây là môi trường **đơn người dùng local, chưa có xác thực**. Origin guard giảm CSRF nhưng không thay thế đăng nhập/phân quyền. Chưa hỗ trợ triển khai nhiều người dùng hoặc public Internet. Cần xác thực, PostgreSQL/persistent storage phù hợp và kiểm tra hạ tầng trước khi triển khai. Không đưa secret vào frontend hoặc biến `NEXT_PUBLIC_*`.

## Kiểm tra

```bash
npm run typecheck
npm test
npm run build
bash scripts/smoke.sh
```

Smoke cần Chromium tại `/usr/bin/chromium` hoặc đường dẫn `CHROMIUM_PATH`. Playwright khởi động **server test riêng** trên cổng 3101, dùng SQLite mới trong `/tmp`, dừng server khi xong. Không dùng database ứng dụng hoặc seed dữ liệu trình diễn. Ảnh kiểm thử nằm trong `test-results/` (ignored).

## API hiện có

- `GET /api/stocks`: snapshot mới nhất từng mã, điểm số và watchlist; không cache.
- `POST /api/import`: JSON có nguồn, quyền sử dụng, quy ước dữ liệu; kiểm tra toàn bộ trước khi lưu trong transaction.
- `POST /api/watchlist`: thêm/xóa mã đã có dữ liệu, lưu bền vững.

Yêu cầu ghi dùng Content-Type JSON và Origin cùng Host. URL nguồn chỉ được lưu như metadata, không được server tự fetch. Nguồn/điều khoản nhập là khai báo của người dùng, chưa được xác minh độc lập.

## Lưu ý về phân tích

Điểm số phiên bản 0.1 là quy tắc sàng lọc công khai, chưa triển khai đầy đủ Graham/Buffett/Fisher/Lynch/O’Neil. Chỉ áp dụng mô hình hiện tại cho doanh nghiệp phi tài chính. Không có điểm tổng khi thiếu chỉ tiêu, giá/động lượng quá 7 ngày hoặc kỳ tài chính quá 550 ngày. Top 10 chỉ trong tập dữ liệu đã nhập, chưa đại diện toàn thị trường hoặc xếp hạng ngày/tháng/quý.

Graham Number = √(22,5 × EPS × BVPS); giá sau biên an toàn = Graham Number × (1 − margin/100). Đây là giá tham chiếu giản lược theo đầu vào người dùng, không phải giá mục tiêu hay định giá nội tại đầy đủ. EPS, BVPS phải dương; biên an toàn từ 0 đến dưới 100%. Không bảo đảm lợi nhuận.

Chưa có trang/URL Sites được xuất bản. Công cụ Sites không có trong phiên tạo giai đoạn 1.
