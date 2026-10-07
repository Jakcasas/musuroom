# MongoDB Atlas — Musuroom 1.11.0

## Cấu hình production

Railway ở Singapore, một replica, cổng 8080. Đặt các biến trong Railway Variables hoặc tệp riêng tư `data/cloud.env`:

```dotenv
DATABASE_PROVIDER=mongodb
STORAGE_PROVIDER=mongodb
MONGO_ENABLED=true
MONGODB_URI=<URI Atlas riêng tư>
MONGODB_DATABASE=musuroom
MONGO_SOURCE_ID=musuroom-production
PUBLIC_ORIGIN=https://musuroom-web-production.up.railway.app
```

`DATABASE_URL`, `DATABASE_CA_CERT`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` để trống. Không đưa tệp cấu hình riêng tư vào Git. Production từ chối SQLite; lỗi kết nối Atlas khiến readiness trả lỗi hoặc tiến trình dừng để Railway khởi động lại, không chuyển sang database rỗng trên ổ tạm.

## Cách lưu dữ liệu

- Các collection `app_*` giữ dữ liệu nghiệp vụ, tài khoản, phiên đăng nhập và audit riêng tư. Trường JSON được lưu thành object/array BSON thay vì chuỗi JSON.
- `documents` giữ bản chiếu JSON dùng cho phân loại: tri thức, chỉ số cảm quan tổng hợp và thông tin mẫu công bố. Dữ liệu liên hệ, nhận xét thô, hash mật khẩu không được đưa vào luồng Jev.
- `dossier.files` / `dossier.chunks` là GridFS. Tải tài liệu cần đăng nhập; backend kiểm tra kích thước và SHA-256.
- Unique index chống trùng mã mẫu, contact chuẩn hóa, khóa gửi khảo sát và phiếu chấm. Các cập nhật liên quan dùng transaction với majority write concern.
- Chấm điểm ghi vào hồ sơ mẫu trong cùng transaction để phát hiện mẫu bị sửa đồng thời. Rubric đã tạo không được sửa qua API; tạo phiên bản mới khi cần.
- Số liệu cảm quan được aggregate trên Atlas; danh sách có giới hạn và index. Pool tối đa 10 kết nối cho database chính, 3 cho worker JSON.
- API vector dùng cosine similarity cùng model, lọc revision nguồn hiện tại. Phù hợp kho điều khoản nhỏ; cần bổ sung index Atlas Vector Search và đo tải trước khi mở rộng lên hàng triệu vector.

Các operation có tên nằm trong `backend/db/mongo-operations.mjs`; chúng dùng truy vấn MongoDB trực tiếp. Callback SQL chỉ dành cho bộ công cụ legacy và kiểm thử, không được thực thi trong chế độ MongoDB. Image production không cài gói `pg` và không mang thư mục migration Supabase.

## Các bước triển khai bên ngoài

1. Atlas: cấp người dùng database quyền cần thiết trên database ứng dụng; cho phép đường mạng từ Railway, giữ TLS verification. URI chỉ lưu phía server.
2. Kiểm kê nguồn cũ trước khi chuyển. Chỉ nhập dữ liệu thật đã được duyệt; không nhập fixture. Giữ bản nguồn để đối chiếu. Không xóa project Supabase chỉ vì đã đổi backend.
3. Kiểm tra local: `pnpm check`, `pnpm test`, `pnpm test:atlas`. Lệnh cuối dùng URI riêng tư và tạo database tên `musuroom_verify_*`, xóa đúng database kiểm thử đó khi hoàn tất. Có thể đặt `MONGODB_TEST_URI` để dùng cluster kiểm thử riêng.
4. Chạy `pnpm cloud:check`: phải có `mongodb`, `storage: mongodb`, `atlas` thành công. `jev: configured_not_verified` chỉ xác nhận cấu hình, không chứng minh quyền suy luận.
5. Chạy `pnpm cloud:deploy`: tạo QR trước upload, cấu hình Railway qua stdin, đợi đúng deployment mới và healthcheck, kiểm tra manifest QR công khai cùng phiên bản.
6. Kiểm tra `/healthz` có `database_provider: mongodb`; thử đăng nhập giám khảo/quản trị bằng mã riêng tư, mở hồ sơ; xác minh dữ liệu sau restart. QR tại `/qr/IN_QR_A4.html`, `/qr/survey.png`, `/qr/judge.png` chỉ chứa URL, không chứa mã truy cập.
7. Khi đã đối chiếu xong, có thể ngắt GitHub integration của Supabase trong Dashboard nếu không còn dùng Preview. Giữ project cũ làm nguồn đối chiếu tới khi chủ dự án quyết định lưu trữ/xóa. Không dùng `migration repair` để che một lỗi check không liên quan tới runtime MongoDB.

## Truy cập và Jev

Mã truy cập chỉ được lưu dạng scrypt. Chuyển đổi không kéo dài thời hạn của tài khoản cũ. `JUDGE_BOOTSTRAP_CODE` / `ADMIN_BOOTSTRAP_CODE` là tùy chọn tạo tài khoản mới trong tối đa 30 ngày; khởi động lại với cùng mã giữ hash, trạng thái và thời hạn. Thay mã là thao tác xoay credential, thu hồi phiên cũ. Có thể dùng `access:create` / `access:revoke` với `MUSUROOM_ENV_FILE=data/cloud.env`.

`pnpm jev:diagnose --cloud` gọi một câu minh họa tới `https://www.jevai.org/api/mcp`. Lần kiểm tra 07.10.2026: initialize/tools-list thành công; tools-call trả lỗi quyền key/model. Cần chủ tài khoản Jev kiểm tra quyền suy luận; đổi database hoặc DNS Railway không cấp thêm quyền đó.

Tham khảo triển khai: [MongoDB transactions](https://www.mongodb.com/docs/drivers/node/current/crud/transactions/) và [GridFS](https://www.mongodb.com/docs/manual/core/gridfs/).
