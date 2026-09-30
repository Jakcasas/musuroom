# Musuroom 1 — Website + Express + PostgreSQL/Supabase

Bản phát hành sản phẩm **Musuroom 1**, phiên bản mã nguồn `1.4.0`. Local vẫn chạy SQLite; cấu hình cloud Railway + Supabase sử dụng PostgreSQL và private Storage.

- [Triển khai Railway + Supabase, vùng Singapore và QR](docs/DEPLOY_RAILWAY_SUPABASE.md)
- [Đối chiếu kế hoạch và phần còn cần dữ liệu](docs/PLAN_REVIEW.md)
- [Tài liệu TypeSafe lưu cục bộ và quy ước tích hợp Jev](docs/typesafe-ai/README.md)

Website dự án bột gia vị từ phụ phẩm nấm ăn, gồm kho tri thức có trích dẫn, mô hình mẻ thử, API khảo sát cảm quan, đăng ký mẫu thử và AI tùy chọn.

## Mở trên máy này

Nhấp đúp **MO_MUSUROOM.cmd** rồi mở **http://127.0.0.1:8766/**.

Kho tri thức và trợ lý: **http://127.0.0.1:8766/tri-thuc.html**. Mở mục **Hỏi trợ lý Musuroom** ở đầu thư viện. Khi chưa bật AI, trợ lý trả về trích đoạn và nguồn từ database.

## Cổng giám khảo và trải nghiệm

- Giám khảo: **http://127.0.0.1:8766/giam-khao.html**. Mã truy cập riêng có thời hạn, cookie HttpOnly, phân quyền và CSRF.
- Khảo sát và đăng ký: **http://127.0.0.1:8766/trai-nghiem.html**.
- Minh bạch mẫu thử: **http://127.0.0.1:8766/minh-bach.html**.
- [Hướng dẫn cấp/thu hồi mã, thêm hồ sơ và bật Jev](docs/JUDGE_PORTAL.md). Tài khoản máy này được lưu riêng trong `data/`, không nằm trong mã nguồn.

## Cài trên máy mới

Yêu cầu **Node.js 24 trở lên**, pnpm hoặc npm.

```powershell
pnpm install --frozen-lockfile
node scripts/setup.mjs
node scripts/database.mjs
node server.mjs
```

Có thể dùng `npm install` nếu không dùng pnpm, nhưng lockfile của dự án là `pnpm-lock.yaml`. Node đi kèm Codex trên máy hiện tại đã có; script Windows tự tìm nếu PATH không có Node.

Setup tạo `.env` từ `.env.example`, sinh token ngẫu nhiên và giữ giá trị `.env` đã có và bổ sung biến mới còn thiếu. Database tự tạo tại `data/musuroom.sqlite`, chạy migration và nạp 6 bài khi khởi động. Không cần cài riêng máy chủ database. `node_modules`, database, log, PID và `.env` không đưa vào Git/ZIP mã nguồn.

Chạy nền bằng nút CMD hoặc `powershell -NoProfile -ExecutionPolicy Bypass -File .\start-musuroom.ps1`. Chạy terminal bằng `node server.mjs` và dừng bằng Ctrl+C. Nếu chạy nền, tìm PID trong `server.pid` rồi kết thúc đúng tiến trình đó trong Task Manager. Sau khi sửa `.env`, dừng server cũ rồi khởi động lại. Lỗi khởi động ghi trong `server-error.log`.

## Biến môi trường

| Biến | Mặc định | Mục đích |
|---|---|---|
| HOST | 127.0.0.1 | Chỉ mở trên máy này |
| PORT | 8766 | Cổng HTTP |
| DATABASE_PATH | ./data/musuroom.sqlite | Đường dẫn SQLite tính từ thư mục dự án |
| API_WRITE_TOKEN | Setup tự sinh | Bảo vệ API đọc/lưu mẻ; giữ riêng |
| AI_PROVIDER | disabled | `disabled` hoặc `openrouter` |
| OPENROUTER_API_KEY | Trống | Key provider, chỉ lưu phía server |
| AI_MODEL | Trống | Mã model cụ thể trong tài khoản OpenRouter |
| AI_TIMEOUT_MS | 20000 | Thời gian chờ AI, 1.000–60.000 ms |
| AI_MAX_TOKENS | 700 | Giới hạn output, 100–2.000 tokens |
| CHAT_REQUESTS_PER_MINUTE | 10 | Số câu hỏi/phút cho mỗi IP |

Các biến môi trường của tiến trình có ưu tiên hơn `.env`.

## API cảm quan và mẫu thử

