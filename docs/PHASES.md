# AI Stock Intelligence — phạm vi và nghiệm thu

Ưu tiên: phân tích và sàng lọc cổ phiếu cho nhà đầu tư cá nhân tại Việt Nam.
Repository ban đầu chỉ có README. Không có mã ứng dụng hoặc chức năng cũ bị thay thế.

## Giai đoạn 1: nền tảng nghiên cứu đơn người dùng

Next.js App Router + React + TypeScript, API Node.js, Zod, SQLite tích hợp Node 24.
SQLite phù hợp môi trường local hiện tại, không cần tài khoản dịch vụ. PostgreSQL và xác thực là yêu cầu khi chuyển sang dịch vụ nhiều người dùng; không deploy bản local công khai.

Đã triển khai:

- Nhập JSON nguyên tử, tối đa 5 MB/5.000 mã, kiểm tra nguồn HTTPS, quyền sử dụng do người nhập xác nhận, đơn vị và cơ sở chỉ tiêu.
- Lưu snapshot theo mã, thời điểm giá, thời điểm nhập, nguồn và quy ước dữ liệu. Snapshot cũ được giữ lại; dashboard chọn thời điểm giá mới nhất.
- Dashboard của **tập dữ liệu nhập**; tìm mã/tên, lọc sàn và điểm tối thiểu. Không gọi đây là dashboard toàn thị trường.
- Bốn điểm chất lượng, định giá, tăng trưởng, động lượng. Công thức/ngưỡng được công khai. Không có điểm tổng nếu thiếu dữ liệu; loại dữ liệu cũ và doanh nghiệp tài chính khỏi xếp hạng.
- Top 10 trong tập dữ liệu đủ điều kiện. Chưa có Top 10 ngày/tháng/quý toàn thị trường.
- Báo cáo định lượng từng mã, P/E, P/B, thời điểm và cảnh báo; watchlist backend bền vững.
- Graham Number với EPS, BVPS và biên an toàn do người dùng đặt. Đây là giá tham chiếu giản lược, không phải DCF hay giá trị nội tại đầy đủ.
- Trạng thái thiếu dữ liệu, lỗi API và giao diện di động. Không seed giá, tài chính hoặc tin tức vào ứng dụng.

Tiêu chí nghiệm thu tự động:

1. Build production và TypeScript thành công.
2. Kiểm thử công thức, dữ liệu thiếu/âm/cũ, phạm vi ngành, nguồn và quyền sử dụng, trùng mã.
3. SQLite tồn tại qua tiến trình mới; nhập snapshot cũ không thay giá mới.
4. Trình duyệt: trạng thái rỗng → nhập JSON → tìm mã → điểm số → watchlist → tải lại → định giá.
5. API từ chối yêu cầu ghi khác Origin và dữ liệu sai; tệp sai không tạo snapshot.
6. Điều hướng di động hoạt động, không tràn ngang, không lỗi JavaScript trong luồng chính.

Dữ liệu tổng hợp trong `tests/fixtures.ts` **chỉ phục vụ kiểm thử**, dùng database `/tmp` riêng. Không phải dữ liệu cổ phiếu thật, không được dùng để trình diễn thị trường.

## Các giai đoạn tiếp theo và điều kiện đầu vào

| Giai đoạn                | Kết quả                                                                                              | Điều kiện nghiệm thu/đầu vào                                                                                                                                                      |
| ------------------------ | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2. Kết nối dữ liệu       | Universe HOSE/HNX/UPCoM, giá/chỉ số, OHLCV điều chỉnh, báo cáo tài chính, sự kiện doanh nghiệp       | Chọn nhà cung cấp, tài liệu API, quyền lưu trữ/hiển thị/tái phân phối; key server-only nếu cần. Đối soát mẫu với nguồn, kiểm tra đơn vị, phiên, timestamp, điều chỉnh và lịch sử. |
| 3. Mô hình đầu tư        | Bộ lọc Graham/Buffett/Fisher/Lynch/O’Neil; DCF, kịch bản, vùng mua/bán, chốt lời, stop/trailing stop | Dữ liệu giai đoạn 2 đủ. Công thức phiên bản hóa, mô hình riêng theo ngành, lý do thiếu dữ liệu, giả định có thời điểm. Kiểm thử định giá, corporate actions, xử lý rủi ro.        |
| 4. Tin tức và AI         | Tin doanh nghiệp/ngành/vĩ mô, tác động theo mã, nhận định có trích dẫn                               | Nguồn tin có quyền sử dụng; dịch vụ AI phía server, tách suy luận khỏi sự kiện, lưu thời điểm và nguồn. Đánh giá việc gán mã, trích dẫn và suy luận sai.                          |
| 5. Danh mục và cảnh báo  | Sổ giao dịch, giá vốn, lãi/lỗ thực hiện/chưa thực hiện, cảnh báo giá/điểm/tin/luận điểm              | Xác thực, PostgreSQL, cách tính phí/thuế/giá vốn, tác vụ nền và kênh nhận cảnh báo. Kiểm thử quyền truy cập và sổ giao dịch.                                                      |
| 6. Backtesting           | Chiến lược, benchmark và chi phí, chỉ số rủi ro, dữ liệu point-in-time                               | Lịch sử universe gồm cổ phiếu hủy niêm yết, thời điểm thông tin được công bố, điều chỉnh, phí, thanh khoản, quy tắc khớp lệnh/T+. Kiểm tra look-ahead và survivorship bias.       |
| 7. Báo cáo và triển khai | Báo cáo định kỳ, lịch sử phân tích, triển khai phù hợp                                               | Scheduler, snapshot mô hình/dữ liệu, phân quyền, backup, quan sát vận hành; Sites phải có công cụ hoạt động và hỗ trợ backend/lưu trữ cần thiết.                                  |

Chỉ bắt đầu giai đoạn kế tiếp khi tiêu chí hiện tại được kiểm tra. Không tuyên bố cả 13 chức năng hoàn thành ở giai đoạn 1.

## Yêu cầu bên ngoài còn thiếu

- Người dùng xác nhận chưa có nhà cung cấp dữ liệu. Chưa tải hoặc scrape dữ liệu thị trường để tránh giả định quyền sử dụng.
- Chưa có công cụ Sites trong phiên này; chưa tạo trang Sites hoặc URL xuất bản. Không cần yêu cầu API key cho Sites trong chat.
- Giai đoạn 1 không cần API key. Khi chọn nhà cung cấp, chỉ khai báo biến phía server và nhập giá trị qua cấu hình bảo mật.
- Chưa có tài khoản nhiều người dùng, pipeline tin tức/AI, lịch sử thị trường hoặc scheduler. Các chức năng phụ thuộc được ghi rõ là chưa triển khai.
