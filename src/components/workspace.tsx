"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowDownToLine,
  ArrowRight,
  BarChart3,
  BookOpen,
  Check,
  ChevronRight,
  Database,
  FileText,
  LayoutDashboard,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  Upload,
  X,
} from "lucide-react";
import { analyze, grahamValue, methodology } from "@/lib/analysis";
import type { StockRecord } from "@/lib/schema";

type Row = StockRecord & { analysis: ReturnType<typeof analyze> };
type View = "overview" | "watchlist" | "data" | "methodology";
const money = (v: number) =>
  new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(v);
const time = (v: string) =>
  new Date(v).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
const score = (v: number | null) => (v === null ? "—" : `${v}`);
const template = {
  source: { name: "", url: "", license: "", rightsConfirmed: false },
  conventions: {
    currency: "VND",
    epsBasis: "TTM",
    growthBasis: "YoY_TTM",
    pricesAndPerShareMetricsConsistent: false,
    return63dFromAdjustedPrices: false,
  },
  stocks: [],
};

export default function Workspace() {
  const [view, setView] = useState<View>("overview");
  const [stocks, setStocks] = useState<Row[]>([]);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [exchange, setExchange] = useState("all");
  const [minScore, setMinScore] = useState("all");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<Row | null>(null);
  const reportRef = useRef<HTMLElement>(null);
  const [valuation, setValuation] = useState({ eps: "", bvps: "", margin: "" });

  async function refresh() {
    try {
      const response = await fetch("/api/stocks", { cache: "no-store" });
      if (!response.ok)
        throw new Error("Không tải được dữ liệu. Kiểm tra backend và thử lại.");
      const data = await response.json();
      setStocks(data.stocks);
      setWatchlist(data.watchlist);
      setGeneratedAt(data.generatedAt);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi kết nối.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void refresh();
  }, []);
  useEffect(() => {
    if (!selected) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    reportRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    function keydown(event: KeyboardEvent) {
      if (event.key === "Escape") setSelected(null);
      if (event.key !== "Tab") return;
      const focusable = reportRef.current?.querySelectorAll<HTMLElement>(
        "button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled)",
      );
      if (!focusable?.length) return;
      const first = focusable[0],
        last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", keydown);
    return () => {
      document.removeEventListener("keydown", keydown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [selected]);
  const eligible = stocks.filter((s) => s.analysis.total !== null);
  const filtered = useMemo(
    () =>
      stocks
        .filter(
          (s) =>
            (view !== "watchlist" || watchlist.includes(s.symbol)) &&
            (exchange === "all" || s.exchange === exchange) &&
            (s.symbol.includes(query.trim().toUpperCase()) ||
              s.name
                .toLocaleLowerCase("vi")
                .includes(query.trim().toLocaleLowerCase("vi"))) &&
            (minScore === "all" ||
              (s.analysis.total !== null &&
                s.analysis.total >= Number(minScore))),
        )
        .sort((a, b) => (b.analysis.total ?? -1) - (a.analysis.total ?? -1)),
    [stocks, watchlist, view, exchange, query, minScore],
  );
  const top = [...eligible]
    .sort((a, b) => b.analysis.total! - a.analysis.total!)
    .slice(0, 10);
  let graham: ReturnType<typeof grahamValue> | null = null;
  const valuationCalculatedAt = new Date().toISOString();
  if (Object.values(valuation).every((v) => v.trim())) {
    try {
      graham = grahamValue(
        Number(valuation.eps),
        Number(valuation.bvps),
        Number(valuation.margin),
      );
    } catch {
      /* validation shown below */
    }
  }

  async function toggle(symbol: string) {
    setError("");
    setBusy(true);
    try {
      const response = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol, enabled: !watchlist.includes(symbol) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không lưu được watchlist.");
    } finally {
      setBusy(false);
    }
  }
  async function upload(file: File | undefined) {
    if (!file) return;
    setError("");
    setMessage("");
    setBusy(true);
    try {
      if (file.size > 5_000_000) throw new Error("Tệp vượt quá 5 MB.");
      const content = await file.text();
      JSON.parse(content);
      const response = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: content,
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          [
            data.error,
            ...(data.issues ?? [])
              .slice(0, 5)
              .map(
                (i: { path: string; message: string }) =>
                  `${i.path}: ${i.message}`,
              ),
          ].join(" "),
        );
      setMessage(
        `Đã lưu ${data.imported} mã. Nguồn do người dùng khai báo, chưa xác minh độc lập.`,
      );
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không nhập được dữ liệu.");
    } finally {
      setBusy(false);
    }
  }
  function downloadTemplate() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(template, null, 2)], {
        type: "application/json",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "stock-import-template.json";
    a.click();
    URL.revokeObjectURL(url);
  }
  const navigation = [
    { id: "overview", icon: LayoutDashboard, text: "Tổng quan" },
    { id: "watchlist", icon: Star, text: "Danh sách theo dõi" },
    { id: "data", icon: Database, text: "Nguồn dữ liệu" },
    { id: "methodology", icon: BookOpen, text: "Phương pháp phân tích" },
  ] as const;

  return (
    <div className="shell">
      <aside className="sidebar">
        <a className="brand" href="/">
          <div className="brand-icon">
            <Activity size={23} />
          </div>
          <div>
            AI STOCK<span>INTELLIGENCE</span>
          </div>
        </a>
        <div className="workspace-label">KHÔNG GIAN PHÂN TÍCH</div>
        <nav>
          {navigation.map((n) => (
            <button
              key={n.id}
              className={view === n.id ? "nav active" : "nav"}
              onClick={() => {
                setView(n.id);
                setQuery("");
              }}
            >
              <n.icon size={18} />
              {n.text}
              {n.id === "watchlist" && (
                <span className="count">{watchlist.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="workspace-label later-label">LỘ TRÌNH TIẾP THEO</div>
        <div className="future-nav">
          <FileText size={17} />
          Tin tức & nhận định<span>Sắp tới</span>
        </div>
        <div className="future-nav">
          <BarChart3 size={17} />
          Danh mục & backtest<span>Sắp tới</span>
        </div>
        <div className="sidebar-bottom">
          <ShieldCheck size={22} />
          <strong>Minh bạch từ dữ liệu</strong>
          <p>Nguồn, công thức và giả định được trình bày riêng biệt.</p>
          <span className="version">GIAI ĐOẠN 01 · LOCAL</span>
        </div>
      </aside>
      <main>
        <header className="topbar">
          <span>
            Thị trường Việt Nam <ChevronRight size={14} /> Không gian nghiên cứu
          </span>
          <div className="local-status">
            <i /> Dữ liệu nhập thủ công
          </div>
        </header>
        <div className="content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">RESEARCH, WITH CONVICTION.</div>
              <h1>
                {view === "overview"
                  ? "Hiểu doanh nghiệp. Đầu tư có cơ sở."
                  : view === "watchlist"
                    ? "Danh sách theo dõi"
                    : view === "data"
                      ? "Dữ liệu là điểm khởi đầu."
                      : "Mỗi điểm số đều có lý do."}
              </h1>
              <p>
                {view === "overview"
                  ? "Phân tích và sàng lọc cổ phiếu HOSE, HNX, UPCoM trong một không gian minh bạch."
                  : view === "watchlist"
                    ? "Lưu các mã cần nghiên cứu. Watchlist được lưu bền vững trên backend."
                    : view === "data"
                      ? "Chỉ nhập dữ liệu có nguồn gốc và quyền sử dụng phù hợp."
                      : "Quy tắc định lượng phiên bản 0.1. Chưa sử dụng AI để đưa ra nhận định."}
              </p>
            </div>
            <button className="primary" onClick={() => setView("data")}>
              <Upload size={16} />
              Nhập dữ liệu
            </button>
          </div>
          {error && (
            <div className="notice error" role="alert">
              {error}
              <button onClick={() => setError("")} aria-label="Đóng thông báo">
                <X size={16} />
              </button>
            </div>
          )}
          {message && (
            <div className="notice success" role="status">
              <Check size={17} />
              {message}
            </div>
          )}

          {(view === "overview" || view === "watchlist") && (
            <>
              <div className="source-banner">
                <div className="source-icon">
                  <Database size={21} />
                </div>
                <div>
                  <strong>Chưa kết nối nhà cung cấp dữ liệu</strong>
                  <p>
                    Chưa có giá thời gian thực hoặc chỉ số toàn thị trường. Phân
                    tích chỉ dựa trên dữ liệu bạn nhập.
                  </p>
                </div>
                <button onClick={() => setView("data")}>
                  Quản lý nguồn <ArrowRight size={16} />
                </button>
              </div>
              <div className="metrics">
                <Metric
                  label="MÃ CÓ DỮ LIỆU"
                  value={String(stocks.length)}
                  note="Trong tập dữ liệu đã nhập"
                  icon={<Database size={18} />}
                />
                <Metric
                  label="ĐỦ ĐIỀU KIỆN XẾP HẠNG"
                  value={String(eligible.length)}
                  note="Đủ 4 điểm số, dữ liệu còn hạn"
                  icon={<BarChart3 size={18} />}
                />
                <Metric
                  label="ĐANG THEO DÕI"
                  value={String(watchlist.length)}
                  note="Danh sách nghiên cứu cá nhân"
                  icon={<Star size={18} />}
                />
                <Metric
                  label="KẾT NỐI THỊ TRƯỜNG"
                  value="Chưa có"
                  note="HOSE · HNX · UPCoM"
                  icon={<Activity size={18} />}
                />
              </div>
              <div className="overview-grid">
                <section className="panel stock-panel">
                  <div className="panel-title">
                    <div>
                      <h2>
                        {view === "watchlist"
                          ? "Watchlist của bạn"
                          : "Khám phá cổ phiếu"}
                      </h2>
                      <p>
                        Giá hiển thị theo VND/cổ phiếu · thời điểm do nguồn khai
                        báo
                      </p>
                    </div>
                    <span className="pill">{filtered.length} mã</span>
                  </div>
                  <div className="filters">
                    <label className="search">
                      <Search size={17} />
                      <input
                        aria-label="Tìm mã cổ phiếu"
                        placeholder="Tìm mã hoặc tên doanh nghiệp..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                    </label>
                    <select
                      aria-label="Sàn giao dịch"
                      value={exchange}
                      onChange={(e) => setExchange(e.target.value)}
                    >
                      <option value="all">Tất cả sàn</option>
                      {["HOSE", "HNX", "UPCoM"].map((e) => (
                        <option key={e}>{e}</option>
                      ))}
                    </select>
                    <select
                      aria-label="Điểm tối thiểu"
                      value={minScore}
                      onChange={(e) => setMinScore(e.target.value)}
                    >
                      <option value="all">Mọi điểm số</option>
                      <option value="60">Điểm ≥ 60</option>
                      <option value="80">Điểm ≥ 80</option>
                    </select>
                  </div>
                  {loading ? (
                    <div className="empty">Đang tải dữ liệu...</div>
                  ) : filtered.length ? (
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Doanh nghiệp</th>
                            <th>Giá / thời điểm</th>
                            <th>Điểm /100</th>
                            <th>Theo dõi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map((s) => (
                            <tr key={s.symbol}>
                              <td>
                                <button
                                  className="stock-name"
                                  onClick={() => {
                                    setSelected(s);
                                    setValuation({
                                      eps: "",
                                      bvps: "",
                                      margin: "",
                                    });
                                  }}
                                >
                                  <strong>
                                    {s.symbol} <small>{s.exchange}</small>
                                  </strong>
                                  <span>{s.name}</span>
                                </button>
                              </td>
                              <td>
                                {money(s.price)} ₫
                                <small>{time(s.priceAsOf)}</small>
                              </td>
                              <td>
                                <span className="score">
                                  {score(s.analysis.total)}
                                </span>
                              </td>
                              <td>
                                <button
                                  className={
                                    watchlist.includes(s.symbol)
                                      ? "star saved"
                                      : "star"
                                  }
                                  disabled={busy}
                                  onClick={() => toggle(s.symbol)}
                                  aria-label={`${watchlist.includes(s.symbol) ? "Bỏ theo dõi" : "Theo dõi"} ${s.symbol}`}
                                >
                                  <Star size={18} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="empty">
                      <div className="empty-graphic">
                        <BarChart3 size={38} />
                        <span />
                        <span />
                        <span />
                      </div>
                      <h3>
                        {stocks.length
                          ? "Chưa có mã phù hợp"
                          : "Bắt đầu từ dữ liệu đáng tin cậy"}
                      </h3>
                      <p>
                        {stocks.length
                          ? "Thử đổi bộ lọc hoặc thêm mã vào watchlist."
                          : "Nhập dữ liệu có nguồn để xem giá, điểm số và báo cáo định lượng. Chúng tôi không tạo dữ liệu thị trường giả."}
                      </p>
                      <button
                        className="secondary"
                        onClick={() => setView("data")}
                      >
                        {stocks.length
                          ? "Quản lý dữ liệu"
                          : "Thiết lập nguồn dữ liệu"}
                        <ArrowRight size={15} />
                      </button>
                    </div>
                  )}
                  <div className="panel-footer">
                    <ShieldCheck size={15} />
                    Nguồn nhập chưa được xác minh độc lập. Điểm số là công cụ
                    sàng lọc.
                  </div>
                </section>
                <section className="panel ranking">
                  <div className="panel-title">
                    <div>
                      <div className="eyebrow gold">QUANTITATIVE SCREEN</div>
                      <h2>Top 10 trong dữ liệu nhập</h2>
                    </div>
                    <Sparkles size={20} />
                  </div>
                  <p className="ranking-sub">
                    Điểm tổng = trung bình đều 4 trụ cột. Không đại diện cho
                    toàn thị trường.
                  </p>
                  {top.length ? (
                    top.map((s, i) => (
                      <button
                        className="rank-row"
                        key={s.symbol}
                        onClick={() => {
                          setSelected(s);
                          setValuation({ eps: "", bvps: "", margin: "" });
                        }}
                      >
                        <span>{String(i + 1).padStart(2, "0")}</span>
                        <strong>
                          {s.symbol} <small>{s.exchange}</small>
                        </strong>
                        <b>{s.analysis.total}</b>
                      </button>
                    ))
                  ) : (
                    <div className="ranking-empty">
                      <SlidersHorizontal size={30} />
                      <strong>Chưa có xếp hạng</strong>
                      <p>
                        Cần đủ dữ liệu chất lượng, định giá, tăng trưởng và động
                        lượng.
                      </p>
                    </div>
                  )}
                  <div className="ranking-bottom">
                    Xếp hạng ngày / tháng / quý cần lịch sử và phạm vi thị
                    trường được kiểm chứng.
                  </div>
                </section>
              </div>
              <div className="principle">
                <span>01 / NGUYÊN TẮC NGHIÊN CỨU</span>
                <p>“Giá là thứ bạn trả. Giá trị là thứ bạn nhận.”</p>
                <div>
                  Đọc nguồn dữ liệu, kiểm tra giả định và xác định rủi ro trước
                  mỗi quyết định.
                </div>
              </div>
            </>
          )}

          {view === "data" && (
            <div className="data-grid">
              <section className="panel import-panel">
                <div className="panel-title">
                  <h2>Nhập dữ liệu có nguồn</h2>
                  <span className="pill">JSON · ≤ 5 MB</span>
                </div>
                <p>
                  Giai đoạn 1 tiếp nhận dữ liệu do bạn cung cấp. Chưa có kết nối
                  tự động hoặc xác minh bản quyền với nhà cung cấp.
                </p>
                <label className="upload-zone">
                  <Upload size={34} />
                  <strong>
                    {busy ? "Đang nhập dữ liệu..." : "Chọn tệp JSON để nhập"}
                  </strong>
                  <span>Tối đa 5.000 mã · chỉ ghi khi toàn bộ tệp hợp lệ</span>
                  <input
                    aria-label="Nhập tệp dữ liệu JSON"
                    disabled={busy}
                    type="file"
                    accept=".json,application/json"
                    onChange={(e) => {
                      void upload(e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                </label>
                <button className="secondary" onClick={downloadTemplate}>
                  <ArrowDownToLine size={16} />
                  Tải khung JSON trống
                </button>
                <h3>Thông tin bắt buộc</h3>
                <ul className="requirements">
                  <li>
                    Tên nguồn, URL HTTPS, mô tả quyền sử dụng và xác nhận{" "}
                    <code>rightsConfirmed: true</code>.
                  </li>
                  <li>
                    Xác nhận conventions: VND, EPS TTM, tăng trưởng YoY_TTM, chỉ
                    tiêu trên cùng cơ sở điều chỉnh và lợi suất từ giá điều
                    chỉnh.
                  </li>
                  <li>
                    Mã, tên, sàn, nhóm ngành; giá theo VND/cổ phiếu; thời điểm
                    giá và kỳ tài chính.
                  </li>
                  <li>
                    Chỉ tiêu thiếu để <code>null</code>. Không điền 0 để thay
                    cho dữ liệu chưa có.
                  </li>
                  <li>
                    Không nhập API key hoặc thông tin bí mật. Tệp nguồn lưu
                    trong backend.
                  </li>
                </ul>
                <p className="muted">
                  Nhập lại giữ lịch sử snapshot. Dashboard chọn snapshot có thời
                  điểm giá mới nhất; nếu trùng, chọn lần nhập cuối.
                </p>
              </section>
              <section className="panel schema-panel">
                <h2>Cấu trúc mỗi cổ phiếu</h2>
                <dl>
                  {[
                    ["symbol / name", "Mã viết hoa / tên doanh nghiệp"],
                    ["exchange", "HOSE | HNX | UPCoM"],
                    ["sector", "nonfinancial | financial"],
                    ["price", "VND/cổ phiếu, số dương"],
                    [
                      "priceAsOf / financialAsOf",
                      "ISO 8601 có múi giờ, không ở tương lai",
                    ],
                    ["roe / netMargin", "ROE / biên lợi nhuận ròng (%)"],
                    ["debtToEquity", "Nợ vay / vốn chủ sở hữu (lần, ≥ 0)"],
                    ["eps / bvps", "EPS TTM / giá trị sổ sách (VND/cổ phiếu)"],
                    [
                      "revenueGrowth / epsGrowth",
                      "Tăng trưởng TTM so với TTM cùng kỳ (%)",
                    ],
                    [
                      "return63d / momentumAsOf",
                      "Lợi suất 63 phiên (%) từ giá điều chỉnh / thời điểm",
                    ],
                  ].map(([a, b]) => (
                    <div key={a}>
                      <dt>{a}</dt>
                      <dd>{b}</dd>
                    </div>
                  ))}
                </dl>
                <p className="notice">
                  Dùng số thực, không chuỗi có dấu phân cách hàng nghìn. Giá,
                  EPS và BVPS phải cùng đơn vị và cùng cơ sở điều chỉnh.
                </p>
              </section>
            </div>
          )}

          {view === "methodology" && (
            <>
              <section className="panel method-intro">
                <ShieldCheck size={26} />
                <div>
                  <h2>Quy tắc định lượng, không phải khuyến nghị đầu tư</h2>
                  <p>
                    clamp(x) = min(1, max(0, x)). Điểm tổng là trung bình đều 4
                    điểm, chỉ tính khi đầy đủ. Giá và động lượng phải trong 7
                    ngày; kỳ tài chính trong 550 ngày. Ngưỡng này là chính sách
                    ứng dụng, có thể thay đổi ở phiên bản sau.
                  </p>
                </div>
              </section>
              <div className="method-grid">
                {methodology.map((m, i) => (
                  <section className="panel method-card" key={m.key}>
                    <span className="step">0{i + 1}</span>
                    <h2>{m.name}</h2>
                    <code>{m.formula}</code>
                    <p>{m.required}</p>
                  </section>
                ))}
              </div>
              <section className="panel roadmap">
                <h2>Năm góc nhìn đầu tư · lộ trình giai đoạn sau</h2>
                <p>
                  Graham: biên an toàn và tài sản. Buffett: lợi thế cạnh tranh
                  và chất lượng dòng tiền. Fisher: tăng trưởng và quản trị.
                  Lynch: tăng trưởng gắn với mức giá. O’Neil: CAN SLIM và xu
                  hướng giá/khối lượng.
                </p>
                <p>
                  Chưa có bộ lọc hoàn chỉnh cho năm trường phái. Cần dữ liệu
                  lịch sử, ngành, dòng tiền, lợi thế cạnh tranh và điều chỉnh sự
                  kiện doanh nghiệp. Mô hình hiện tại không áp dụng cho doanh
                  nghiệp tài chính.
                </p>
              </section>
            </>
          )}
          <footer>
            AI Stock Intelligence{" "}
            <span>Phân biệt dữ liệu · phép tính · giả định · nhận định</span>
            <span>Không bảo đảm lợi nhuận.</span>
          </footer>
        </div>
      </main>
      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <section
            ref={reportRef}
            className="report"
            role="dialog"
            aria-modal="true"
            aria-label={`Phân tích ${selected.symbol}`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close"
              onClick={() => setSelected(null)}
              aria-label="Đóng báo cáo"
            >
              <X />
            </button>
            <div className="eyebrow">BÁO CÁO ĐỊNH LƯỢNG · V0.1</div>
            <h1>
              {selected.symbol}{" "}
              <span className="pill">{selected.exchange}</span>
            </h1>
            <p>{selected.name}</p>
            <div className="report-price">
              {money(selected.price)} ₫
              <small>Dữ liệu nhập · {time(selected.priceAsOf)}</small>
            </div>
            <div className="notice">
              Nguồn do người dùng cung cấp, chưa xác minh độc lập:{" "}
              <a
                href={selected.source.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {selected.source.name}
              </a>
              . Quyền sử dụng khai báo: {selected.source.license}
            </div>
            <p className="muted">
              Kỳ tài chính: {time(selected.financialAsOf)} · nhập lúc{" "}
              {time(selected.importedAt)}
            </p>
            <h2>Phép tính định lượng</h2>
            {generatedAt && (
              <p className="muted">
                Điểm tính lúc {time(generatedAt)} · mô hình v0.1 · làm tròn đến
                số nguyên.
              </p>
            )}
            <div className="report-scores">
              {methodology.map((m) => (
                <div key={m.key}>
                  <span>{m.name}</span>
                  <strong>
                    {score(
                      selected.analysis.scores[
                        m.key as keyof typeof selected.analysis.scores
                      ],
                    )}
                    <small>/100</small>
                  </strong>
                </div>
              ))}
            </div>
            <p>
              P/E: {selected.analysis.pe?.toFixed(2) ?? "Không đủ điều kiện"} ·
              P/B: {selected.analysis.pb?.toFixed(2) ?? "Không đủ điều kiện"} ·
              Điểm tổng: {score(selected.analysis.total)}/100.
            </p>
            {selected.analysis.warnings.map((w) => (
              <p className="warning" key={w}>
                {w}
              </p>
            ))}
            <button
              className="secondary"
              onClick={() => {
                setSelected(null);
                setView("methodology");
              }}
            >
              Xem công thức và ngưỡng <ArrowRight size={14} />
            </button>
            <h2 className="valuation-heading">
              Graham Number · giả định của bạn
            </h2>
            <p>
              Giá tham chiếu = √(22,5 × EPS × BVPS). Công thức giản lược cho
              doanh nghiệp phi tài chính ổn định, chưa đánh giá tăng trưởng,
              dòng tiền hay lợi thế cạnh tranh; không phải giá trị nội tại đầy
              đủ.
            </p>
            {selected.sector === "financial" ? (
              <p className="warning">
                Chưa hỗ trợ công thức này cho doanh nghiệp tài chính.
              </p>
            ) : (
              <>
                <div className="valuation-inputs">
                  {(
                    [
                      ["eps", "EPS TTM (VND)"],
                      ["bvps", "BVPS (VND)"],
                      ["margin", "Biên an toàn (%)"],
                    ] as const
                  ).map(([key, label]) => (
                    <label key={key}>
                      {label}
                      <input
                        type="number"
                        step="any"
                        min="0"
                        aria-label={label}
                        value={valuation[key]}
                        onChange={(e) =>
                          setValuation({ ...valuation, [key]: e.target.value })
                        }
                      />
                    </label>
                  ))}
                </div>
                {graham ? (
                  <div className="valuation-result">
                    <div>
                      Giá tham chiếu
                      <strong>{money(graham.referenceValue)} ₫</strong>
                    </div>
                    <div>
                      Giá sau biên an toàn
                      <strong>{money(graham.buyCeiling)} ₫</strong>
                    </div>
                    <p>
                      Đầu vào do bạn đặt trong phiên này, không được xác minh
                      hoặc lưu thành khuyến nghị. Thời điểm phép tính:{" "}
                      {time(valuationCalculatedAt)}.
                    </p>
                  </div>
                ) : (
                  <p className="muted">
                    Nhập EPS và BVPS dương; biên an toàn từ 0 đến dưới 100% để
                    tính.
                  </p>
                )}
              </>
            )}
            <div className="notice">
              Nhận định AI, vùng bán, cắt lỗ và giá mục tiêu chưa được triển
              khai. Báo cáo này phục vụ nghiên cứu, không bảo đảm kết quả đầu
              tư.
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
function Metric({
  label,
  value,
  note,
  icon,
}: {
  label: string;
  value: string;
  note: string;
  icon: React.ReactNode;
}) {
  return (
    <section className="metric">
      <div>
        {label}
        {icon}
      </div>
      <strong>{value}</strong>
      <p>{note}</p>
    </section>
  );
}
