# GitHub, Railway và Supabase — Musuroom 1

Trạng thái ngày **02.10.2026**, mã nguồn **1.7.0**.

## GitHub

Repository công khai: **https://github.com/Jakcasas/musuroom**, nhánh `main`. README, hướng dẫn triển khai, kiến trúc, REST API và snapshot TypeSafe được lưu cùng mã nguồn. [GitHub Actions](https://github.com/Jakcasas/musuroom/actions/workflows/ci.yml) chạy Windows/Linux và audit dependencies production trên Linux. Dependencies, pnpm và action SHA được cố định.

Mật khẩu database, URI Atlas, provider key, mã giám khảo, cookie và dữ liệu thực ở `.env`/`data/`, ngoài Git. `scripts/check-publish.mjs` đối chiếu lịch sử Git với các bí mật lưu trên máy trước publish. ZIP mã nguồn dùng `git archive`, không nén toàn bộ thư mục runtime.

## Railway và Supabase đã kiểm tra

- [Ứng dụng Railway](https://musuroom-web-production.up.railway.app) chạy qua HTTPS; `/healthz` trả bản `1.7.0`, database `ok`.
- Supabase project `hlkzngyuoqzcfhrfkuub`, [Dashboard](https://supabase.com/dashboard/project/hlkzngyuoqzcfhrfkuub), Singapore `ap-southeast-1`.
- **14 bảng Musuroom** gồm ledger và 2 bảng đồng bộ và bảng đề xuất tri thức; RLS bật, không cho `anon`/`authenticated` đọc các bảng ứng dụng. Backend kiểm tra role/CSRF và kết nối qua Session pooler 5432 với TLS xác minh CA/hostname.
- 6 nguồn và 6 bài tri thức. Chưa nạp phiếu cảm quan hoặc đăng ký giả vào cloud. Hai tài khoản cloud có thời hạn và một BRIEF DRAFT đã tạo; bản giới thiệu nằm trong bucket `musuroom-dossier` private, 50 MB/file.
- pg-003 tổng hợp phân bố cảm quan tối đa 49 dòng/đợt/mẫu; pg-004 kiểm tra cấu trúc/chỉ tiêu đo; pg-005 thêm outbox/revision/lease. Function dùng SECURITY INVOKER, search path cố định; quyền gọi browser bị thu hồi.
- pg-006 thêm đề xuất tri thức và hàng chờ đối chiếu; 6/6 migration khớp version/name/SQL. Advisors sau pg-006 không có WARN/ERROR. [Bốn luồng Jev](JEV_WORKFLOWS.md) đã tích hợp và kiểm thử.
- Đã kiểm tra health, các trang công khai và chặn file cấu hình riêng. Kiểm tra cloud JUDGE/ADMIN, cookie Secure và đăng xuất bằng mã riêng trên máy, không in mã/cookie.
- QR PNG/SVG và trang A4 tạo sau khi xác minh hai đích công khai. QR chỉ mở trang khảo sát/cổng đăng nhập.

Supabase Security/Performance Advisors sau pg-005 không có WARN/ERROR. Có 13 INFO [RLS không policy](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy), là chủ ý ngăn role trình duyệt truy cập Data API, và 8 INFO [index chưa sử dụng](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index) trên database ít dữ liệu. Không mở policy chỉ để loại cảnh báo INFO.

## Atlas và Jev

Code có MongoDB driver, JSON projection, batch/upsert, revision, retry và lease; có Jev Choice để gợi ý chủ đề bài tri thức. URI Atlas và key từ JevAI /agent/keys đã lưu riêng. Atlas đã nhận đủ 6 tài liệu JSON được đọc kiểm chứng, hàng đợi SQL pending=0. JevAI vẫn báo credentials/model access rejected qua MCP, REST 502; cần kiểm tra key/quyền model trước khi xác nhận inference thành công. Runtime chỉ dùng www.jevai.org, model typesafe-ai/jev. [Các bước thiết lập](MONGODB_JEV.md).

Hướng dẫn cập nhật biến, deploy lại, cấp mã, upload hồ sơ và in QR tại [Railway + Supabase](DEPLOY_RAILWAY_SUPABASE.md). Local dùng SQLite riêng tại `http://127.0.0.1:8766/`.

## Trạng thái đồng bộ trên Railway

Worker trên Railway hiện trả `atlas_network_unavailable`, dù đồng bộ từ máy này và đọc lại Atlas đã thành công. Cần kiểm tra Atlas Network Access và DNS/kết nối từ Railway trước khi xác nhận đồng bộ tự động trên cloud. Dữ liệu khảo sát vẫn lưu vào Supabase; có thể chạy `data:sync` từ máy đã được Atlas cho phép.

Bản 1.7.0 đã đạt 59/59 tests; API preview hai bài và bộ lọc pending được kiểm tra trên Railway, chặn anonymous (401) và thiếu CSRF (403). Không thay đổi trạng thái đối chiếu của dữ liệu thật trong phép kiểm tra. Atlas có 6 JSON kèm nhãn local/keyword_rules, requires_review=true; đây không phải kết quả Jev inference.