- `POST /api/v1/sensory/submit`: gửi phiếu Hedonic 1–9 theo đợt và mã mẫu.
- `GET /api/v1/sensory/analytics`: Mean, median, độ lệch chuẩn mẫu, phân bố điểm và dữ liệu radar. Cần phiên giám khảo/quản trị hoặc bearer token, và bộ lọc đợt/mẫu.
- `POST /api/v1/sensory/export`: xuất CSV phiếu thô, cần phiên giám khảo/quản trị hoặc bearer token.
- `POST /api/v1/sensory/insights`: nhận xét số liệu tổng hợp; AI tùy chọn, cần phiên giám khảo/quản trị hoặc bearer token.
- `POST /api/v1/leads/register`: đăng ký quan tâm nhận mẫu thử, yêu cầu đồng ý lưu thông tin.
- `/api/v1/admin/leads`: danh sách/cập nhật/xóa đăng ký, cần quyền ADMIN hoặc bearer token.

Body, các giá trị hợp lệ, thuật toán và ví dụ request nằm trong [tài liệu API](docs/API.md). Form khảo sát và đăng ký đã tích hợp ở `trai-nghiem.html`. Dashboard bảo vệ bằng đăng nhập ở `giam-khao.html`, có biểu đồ radar, bảng thống kê, CSV và quản lý đăng ký theo quyền.

## Bật AI

Trong `.env` trên máy, đặt `AI_PROVIDER=openrouter`, điền `OPENROUTER_API_KEY` và `AI_MODEL` từ tài khoản của bạn, rồi khởi động lại. Không gửi API key vào chat hoặc đưa vào frontend/Git.

AI chỉ nhận câu hỏi và tối đa 3 bài liên quan từ kho tri thức. Giao diện thông báo việc gửi dữ liệu đến OpenRouter khi AI được bật. Không lưu hội thoại vào database. Khi lỗi hoặc thiếu trích dẫn hợp lệ, hệ thống chuyển sang trích nội dung nguồn. Đối chiếu câu trả lời với tài liệu gốc trước khi áp dụng. Luồng provider đã được kiểm tra bằng mock; chưa gọi AI thật vì chưa có key/model.

API nhận xét cảm quan chỉ gửi dữ liệu **tổng hợp** đến OpenRouter khi bật AI và có ít nhất 3 phiếu. Không gửi nhận xét thô, tên hoặc liên hệ. Trường `basis` luôn trả số liệu để đối chiếu.

## Tài liệu dự án

- [Kiến trúc, ERD và database](docs/ARCHITECTURE.md)
- [REST API và ví dụ request](docs/API.md)
- [Migration SQL](backend/db/migrations/002_sensory_samples.sql)
- [Migration tài khoản, phiên và hồ sơ](backend/db/migrations/003_judge_portal.sql)
- [Vận hành cổng giám khảo, cấp mã và Jev](docs/JUDGE_PORTAL.md)
- [Mẫu môi trường](.env.example)

Repository Git hiện tại được giữ nguyên; nhánh triển khai backend là `codex/musuroom-backend`. Không tự đẩy nguồn lên remote.

## Mẫu đo và số liệu công bố

`GET /api/v1/project/overview`, `/api/v1/product/batches`, `/api/v1/product/nutrition` đọc nội dung công bố. `POST /api/v1/admin/product-samples` cần ADMIN/CSRF và tài liệu FINAL. Có thể nhập JSON dữ liệu đo thực bằng `node scripts/add-sample.mjs data/ACTUAL_SAMPLE.json`; mặc định PRIVATE. Schema chỉ tiêu/phạm vi nằm trong `backend/routes/project.mjs`. Dinh dưỡng trên 100 g, không tự tạo đối chứng. Nếu chưa có hồ sơ đo, trang minh bạch hiển thị trạng thái chưa công bố.

## Kiểm tra

```powershell
node --test --test-isolation=none tests/*.test.mjs
```

Kiểm tra tìm kiếm tiếng Việt, nguồn, cân bằng vật chất, CSV, HTTP, migration/seed, lưu mẻ, xác thực, payload, origin, giới hạn chat và AI fallback bằng mock. Database kiểm thử backend dùng bộ nhớ hoặc thư mục tạm.

## Phạm vi nội dung

4 nguồn bên ngoài và 2 ghi chú phương pháp của Musuroom; không tự cập nhật từ Internet. Website chính thức của dự án không đồng nghĩa với sản phẩm thương mại đã kiểm nghiệm. Ảnh hero do AI tạo để minh họa ý tưởng. Mô hình tính bột nền là giả định trước phối trộn, không xác nhận an toàn hoặc mức giảm lãng phí thực tế.

Frontend có bản dữ liệu dự phòng để đọc khi API không sẵn sàng. Cập nhật bản ghi đã seed cần migration dữ liệu; seed không ghi đè dữ liệu có sẵn. Google Fonts và liên kết nguồn cần Internet; font hệ thống được dùng khi không tải được font.
