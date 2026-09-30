# GitHub và Supabase — Musuroom 1

## GitHub

- Repository công khai: **https://github.com/Jakcasas/musuroom**.
- Nhánh mặc định: `main`.
- Có hướng dẫn khởi động, ảnh giao diện Roboto và [mục lục tài liệu](README.md).
- Lịch sử Git được kiểm tra đối chiếu bí mật thực tế trước khi push bằng `scripts/check-publish.mjs`.
- Mã nguồn có thể được tải ở **Code > Download ZIP** hoặc clone bằng Git. Mật khẩu database, khóa API, mã giám khảo và dữ liệu thực tế nằm ngoài repository.

## Supabase đã thiết lập

- Project hiện có: `hlkzngyuoqzcfhrfkuub`.
- [Mở Dashboard](https://supabase.com/dashboard/project/hlkzngyuoqzcfhrfkuub).
- Vùng: Singapore, `ap-southeast-1`.
- 11 bảng Musuroom, bao gồm ledger migration; RLS bật và không cấp SELECT cho `anon`/`authenticated`.
- 6 nguồn và 6 bài tri thức được nạp từ mã nguồn. Chưa có khảo sát hoặc đăng ký mẫu thử thực tế trên cloud.
- Bucket `musuroom-dossier`: `public=false`, giới hạn file 50 MB.
- Migration bổ sung tạo index cho khóa ngoại hồ sơ mẫu và thu hồi quyền gọi `public.rls_auto_enable()` của các role trình duyệt. Function/event trigger hệ thống vẫn được giữ.
- Migration `pg-003-sensory-distribution` đã áp dụng ngày 30.09.2026: hàm tổng hợp điểm trả tối đa 49 dòng/đợt/mẫu, không có nội dung góp ý hoặc ID người thử; dùng `SECURITY INVOKER`, search path cố định, không cấp EXECUTE cho PUBLIC/anon/authenticated. Server/service_role được dùng theo phân quyền ứng dụng.

Kiểm tra bảo mật Supabase Advisors ngày 30.09.2026 sau migration không có WARN/ERROR. Thông báo INFO [RLS không có policy](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy) là chủ ý chặn Data API của role trình duyệt. Kiểm tra hiệu năng trước đó có INFO [index chưa sử dụng](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index) do database mới. Kết quả kiểm thử bản 1.4.1 xem [ghi chú phát hành](RELEASE_NOTES.md).

Ứng dụng Express kiểm tra phiên, vai trò và CSRF trước khi đọc dữ liệu riêng. Backend kết nối PostgreSQL bằng Session pooler, xác minh CA và hostname; Storage sử dụng khóa phía server. Frontend không nhận khóa server.

## Phần còn cần hoàn tất

Mật khẩu trong cấu hình riêng tư của server chưa được PostgreSQL chấp nhận ở lần kiểm tra gần nhất. Plugin Supabase có thể tạo và kiểm tra schema qua OAuth, nhưng phiên này không tự cung cấp mật khẩu cho tiến trình Express. Cần hoàn tất mật khẩu kết nối trước khi chạy server cloud, cấp mã giám khảo cloud và tạo QR tới URL đã hoạt động.

Xem các lệnh tiếp theo trong [hướng dẫn Railway + Supabase](DEPLOY_RAILWAY_SUPABASE.md). Bản local dùng SQLite riêng và tiếp tục chạy tại `http://127.0.0.1:8766/`.
