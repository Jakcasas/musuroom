# Đối chiếu báo cáo đánh giá website — 12.10.2026

Nguồn yêu cầu: `Danh_gia_website_Musuroom_2026-10-12.docx`. Bản mã nguồn 1.14.0, tên hiển thị **Musuroom ver 1**.

## Các thay đổi đã thực hiện

| Điểm trong báo cáo | Xử lý |
|---|---|
| API 500 và database không sẵn sàng | URI Atlas được kiểm tra lại; lỗi xác thực xác định là `atlas_authentication_failed`. Backend phân loại lỗi kết nối, trả 503 + Retry-After thay cho 500 chung. Không log lỗi thô hoặc URI. |
| Theo dõi sức khỏe sau triển khai | Production kiểm tra database mỗi 60 giây; log khi gián đoạn/phục hồi, không chạy chồng lượt. `/healthz` kiểm tra cả bootstrap truy cập và database. |
| Không rõ dữ liệu thật hay bản dự phòng | Kho tri thức hiển thị bản đi kèm ngay, ghi ngày đối chiếu, trạng thái máy chủ và thời điểm tải. Có nút làm mới; giữ nội dung đã tải khi lần làm mới thất bại. |
| Trợ lý chưa sẵn sàng khi API lỗi | Tra cứu có trích nguồn trong trình duyệt; dùng chung thuật toán với backend. Không tự gửi lại câu hỏi khi mạng lỗi. Tổng hợp qua OpenRouter chỉ khi `allow_remote: true` và người dùng chọn đồng ý. |
| Điều hướng thiếu thống nhất | Các trang chính dùng cùng 5 lối đi: Về Musuroom, Kho tri thức, Đánh giá mẫu thử, Hồ sơ công khai, Cổng giám khảo. Nhãn “Điều khoản” được đổi thành “Tiêu chuẩn & nguồn đối chiếu”. |
| Quyền riêng tư và liên hệ không rõ | Trang quyền riêng tư mới, liên kết cạnh đăng ký. `PUBLIC_CONTACT_EMAIL` có thể hiển thị email công khai; chưa cấu hình thì ghi rõ và hướng dẫn liên hệ người tổ chức. Có API xóa đăng ký dành cho ADMIN từ trước. |
| robots/sitemap/chia sẻ liên kết | Sinh sitemap và robots từ PUBLIC_ORIGIN; metadata canonical/Open Graph cho trang công khai. API/cổng riêng đặt noindex; quyền truy cập vẫn được kiểm tra. |
| Kiểm tra bản phát hành và QR | Công cụ xác minh thêm status, kho tri thức, mẫu công khai và bảo vệ hồ sơ giám khảo; không xác nhận QR nếu API đọc bị lỗi hoặc hồ sơ riêng truy cập được không cần đăng nhập. |

## Việc còn cần người vận hành / dữ liệu thực tế

1. Cấu hình email liên hệ công khai của dự án. Không dùng email ví dụ làm thông tin thật.
2. Ban hành thời hạn lưu đăng ký và quy trình xử lý yêu cầu xóa. Phiên bản này không tự xóa dữ liệu cá nhân theo thời gian.
3. Cung cấp mẫu đo, nguồn nguyên liệu, chỉ tiêu, tài liệu kiểm nghiệm và quyền công bố. Website không tự tạo số liệu an toàn, dinh dưỡng, hạn dùng, giảm phát thải hoặc chứng nhận.
4. Tạo cảnh báo bên ngoài theo `/healthz` và sự kiện log `database_health`. Log định kỳ đã có; việc gửi email/SMS cảnh báo cần cấu hình dịch vụ nhận riêng.
5. Đo LCP/INP/CLS trên bản công khai trong điều kiện thực tế. Không kết luận đạt Core Web Vitals hoặc WCAG AA chỉ từ kiểm tra chức năng.
6. JevAI vẫn cần quyền key/model hợp lệ từ nhà cung cấp. Lần kiểm tra 12.10.2026 qua MCP chính thức trả `jev_auth_failed`; ứng dụng tiếp tục dùng luật cục bộ và ghi đúng nguồn kết quả. Không đổi sang một dịch vụ Jev khác.

## Điều kiện phát hành

- `pnpm check`, `pnpm lint`, `pnpm test`, quét bí mật trước và sau commit.
- `pnpm cloud:check` phải đọc được database và lưu trữ MongoDB.
- Cập nhật URI/key ở biến môi trường Railway qua đường riêng tư; không đưa vào Git, tài liệu hoặc frontend.
- Kiểm tra phiên bản hiện hành, health, API công khai, từ chối hồ sơ riêng khi chưa đăng nhập và manifest QR trên domain thật.
- Khảo sát, đăng ký và thao tác giám khảo được thử bằng database tạm; không ghi phiếu giả vào dữ liệu sản phẩm trên production.
