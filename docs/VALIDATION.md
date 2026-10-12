# Nghiệm thu giai đoạn 1

Kiểm tra ngày 12/10/2026. Phạm vi: ứng dụng nghiên cứu cục bộ, dữ liệu do người dùng nhập; chưa kết nối thị trường hoặc xuất bản Sites.

## Kết quả thực thi

| Kiểm tra | Kết quả |
| --- | --- |
| Cài lại `npm ci --cache /tmp/ai-stock-npm` | Thành công từ package-lock.json |
| `npm test` | 13 đạt, 0 lỗi, 0 bỏ qua |
| `npm run typecheck` | Thành công |
| `npm run build` | Build production thành công, 3 API route |
| `bash scripts/smoke.sh` | 2 Chromium test đạt, 0 lỗi/0 bỏ qua |
| `npm run start`, request `/` | HTTP 200, tên ứng dụng và trạng thái chưa có provider đúng |
| Request `/api/stocks` trên database ứng dụng | HTTP 200, stocks/watchlist trống, providerConnected=false |
| `git diff --check` | Không lỗi khoảng trắng |

Kiểm thử bao gồm phép tính, EPS âm, chỉ tiêu thiếu, dữ liệu cũ, nhóm ngành không hỗ trợ, quyền sử dụng/nguồn, mã trùng, Origin/content-type/body size, tính bền vững SQLite qua tiến trình mới và thứ tự snapshot. Chromium kiểm tra nhập qua giao diện, tìm kiếm, điểm số, watchlist sau reload, Graham Number, điều hướng và không tràn ngang trên màn hình di động. Có kiểm tra không xuất hiện lỗi JavaScript trong luồng desktop.

Hai lỗi được phát hiện và sửa trong quá trình nghiệm thu: đối chiếu Origin với hostname nội bộ của Next làm API từ chối tệp hợp lệ; nhãn nút nối mã với tên sàn khiến kiểm thử khả năng truy cập không nhận đúng. Kiểm tra lại cuối cùng đã đạt. Chưa phát hiện lỗi chưa giải quyết trong phạm vi trên; chưa xác minh các chức năng chưa triển khai.

## Tệp thay đổi

Sửa: `README.md`.

Tạo:

- Cấu hình: `.gitignore`, `.env.example`, `.node-version`, `package.json`, `package-lock.json`, `tsconfig.json`, `next-env.d.ts`, `next.config.ts`, `playwright.config.ts`.
- Giao diện: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `src/components/workspace.tsx`.
- Logic/backend: `src/lib/schema.ts`, `src/lib/analysis.ts`, `src/lib/db.ts`, `src/lib/http.ts`, `src/app/api/stocks/route.ts`, `src/app/api/import/route.ts`, `src/app/api/watchlist/route.ts`.
- Kiểm thử: `tests/analysis.test.ts`, `tests/db.test.ts`, `tests/http.test.ts`, `tests/fixtures.ts`, `tests/browser/workflow.spec.ts`, `scripts/smoke.sh`.
- Tài liệu: `docs/PHASES.md`, `docs/DATA_FORMAT.md`, `docs/VALIDATION.md`.

Đầu ra local bị ignore: node_modules, .next, .data (SQLite ứng dụng), test-results (ảnh và kết quả test). Dữ liệu kiểm thử tổng hợp được giữ trong database /tmp riêng; không seed database ứng dụng. Tại thời điểm nghiệm thu ban đầu, các thay đổi chưa được commit hoặc push.

## Cấu hình môi trường

Đã xác nhận lưu bản nháp `install_script` và `start_skill`. Script cài đặt dùng lockfile, Node 24 và kiểm tra giai đoạn 1; hướng dẫn khởi động dùng checkout hiện có, server loopback và HTTP readiness checks. Không thay danh sách repository, quyền mạng hoặc yêu cầu secret.

Cần xem lại và lưu thay đổi trong environment settings rồi Publish để kích hoạt phiên bản môi trường tái sử dụng. Việc lưu nháp không thực thi script, không xuất bản môi trường và không xuất bản ứng dụng qua Sites. Chưa xác minh khôi phục trong task mới.

## Giới hạn còn lại

- Chưa có provider và quyền sử dụng/tái phân phối dữ liệu được xác minh. Không có giá/chỉ số toàn thị trường, OHLCV hay báo cáo tài chính tự động.
- Chưa có công cụ Sites trong phiên; không có trang hoặc URL Sites mới.
- Mô hình hiện tại là bộ quy tắc sơ bộ, không đại diện đầy đủ năm trường phái. Top 10 chỉ trong dữ liệu nhập; Graham Number là giá tham chiếu, chưa phải định giá đầy đủ.
- Chưa có AI/tin tức, giao dịch danh mục, vùng bán/stop, cảnh báo, backtesting hoặc báo cáo định kỳ. Lộ trình và tiêu chí cụ thể ở PHASES.md.
- Chưa có xác thực và lưu trữ nhiều người dùng. Phiên bản này chỉ chạy cục bộ, không công bố như dịch vụ tài chính public.

Giai đoạn 1 đã được kiểm tra. Giai đoạn 2 cần nhà cung cấp có tài liệu API và quyền sử dụng phù hợp; API key (nếu có) phải nhập qua cấu hình bảo mật phía server, không qua chat hoặc frontend.
