# Vận hành Musuroom trên Railway + MongoDB Atlas

Từ 1.11, production dùng MongoDB Atlas cho dữ liệu nghiệp vụ/JSON và GridFS cho tài liệu riêng tư. Tên file này được giữ để các liên kết cũ hoạt động. PostgreSQL/Supabase chỉ còn trong công cụ legacy; không dùng làm đường lui khi Atlas bị lỗi.

## 1. Cấu hình riêng tư

- Tạo data/cloud.env từ cloud.env.example trên máy, giữ ngoài Git.
- Database/storage provider: mongodb. MONGO_ENABLED=true. Điền URI Atlas thật với database user có quyền phù hợp; dùng MONGODB_DATABASE=musuroom.
- Mật khẩu có ký tự dành riêng phải được URL-encode đúng một lần. CAU_HINH_MONGODB.cmd lưu URI vào data/cloud.env, không tự cập nhật Railway.
- Railway Variables chứa bản URI riêng cho môi trường production. Sau đổi mật khẩu Atlas, cập nhật cả tệp riêng trên máy và Railway Variables.
- Không đổi mật khẩu user đang được các dịch vụ khác sử dụng nếu chưa xác định tác động. Không tắt TLS verification.
- PUBLIC_ORIGIN là domain HTTPS thật. PUBLIC_CONTACT_EMAIL là email công khai nhận yêu cầu xóa/góp ý, có thể để trống khi chưa có; giao diện ghi rõ chưa cấu hình.
- Key Jev chỉ dùng www.jevai.org/agent/keys; JEV_MODEL=typesafe-ai/jev. Khóa/model chưa được chấp nhận không làm mất chức năng tra cứu cục bộ.

## 2. Kiểm tra trước khi triển khai

Chạy pnpm check, pnpm lint, pnpm test và node scripts/check-publish.mjs. Chạy pnpm cloud:check; mọi kiểm tra database/storage phải đạt. Lỗi atlas_authentication_failed cần sửa database user/password/URI; atlas_network_unavailable cần kiểm tra SRV/DNS/Network Access. Không chạy reset database để sửa lỗi kết nối.

Railway sử dụng service musuroom-web, nhánh main, Singapore, port 8080, /healthz. Backend lắng nghe 0.0.0.0 và đọc PORT của môi trường. Domain hiện hành: https://musuroom-web-production.up.railway.app.

## 3. Triển khai

pnpm cloud:deploy xác minh kết nối, tạo tài nguyên QR cho đúng phiên bản, cập nhật biến môi trường riêng tư, tải source lên đúng service và chờ deployment ID mới. Script không in giá trị key/URI. Cấu hình cloud:configure chỉ cập nhật biến; chưa phát hành bản mới.

Nếu GitHub tự triển khai khi push, cập nhật URI đúng trên Railway trước khi push. Không suy ra website khỏe chỉ từ trạng thái SUCCESS. Kiểm tra phiên bản runtime đúng commit và dữ liệu đọc được.

## 4. Kiểm tra sau triển khai

- /healthz: 200, version đúng, database=ok, database_provider=mongodb.
- /api/status, /api/knowledge, /api/v1/product/batches: đọc được JSON. items=[] ở mẫu công khai là chưa có hồ sơ đo công bố, khác với lỗi 503.
- /api/v1/judge/dossier: 401 khi chưa đăng nhập. Kiểm tra JUDGE với mã đã được cấp, rồi đăng xuất; không để mã trong QR.
- Thử khảo sát/đăng ký trên database tạm. Không tạo phiếu giả hoặc minh chứng giả ở production.
- /robots.txt, /sitemap.xml và trang quyền riêng tư phải truy cập được.
- pnpm qr:generate https://musuroom-web-production.up.railway.app xác minh phiên bản, health, API dữ liệu và bảo vệ hồ sơ trước khi tạo QR in.

Manifest QR phải đúng domain/phiên bản. Quét bản in ở tỉ lệ 100% trước khi dán; QR cổng giám khảo chỉ mở trang đăng nhập. QR không chứa mã truy cập.

## 5. Giám sát và xử lý sự cố

Production kiểm tra database mỗi 60 giây, ghi database_health khi gián đoạn/phục hồi. Lỗi kết nối API trả 503 + Retry-After: 30, không trả lỗi thô. Lỗi ứng dụng 500 có request_id để đối chiếu log an toàn. Cấu hình dịch vụ theo dõi HTTPS từ bên ngoài theo /healthz; người vận hành chọn nơi nhận cảnh báo. Phiên bản này chưa tự gửi email/SMS cảnh báo.

Kho tri thức giữ bản đã tải hoặc dùng bản đi kèm; nút thử lại chỉ tải dữ liệu, không tự gửi lại biểu mẫu. Trợ lý cục bộ ghi rõ nguồn và giới hạn. Lỗi Jev không được coi là kết quả Jev đã thành công; kiểm tra bằng pnpm jev:diagnose --cloud, có thể dùng --default-model để đối chiếu.

Các lịch sử Supabase/migration cũ nằm trong Git và docs/GITHUB_SUPABASE.md. Không áp dụng chỉ dẫn triển khai legacy vào production Atlas hiện tại.
