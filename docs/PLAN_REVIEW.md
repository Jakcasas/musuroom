# Đối chiếu kế hoạch — Musuroom 1

Nguồn yêu cầu tham khảo: `ke_hoach_web_server_bot_gia_vi_nam.md` trong Downloads. Nội dung tài liệu dùng làm kế hoạch, không thay cho chỉ dẫn trực tiếp của người dùng.

| Phần kế hoạch | Hiện trạng | Phần cần dữ liệu / tài khoản thực tế |
|---|---|---|
| Repository, Express, .env, database | Đã có SQLite local, adapter PostgreSQL và migration cloud; môi trường production kiểm tra chặt | Điền kết nối Supabase riêng tư |
| Khảo sát Hedonic 1–9 | Form và API hoàn chỉnh; mã đợt/mẫu, kiểm tra đầu vào, chống gửi trùng | Phiếu thử nghiệm thực tế |
| Sensory Metrics | Mean, median, SD mẫu, phân bố, radar; CSV bảo vệ và chống công thức spreadsheet | Chưa có phiếu thì trả trạng thái trống; không suy luận kiểm định thống kê |
| Đăng ký mẫu thử | Đồng ý lưu liên hệ, chuẩn hóa contact, quản lý trạng thái và xóa theo quyền ADMIN | Kế hoạch phát mẫu và người phụ trách liên hệ |
| Giám khảo, hồ sơ riêng | Mã có thời hạn, hash bí mật, cookie HttpOnly/CSRF, HTTPS Secure cookie, role, audit, private Storage | Cấp tài khoản cloud sau khi kết nối; bổ sung SOP/COGS/COA thật |
| Overview, batch, nutrition | Bổ sung 3 API, bảng mẫu đo, trang minh-bach.html và CLI nhập dữ liệu | Chỉ công bố mẫu có tài liệu FINAL; chưa có dinh dưỡng/đối chứng thì nêu rõ thiếu dữ liệu |
| Kho tri thức | 6 bài/nguồn với tìm kiếm tiếng Việt, liên kết và giới hạn áp dụng | Không tự đồng nhất tài liệu nghiên cứu với kiểm nghiệm sản phẩm |
| Jev | Choice phân loại góp ý, opt-in gửi đoạn văn, lọc email/điện thoại, xác minh schema, retry có hạn, fallback | Key TypeSafe và đánh giá nhãn tiếng Việt trước sử dụng thực tế |
| Railway + Supabase | Project/service/domain đã tạo; Docker và vùng Singapore đã cấu hình | Kết nối bí mật, deploy Healthy và kiểm tra public URL chưa hoàn tất |
| QR bao bì/poster | Bộ sinh SVG/PNG, A4, kiểm tra URL public và test giải mã đã có | Chỉ tạo bản để in sau khi website cloud hoạt động |

## Bổ sung từ đối chiếu

1. Tách mẻ **ước tính** khỏi mẫu có **số đo** và minh chứng. Độ ẩm, hoạt độ nước, CIELAB và dinh dưỡng có đơn vị/phạm vi riêng.
2. Không tự tạo COA, SOP, công thức COGS hay số dinh dưỡng. Hồ sơ giới thiệu hiện là DRAFT.
3. Production sử dụng PostgreSQL + private Storage, không lưu dữ liệu lâu dài vào filesystem container.
4. Rate limit riêng mỗi IP, map có giới hạn; một replica. Toàn bộ API cũ chuyển sang bất đồng bộ để hỗ trợ PostgreSQL.
5. Snapshot 111 trang TypeSafe, manifest SHA-256, bản gốc đầy đủ và tìm kiếm offline được lưu cùng dự án.
6. 26 bài kiểm thử thành công: SQLite và PostgreSQL thực trong PGlite, xác thực/phân quyền, lưu khảo sát, tính điểm, storage mock, QR và Jev mock. Chưa thay thế kiểm thử cloud hoặc đo cảm quan thực tế.
