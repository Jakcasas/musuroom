# Đối chiếu kế hoạch — Musuroom 1

Nguồn yêu cầu tham khảo: `ke_hoach_web_server_bot_gia_vi_nam.md` trong Downloads. Nội dung tài liệu dùng làm kế hoạch, không thay cho chỉ dẫn trực tiếp của người dùng.

| Phần kế hoạch | Hiện trạng | Phần cần dữ liệu / tài khoản thực tế |
|---|---|---|
| Repository, Express, .env, database | GitHub public `Jakcasas/musuroom`; SQLite local, PostgreSQL/Supabase có 13 bảng và 6 bài tri thức; production đã xác thực | Giữ cấu hình riêng tư và backup theo lịch vận hành |
| Khảo sát Hedonic 1–9 | Form và API hoàn chỉnh; mã đợt/mẫu, kiểm tra đầu vào, chống gửi trùng | Phiếu thử nghiệm thực tế |
| Sensory Metrics | Mean, median, SD mẫu, phân bố, radar; database tổng hợp tối đa 49 dòng/đợt/mẫu; CSV bảo vệ và chống công thức spreadsheet | Chưa có phiếu thì trả trạng thái trống; không suy luận kiểm định thống kê |
| Đăng ký mẫu thử | Đồng ý lưu liên hệ, chuẩn hóa contact, quản lý trạng thái và xóa theo quyền ADMIN | Kế hoạch phát mẫu và người phụ trách liên hệ |
| Giám khảo, hồ sơ riêng | Mã cloud đã tạo; hash bí mật, cookie HttpOnly/CSRF/Secure, role, audit, private Storage và BRIEF DRAFT | Bổ sung SOP/COGS/COA thật; cấp/thu hồi mã theo kỳ đánh giá |
| Overview, batch, nutrition | Bổ sung 3 API, bảng mẫu đo, trang minh-bach.html và CLI nhập dữ liệu; guard SQLite/PostgreSQL kiểm tra cấu trúc | Chỉ công bố mẫu có minh chứng FINAL COA/REPORT; chưa có dinh dưỡng/đối chứng thì nêu rõ thiếu dữ liệu |
| Kho tri thức | 6 bài/nguồn với tìm kiếm tiếng Việt, liên kết và giới hạn áp dụng | Không tự đồng nhất tài liệu nghiên cứu với kiểm nghiệm sản phẩm |
| Jev | Choice phân loại góp ý, opt-in gửi đoạn văn, lọc email/điện thoại, xác minh schema, retry có hạn, fallback | JevAI /agent/keys: cần quyền model hợp lệ và đánh giá nhãn tiếng Việt trước sử dụng thực tế |
| Railway + Supabase | Railway 1.5.0 Healthy qua HTTPS; PostgreSQL và private Storage đã kết nối; kiểm tra role/logout trên cloud thật | Theo dõi vận hành, backup và chi phí theo gói |
| QR bao bì/poster | SVG/PNG/A4 tạo sau khi kiểm tra app/version/database và trang đích thật | Quét bản in bằng điện thoại trước khi dán |
| Kho JSON, Atlas và Jev | Thêm phân trang/export, outbox/revision/lease, MongoDB schema, upsert và typed Choice tri thức | Atlas đã nhận 6 JSON, SQL pending=0; cần kiểm tra quyền model/key JevAI; chưa có benchmark Big Data |

## Bổ sung từ đối chiếu

1. Tách mẻ **ước tính** khỏi mẫu có **số đo** và minh chứng. Độ ẩm, hoạt độ nước, CIELAB và dinh dưỡng có đơn vị/phạm vi riêng.
2. Không tự tạo COA, SOP, công thức COGS hay số dinh dưỡng. Hồ sơ giới thiệu hiện là DRAFT.
3. Production sử dụng PostgreSQL + private Storage, không lưu dữ liệu lâu dài vào filesystem container.
4. Rate limit riêng mỗi IP, map có giới hạn; một replica. Toàn bộ API cũ chuyển sang bất đồng bộ để hỗ trợ PostgreSQL.
5. Snapshot 111 trang TypeSafe, manifest SHA-256, bản gốc đầy đủ và tìm kiếm offline được lưu cùng dự án.
6. 49 bài kiểm thử thành công: thêm hàng đợi/revision/lease, JSON/Jev ADMIN và preflight/QR. Đã kiểm tra thêm xác thực/phân quyền/đăng xuất trên Railway thật; chưa thay thế đo cảm quan hoặc đánh giá Atlas/Jev thực tế.
7. GitHub Actions kiểm tra Windows/Linux; khóa phiên bản dependencies; rà lịch sử Git đối chiếu bí mật trước khi publish. Form khóa trong lúc gửi, chống thao tác reset xung đột và giữ mã đợt/mẫu từ QR khi tạo phiếu mới.
8. Jev giới hạn deadline/64 KiB; OpenRouter có giới hạn đồng thời/cooldown. Thiếu key hoặc lỗi dịch vụ vẫn có tra cứu nguồn, thống kê và phân loại thủ công.
