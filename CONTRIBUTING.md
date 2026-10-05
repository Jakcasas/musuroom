# Đóng góp cho Musuroom

Tạo nhánh cho thay đổi, mô tả vấn đề thực tế và mở pull request vào `main`. Mỗi PR tập trung vào một hành vi có thể kiểm chứng.

1. Dùng Node.js 24+, pnpm 11.19.0; chạy `pnpm install --frozen-lockfile` và `pnpm setup`.
2. Dùng SQLite hoặc database thử riêng. Không thêm phiếu, thông tin cá nhân hay tài khoản minh họa vào production.
3. Chạy `pnpm check`, `pnpm test`, `pnpm audit --prod`. Tính năng giao diện cần kiểm tra trên màn hình nhỏ và bằng bàn phím.
4. Migration Supabase mới phải tạo bằng CLI `supabase migration new <name>`. Không sửa migration đã áp dụng. Giữ SQLite/PostgreSQL tương đương; bật RLS, thu hồi quyền browser cho bảng riêng tư.
5. Không commit `.env`, `data/`, khóa, URI có mật khẩu, cookie, tài khoản truy cập hoặc dữ liệu người dùng. Chạy `node scripts/check-publish.mjs` sau commit và trước push.

Với tính năng AI, ghi rõ đầu vào được gửi, sự đồng ý, giới hạn và đường xử lý khi provider lỗi. Kiểm thử mock không được mô tả là inference thật. Không thêm số liệu hiệu quả, chứng nhận hoặc nội dung TCVN thiếu nguồn.

Nếu phát hiện lỗi bảo mật, không đưa key hoặc dữ liệu thực vào issue công khai; báo người quản lý repository bằng kênh riêng đã thống nhất.
