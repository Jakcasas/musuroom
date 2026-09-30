# Kiến trúc Musuroom 1.3

## Luồng ứng dụng

```mermaid
flowchart LR
  UI[Website Musuroom] --> API[Express API]
  API --> DB[(SQLite)]
  API --> S[Sensory Metrics]
  S --> DB
  API --> R[Chọn bài liên quan]
  R --> E[Trích đoạn có nguồn]
  R -. Khi bật AI .-> AI[OpenRouter]
  AI --> V[Kiểm tra số trích dẫn]
  V --> UI
  E --> UI
```

Frontend vẫn chạy bằng HTML/CSS/JavaScript. Kho tri thức tải dữ liệu từ `/api/knowledge`; nếu API không sẵn sàng, dùng bản dữ liệu đi kèm và hiển thị trạng thái. Tìm kiếm hiện chạy trên tập bài đã tải, chuẩn hóa tiếng Việt có/không dấu. API cũng hỗ trợ `q` và `category` để các ứng dụng khác sử dụng.

## Cấu trúc thư mục

```text
backend/
  app.mjs                  Express, middleware, REST routes
  config.mjs               Kiểm tra và ánh xạ biến môi trường
  db/database.mjs          Kết nối, migration và seed
  db/migrations/*.sql      Schema SQL có phiên bản
  repositories/            Đọc/ghi SQLite bằng prepared statement
  services/assistant.mjs   Truy xuất tài liệu và AI tùy chọn
  security/auth.mjs        Mã scrypt, cookie phiên và phân quyền
  routes/judge.mjs         Hồ sơ riêng tư và Jev có đồng ý
dist/                      Website và tài nguyên static
scripts/                   Tạo .env, migrate/seed database
tests/                     Kiểm tra logic, HTTP, database và AI mock
data/                      SQLite runtime, không đưa vào Git
.env                       Cấu hình riêng, không đưa vào Git
.env.example               Mẫu cấu hình có thể chia sẻ
```

## Database

```mermaid
erDiagram
  sources ||--o{ knowledge_articles : supports
  sources {
    INTEGER id PK
    TEXT citation
    TEXT url
    INTEGER publication_year
    TEXT evidence_type
    TEXT access_scope
    TEXT reviewed_at
  }
  knowledge_articles {
    TEXT id PK
    INTEGER source_id FK
    TEXT title
    TEXT category
    TEXT summary
    TEXT body
    TEXT application
    TEXT limitation
    TEXT tags_json
    TEXT created_at
    TEXT updated_at
  }
  batches {
    TEXT id PK
    TEXT name
    REAL mass_kg
    REAL reject_percent
    REAL initial_moisture_percent
    REAL final_moisture_percent
    REAL loss_percent
    REAL accepted_kg
    REAL powder_kg
    REAL yield_percent
    TEXT formula_version
    TEXT notes
    TEXT created_at
  }
  sensory_evaluations {
    TEXT id PK
    TEXT session_code
    TEXT sample_code
    TEXT submission_key
    TEXT tester_type
    INTEGER color_score
    INTEGER aroma_score
    INTEGER umami_taste_score
    INTEGER aftertaste_score
    INTEGER overall_acceptance
    TEXT comments
    TEXT created_at
  }
  sample_requests {
    TEXT id PK
    TEXT full_name
    TEXT contact
    TEXT contact_normalized UK
    TEXT organization_type
    TEXT dietary_preference
    TEXT shipping_address
    TEXT consent_at
    TEXT status
    TEXT created_at
    TEXT updated_at
  }
  schema_migrations {
    TEXT version PK
    TEXT applied_at
  }
```

- `sources`: nguồn và phạm vi tham khảo. Năm xuất bản tách khỏi ngày đối chiếu.
- `knowledge_articles`: nội dung biên soạn, ứng dụng, giới hạn và tags JSON. Một nguồn có thể hỗ trợ nhiều bài; hiện mỗi bài gắn một nguồn.
- `batches`: mẻ tính toán lưu đầu vào và kết quả do server tính, kèm phiên bản công thức. Kết quả ước tính không phải dữ liệu kiểm nghiệm.
- `sensory_evaluations`: mỗi phiếu thuộc một `session_code` và `sample_code`. Dữ liệu này không liên kết FK với `batches`, vì mã mẫu thử cảm quan có thể khác mã mẻ tính bột. Điểm chỉ nhận giá trị nguyên 1–9. Cặp đợt/mẫu/UUID gửi lại có index duy nhất để retry an toàn.
- `sample_requests`: đăng ký quan tâm có thời điểm đồng ý lưu liên hệ, trạng thái và khóa liên hệ chuẩn hóa để tránh đăng ký trùng. Chỉ API quản trị trả thông tin cá nhân.
- `schema_migrations`: theo dõi migration đã áp dụng. Mỗi migration chạy trong transaction.

