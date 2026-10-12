# Định dạng dữ liệu nhập v1

API `POST /api/import` nhận JSON, `Content-Type: application/json`, Origin cùng ứng dụng.
Trong giao diện, tải khung JSON ở **Nguồn dữ liệu**. Khung không chứa cổ phiếu hoặc giá giả.

| Trường                                           | Quy tắc                                                                         |
| ------------------------------------------------ | ------------------------------------------------------------------------------- |
| `source.name`                                    | Tên nhà cung cấp hoặc tài liệu nguồn (2–200 ký tự)                              |
| `source.url`                                     | URL HTTPS của nguồn; ứng dụng lưu liên kết, không tự truy cập URL này           |
| `source.license`                                 | Mô tả căn cứ/quyền sử dụng dữ liệu (5–1.000 ký tự)                              |
| `source.rightsConfirmed`                         | `true` sau khi người nhập xác nhận quyền sử dụng; không phải chứng nhận độc lập |
| `conventions.currency`                           | `"VND"`; giá không theo đơn vị nghìn đồng                                       |
| `conventions.epsBasis`                           | `"TTM"`; EPS 12 tháng gần nhất                                                  |
| `conventions.growthBasis`                        | `"YoY_TTM"`; tăng trưởng TTM so với TTM cùng kỳ                                 |
| `conventions.pricesAndPerShareMetricsConsistent` | `true`: giá, EPS, BVPS cùng cơ sở số cổ phiếu/điều chỉnh                        |
| `conventions.return63dFromAdjustedPrices`        | `true`: lợi suất có dữ liệu dùng giá điều chỉnh; chỉ tiêu chưa có để null       |
| `stocks`                                         | Mảng 1–5.000 cổ phiếu, không trùng mã                                           |

Mỗi phần tử `stocks`:

| Trường                       | Kiểu/đơn vị                                                                        |
| ---------------------------- | ---------------------------------------------------------------------------------- |
| `symbol`                     | Mã viết hoa, 2–10 ký tự chữ/số, bắt đầu bằng chữ                                   |
| `name`                       | Tên doanh nghiệp                                                                   |
| `exchange`                   | `"HOSE"`, `"HNX"` hoặc `"UPCoM"`                                                   |
| `sector`                     | `"nonfinancial"` hoặc `"financial"`; ngân hàng/bảo hiểm/chứng khoán chọn financial |
| `price`                      | Số dương, VND/cổ phiếu                                                             |
| `priceAsOf`                  | Thời điểm giá ISO 8601 có múi giờ                                                  |
| `financialAsOf`              | Ngày kết thúc kỳ báo cáo tài chính ISO 8601 có múi giờ; chưa phải ngày công bố     |
| `roe`, `netMargin`           | Số %, dùng TTM; null nếu chưa có                                                   |
| `debtToEquity`               | Nợ vay/vốn chủ sở hữu, lần, không âm; nếu vốn chủ ≤ 0 hoặc không xác định thì null |
| `eps`, `bvps`                | VND/cổ phiếu; EPS TTM, BVPS cuối kỳ; null nếu chưa có                              |
| `revenueGrowth`, `epsGrowth` | % tăng trưởng TTM cùng kỳ; không dùng tăng trưởng EPS khi kỳ gốc ≤ 0, để null      |
| `return63d`                  | % lợi suất 63 phiên của giá điều chỉnh; null nếu chưa có                           |
| `momentumAsOf`               | ISO 8601 có múi giờ, bắt buộc khi có return63d                                     |

Tất cả số phải hữu hạn, không dùng chuỗi có dấu phân cách. Trường chỉ tiêu không có được chuẩn hóa thành null, không thành 0. Không nhập dữ liệu tương lai; API cho phép sai lệch đồng hồ tối đa một phút. Không nhập secret; trường ngoài schema bị từ chối.

Quy ước dữ liệu và quyền sử dụng là **khai báo của người nhập**, không được xác minh tự động. Điểm số không chứng minh dữ liệu chính xác. App không xác minh danh sách mã niêm yết khi chưa kết nối provider.

Giá/động lượng quá 7 ngày hoặc kỳ tài chính quá 550 ngày không được tính điểm tổng. Mỗi snapshot là một gói dữ liệu hoàn chỉnh; không ghép âm thầm các kỳ khác nhau. Nhập dữ liệu mới cần gửi lại các chỉ tiêu có giá trị. Lịch sử lưu ở SQLite; giao diện lịch sử phân tích là giai đoạn sau.

Không dùng định dạng hiện tại để backtest: cần thêm ngày công bố/khả dụng của từng trường và lịch sử điều chỉnh point-in-time ở giai đoạn dữ liệu.
