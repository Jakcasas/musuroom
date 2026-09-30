# Musuroom 1.1 — Website + Express API + SQLite

Website dự án bột gia vị từ phụ phẩm nấm ăn, gồm kho tri thức có trích dẫn, mô hình mẻ thử, backend và trợ lý tra cứu/AI tùy chọn.

## Mở trên máy này

Nhấp đúp **MO_MUSUROOM.cmd** rồi mở **http://127.0.0.1:8766/**.

Kho tri thức và trợ lý: **http://127.0.0.1:8766/tri-thuc.html**. Mở mục **Hỏi trợ lý Musuroom** ở đầu thư viện. Khi chưa bật AI, trợ lý trả về trích đoạn và nguồn từ database.

## Cài trên máy mới

Yêu cầu **Node.js 24 trở lên**, pnpm hoặc npm.

```powershell
pnpm install --frozen-lockfile
node scripts/setup.mjs
node scripts/database.mjs
node server.mjs
```

Có thể dùng `npm install` nếu không dùng pnpm, nhưng lockfile của dự án là `pnpm-lock.yaml`. Node đi kèm Codex trên máy hiện tại đã có; script Windows tự tìm nếu PATH không có Node.

Setup tạo `.env` từ `.env.example`, sinh token ngẫu nhiên và giữ nguyên `.env` đã có. Database tự tạo tại `data/musuroom.sqlite`, chạy migration và nạp 6 bài khi khởi động. Không cần cài riêng máy chủ database. `node_modules`, database, log, PID và `.env` không đưa vào Git/ZIP mã nguồn.

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
| CHAT_REQUESTS_PER_MINUTE | 10 | Số câu hỏi/phút trên server local |

Các biến môi trường của tiến trình có ưu tiên hơn `.env`.

## Bật AI

Trong `.env` trên máy, đặt `AI_PROVIDER=openrouter`, điền `OPENROUTER_API_KEY` và `AI_MODEL` từ tài khoản của bạn, rồi khởi động lại. Không gửi API key vào chat hoặc đưa vào frontend/Git.

AI chỉ nhận câu hỏi và tối đa 3 bài liên quan từ kho tri thức. Giao diện thông báo việc gửi dữ liệu đến OpenRouter khi AI được bật. Không lưu hội thoại vào database. Khi lỗi hoặc thiếu trích dẫn hợp lệ, hệ thống chuyển sang trích nội dung nguồn. Đối chiếu câu trả lời với tài liệu gốc trước khi áp dụng. Luồng provider đã được kiểm tra bằng mock; chưa gọi AI thật vì chưa có key/model.

## Tài liệu dự án

- [Kiến trúc, ERD và database](docs/ARCHITECTURE.md)
- [REST API và ví dụ request](docs/API.md)
- [Migration SQL](backend/db/migrations/001_initial.sql)
- [Mẫu môi trường](.env.example)

Repository Git hiện tại được giữ nguyên; nhánh triển khai backend là `codex/musuroom-backend`. Không tự đẩy nguồn lên remote.

## Kiểm tra

```powershell
node --test --test-isolation=none tests/*.test.mjs
```

Kiểm tra tìm kiếm tiếng Việt, nguồn, cân bằng vật chất, CSV, HTTP, migration/seed, lưu mẻ, xác thực, payload, origin, giới hạn chat và AI fallback bằng mock. Database kiểm thử backend dùng bộ nhớ hoặc thư mục tạm.

## Phạm vi nội dung

4 nguồn bên ngoài và 2 ghi chú phương pháp của Musuroom; không tự cập nhật từ Internet. Website chính thức của dự án không đồng nghĩa với sản phẩm thương mại đã kiểm nghiệm. Ảnh hero do AI tạo để minh họa ý tưởng. Mô hình tính bột nền là giả định trước phối trộn, không xác nhận an toàn hoặc mức giảm lãng phí thực tế.

Frontend có bản dữ liệu dự phòng để đọc khi API không sẵn sàng. Cập nhật bản ghi đã seed cần migration dữ liệu; seed không ghi đè dữ liệu có sẵn. Google Fonts và liên kết nguồn cần Internet; font hệ thống được dùng khi không tải được font.