SQLite bật foreign keys, WAL và timeout 5 giây. Có index chủ đề, nguồn và ngày tạo mẻ. Khi khởi động, migration chạy trước seed. Seed dùng `INSERT OR IGNORE`, không ghi đè bài đã sửa. Thay đổi dữ liệu đã seed cần migration dữ liệu rõ ràng; chỉ sửa file seed sẽ không sửa bản ghi cũ.

Không lưu lịch sử hội thoại. Sao lưu local: dừng server rồi sao chép thư mục `data/`; giữ bản sao ngoài thư mục đang chạy. Tránh chỉ sao chép file `.sqlite` khi server đang chạy vì dữ liệu mới có thể còn trong WAL.

## Cổng giám khảo

Migration `003_judge_portal.sql` bổ sung:

```mermaid
erDiagram
  judge_accounts ||--o{ auth_sessions : owns
  judge_accounts {
    TEXT id PK
    TEXT display_name
    TEXT role
    INTEGER enabled
    TEXT secret_salt
    TEXT secret_hash
    INTEGER expires_at
  }
  auth_sessions {
    TEXT token_hash PK
    TEXT account_id FK
    TEXT csrf_token
    INTEGER created_at
    INTEGER expires_at
    INTEGER last_seen
  }
  quality_documents {
    TEXT id PK
    TEXT title
    TEXT doc_type
    TEXT file_name UK
    TEXT mime
    INTEGER size_bytes
    TEXT sha256
    TEXT evidence_status
  }
  access_audit {
    INTEGER id PK
    TEXT account_id
    TEXT action
    TEXT resource_id
    TEXT created_at
  }
```

Tệp ở `data/dossier/`, ngoài static root `dist/`. API kiểm tra quyền trước khi đọc metadata hoặc file, xác minh containment bằng realpath và đối chiếu hash/size. Trang đăng nhập static có thể mở, nội dung hồ sơ được tải riêng sau xác thực. JUDGE đọc tài liệu/cảm quan; ADMIN thêm quyền dữ liệu đăng ký và mẻ thử. Nhật ký không chứa mã truy cập. SQLite lưu hash token phiên; frontend giữ CSRF trong bộ nhớ.

Jev chỉ nhận một góp ý người dùng nhập và đồng ý gửi, qua TypeSafe System One với câu hỏi `choice`. Server kiểm tra cấu trúc, loại nhãn và xác suất trước khi trả gợi ý. Nhận xét cảm quan bằng OpenRouter vẫn là cấu hình riêng; số liệu tính bằng code. Xem [hướng dẫn cổng giám khảo](JUDGE_PORTAL.md).

## Giới hạn triển khai

Bản này phục vụ một máy trên `127.0.0.1`. SQLite phù hợp quy mô hiện tại; đã có tài khoản JUDGE/ADMIN và phiên có thời hạn. Chưa có quản trị bài viết, đồng bộ nhiều máy hay tìm kiếm vector. API mẻ thử chỉ cho ADMIN hoặc bearer token riêng của người vận hành. Triển khai công cộng cần thiết kế HTTPS, cookie Secure, giới hạn theo người dùng và quy trình quản lý tài khoản.

AI kho tri thức lấy tối đa 3 bài bằng đối sánh từ khóa. Server kiểm tra mã nguồn trích dẫn có thuộc các bài đã truy xuất; phép kiểm tra này không chứng minh mọi câu AI sinh ra đều đúng. Giao diện dẫn về bài gốc để đối chiếu. Khi thiếu nguồn, lỗi provider hoặc trích dẫn không hợp lệ, trả nội dung tra cứu từ thư viện. AI mock đã được kiểm tra; gọi provider thật cần API key/model hợp lệ.

AI cho thống kê cảm quan chỉ nhận số lượng phiếu, trung bình và độ lệch chuẩn theo tiêu chí, không nhận phiếu cá nhân, nhận xét hay liên hệ. Với dưới 3 phiếu hoặc AI chưa bật, server trả nhận xét mô tả. Không nên dùng AI để tuyên bố mức độ tin cậy hoặc sự khác biệt có ý nghĩa thống kê.

## Tài liệu kỹ thuật sử dụng

- [Express 5](https://expressjs.com/en/guide/migrating-5/)
- [Node.js SQLite](https://nodejs.org/download/release/latest-v24.x/docs/api/sqlite.html)
- [OpenRouter Chat Completions](https://openrouter.ai/docs/api/api-reference/chat/send-chat-completion-request)
