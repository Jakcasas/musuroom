# Xử lý deployment Railway bị lỗi

## Đích triển khai Musuroom

Repository `Jakcasas/musuroom`, nhánh `main`, dùng dịch vụ **musuroom-web** trong project **Musuroom 1**, môi trường **production**.

- Project: `2fb171d1-803d-4f5e-93cc-94837e2f42d4`.
- Service: `1bb6900a-64d2-47c9-be06-648f6139ff6e`.
- Website: <https://musuroom-web-production.up.railway.app>.
- Cổng: `8080`; healthcheck: `/healthz`; cấu hình: `railway.json` và `Dockerfile` ở gốc repository.

Chỉnh hoặc kết nối GitHub Source trên dịch vụ này. Trước khi tạo dịch vụ mới, kiểm tra tên project, service và môi trường để tránh tạo thêm bản website thiếu cấu hình.

## Sự cố ngày 06.10.2026

Hai trạng thái GitHub `perpetual-tranquility - musuroom` và `mcp.musuroom.com - musuroom` cùng trỏ đến deployment `f826b009-0c68-473a-8dd3-fdd832e224c3`. Project đã đổi tên; đây là một dịch vụ tạo thêm, không phải hai lỗi build riêng.

Docker build hoàn tất. Khi khởi động, backend dừng với thông báo `Production requires HTTPS PUBLIC_ORIGIN, Postgres and Supabase private storage`. Dịch vụ tạo thêm không có các biến môi trường production cần thiết. Đổi tên project thành một tên miền không tạo DNS hoặc endpoint MCP.

Khi xử lý, deployment đã được gỡ và nguồn GitHub đã bị ngắt. Dịch vụ không có biến, volume, domain hoặc deployment đang chạy; đã xóa dịch vụ rỗng khỏi production. Website chính tiếp tục dùng dịch vụ `musuroom-web`.

Trạng thái failure trên commit cũ là lịch sử của lần triển khai đó. Không đổi trạng thái failure thành success để giả lập một deployment đã thành công. Kiểm tra commit mới cùng deployment mới và health của website chính.

## Khi gặp lỗi tương tự

1. Mở Details trên trạng thái GitHub, ghi lại project, service, environment và deployment ID.
2. Kiểm tra Build Logs và Deploy Logs. Build thành công chưa xác nhận backend khởi động thành công.
3. Nếu đây là đích triển khai chính, cấu hình biến trong Railway Variables: `PUBLIC_ORIGIN` HTTPS, `DATABASE_PROVIDER=postgres`, `DATABASE_URL`, `DATABASE_CA_CERT`, `STORAGE_PROVIDER=supabase`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`, `HOST=0.0.0.0`, `PORT=8080`. Lấy secret từ cấu hình riêng tư đã được kiểm chứng; không lưu vào Git.
4. Nếu đây là dịch vụ tạo nhầm, ngắt GitHub Source; chỉ xóa sau khi xác nhận không có tài nguyên hoặc dữ liệu cần giữ.
5. Triển khai đúng nhánh `main` trên `musuroom-web`, theo dõi đúng deployment ID đến `SUCCESS`, rồi kiểm tra `/healthz` trả database `ok` và QR mở đúng trang khảo sát/cổng giám khảo.

Backend giữ kiểm tra bắt buộc cho production; không chuyển sang SQLite local hoặc tắt xác minh TLS chỉ để deployment trở thành xanh.

## Jev MCP

Kết nối Jev dùng `https://www.jevai.org/api/mcp`, với khóa riêng từ `https://www.jevai.org/agent/keys`. Website Musuroom hiện không cung cấp endpoint `/mcp`. Tạo thêm một dịch vụ từ repository website sẽ khởi chạy website, không tự tạo server MCP.

Muốn tự triển khai MCP của Musuroom cần xây endpoint MCP có xác thực, kiểm tra bằng tên miền Railway trước, rồi mới thêm custom domain và DNS. Kết nối MCP thành công chưa xác nhận quyền gọi model Jev; chạy `pnpm jev:diagnose --cloud` và chỉ xác nhận khi `inference_verified=true`.

[Hướng dẫn cấu hình cloud](DEPLOY_RAILWAY_SUPABASE.md) · [Cấu hình Jev MCP](JEV_MCP_SETUP.md)
