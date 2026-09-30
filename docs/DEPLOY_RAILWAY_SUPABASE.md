# Musuroom 1 — Railway + Supabase

## Trạng thái chuẩn bị ngày 30.09.2026

- Railway project `Musuroom 1`: `2fb171d1-803d-4f5e-93cc-94837e2f42d4`.
- Service `musuroom-web`: `1bb6900a-64d2-47c9-be06-648f6139ff6e`.
- Tên miền đã cấp: `https://musuroom-web-production.up.railway.app`. **Chưa phải xác nhận website hoạt động**; cần hoàn tất kết nối, deploy và health check.
- Supabase project `hlkzngyuoqzcfhrfkuub`, schema public chưa có bảng khi kiểm tra.
- Supabase Singapore `ap-southeast-1`. Railway cấu hình Singapore `asia-southeast1-eqsg3a`, một replica.
- Hai nhà cung cấp chưa có deployment region Việt Nam theo [Supabase regions](https://supabase.com/docs/guides/platform/regions) và [Railway regions](https://docs.railway.com/deployments/regions). Singapore được chọn theo vị trí và khoảng cách API–database, chưa phải kết quả đo độ trễ thực tế.

## Cấu hình riêng tư

Trên máy mới, tạo thư mục `data` rồi sao chép `cloud.env.example` thành `data/cloud.env` và điền khóa/mật khẩu riêng. Template không chứa thông tin xác thực.

Điền `data/cloud.env` trên máy: DATABASE_URL (Session pooler cổng 5432, percent-encode mật khẩu), SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY. Trên máy này đã lưu service_role hiện có và tạo bucket riêng tư; chỉ còn mật khẩu database. Nhấp đúp **CAU_HINH_SUPABASE.cmd** để nhập mật khẩu dưới dạng ẩn; script tự percent-encode và lưu DATABASE_URL. Không gửi khóa vào chat, không đưa file này vào Git/ZIP. Nếu sử dụng DATABASE_CA_CERT, lấy CA chính thức của project; không tắt kiểm chứng TLS.

Không dùng transaction pooler cổng 6543: migration sử dụng khóa PostgreSQL theo session. Database cloud và database local là hai bộ dữ liệu riêng; script không tự tải dữ liệu liên hệ trên máy lên cloud.

Trong PowerShell tại thư mục dự án (Node.js 24+):

```powershell
$env:MUSUROOM_ENV_FILE='data/cloud.env'
node scripts/database.mjs
node scripts/provision-storage.mjs
node scripts/create-access.mjs --role JUDGE --days 7 --out data/cloud-judge-access.json
node scripts/create-access.mjs --role ADMIN --days 7 --out data/cloud-admin-access.json
node scripts/add-document.mjs --file docs/project-brief.txt --title 'Giới thiệu đề tài Musuroom' --type BRIEF --status DRAFT
Remove-Item Env:MUSUROOM_ENV_FILE
node scripts/railway-configure.mjs https://musuroom-web-production.up.railway.app
pnpm exec railway up --service musuroom-web --detach
```

CLI Railway cần phiên đăng nhập riêng: `pnpm exec railway login --browserless`. Dùng giới hạn trial hiện có; khi nhà cung cấp yêu cầu nâng cấp, người dùng quyết định gói và ngân sách trước khi mua.

## Xác minh trước khi in

1. Deployment Healthy và `/healthz` trả `version: 1.4.0`, `database: ok`.
2. Mở trang chủ, khảo sát, kho tri thức và minh bạch mẫu qua HTTPS. API hồ sơ và danh sách đăng ký phải trả 401 nếu chưa đăng nhập.
3. Đăng nhập bằng **mã cloud**, kiểm tra role JUDGE; tài khoản giám khảo không được xem danh sách liên hệ ADMIN. Đăng xuất sau khi kiểm tra.
4. Kiểm tra vùng chạy thực tế bằng deployment settings hoặc response header `X-Railway-Upstream-Zone` khi gửi `X-Railway-Debug: 1`.
5. Chạy `node scripts/generate-qr.mjs https://musuroom-web-production.up.railway.app`. Script kiểm tra URL thật trước khi tạo `dist/qr/IN_QR_A4.html`, SVG/PNG và manifest. Mã truy cập không nằm trong QR. Quét thử bản in bằng điện thoại trước khi dán.

## Dữ liệu và hồ sơ

- PostgreSQL có RLS và thu hồi quyền anon/authenticated trên **các bảng Musuroom**. Server kết nối trực tiếp; không đưa service key xuống trình duyệt.
- Bucket `musuroom-dossier` riêng tư. Download đi qua API có xác thực, kiểm tra SHA-256/kích thước và ghi audit; không tạo public object URL.
- Bucket trên project hiện tại đã tạo và kiểm tra `public=false`, giới hạn mỗi file 50 MB. Chưa upload hồ sơ cloud khi database chưa kết nối.
- Production không được fallback SQLite hay ổ đĩa tạm. Container chạy user `node`, chỉ sao chép backend/dist/schema cần thiết.
- Cần sao lưu Supabase theo lịch vận hành thực tế; cấu hình hiện tại không hứa hẹn backup tự động của gói Free.
- Giữ một replica: rate limit đang dùng bộ nhớ trong tiến trình. Khi tăng replica, chuyển rate limit sang kho dùng chung trước.
- Mã tài khoản có thời hạn 1–30 ngày, mặc định 7. Cấp lại khi cần; thu hồi bằng `scripts/revoke-access.mjs ACCOUNT_ID` với MUSUROOM_ENV_FILE trỏ cloud.env.

## Jev tùy chọn

Điền TYPESAFE_API_KEY ở phía server rồi JEV_ENABLED=true. Chưa có key thì tiếp tục dùng phân loại thủ công và thống kê. Rubric tại `backend/services/jev-rubric.mjs`; hướng dẫn và toàn bộ snapshot tài liệu tại `docs/typesafe-ai/`.

## Nguồn cấu hình

[Railway Express](https://docs.railway.com/guides/express), [kết nối PostgreSQL Supabase](https://supabase.com/docs/guides/database/connecting-to-postgres), [Supabase Storage](https://supabase.com/docs/guides/storage/uploads/standard-uploads), [TypeSafe API](https://docs.typesafe.ai/api).
