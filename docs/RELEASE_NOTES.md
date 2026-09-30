# Musuroom 1 — bản mã nguồn 1.4.2

Ngày cập nhật: **30.09.2026**.

## Hoàn thiện bản 1.4.2

| Phần | Lỗi đã sửa / cải tiến |
|---|---|
| Khảo sát | Khóa input/submit/reset khi đang gửi; ngăn gửi lặp; phiếu đã lưu chỉ mở qua “Phiếu mới”; giữ mã đợt/mẫu từ QR sau reset |
| Đăng ký mẫu | Kiểm tra số điện thoại 8–15 chữ số, chuẩn hóa số Việt Nam; nhận diện cả định dạng cũ mà không sửa đăng ký đã lưu |
| Kho tri thức | Tìm nhiều từ khớp từ đầy đủ, tránh “ẩm” khớp một phần của “phẩm”; tìm một từ vẫn hỗ trợ tiền tố |
| Minh chứng mẫu đo | Loại tên chỉ tiêu thuộc prototype, yêu cầu số đo thực; minh chứng FINAL COA/REPORT; tự ẩn mẫu công khai khi minh chứng thay đổi |
| Database | SQLite triggers và 5 PostgreSQL CHECK constraints bảo vệ object, chỉ tiêu rỗng và tên không được hỗ trợ |
| Jev | Giới hạn theo IP sau đăng nhập; deadline gồm đọc body, tối đa 64 KiB, chặn redirect; fallback khi treo/lỗi/quá lớn |
| Tệp và HTTP | Kiểm tra kích thước hồ sơ local trước khi đọc; CSP chỉ dùng font/style cùng server; vô hiệu quyền camera/microphone/vị trí |
| Vận hành | Phiên bản health/status đọc từ package; cố định phiên bản dependencies/pnpm; kiểm tra cú pháp và tài nguyên; GitHub Actions Windows/Linux |
| Tài liệu | README, API, kiến trúc, cổng giám khảo, hướng dẫn cloud và đối chiếu kế hoạch cập nhật cùng bản mã nguồn |

## Kiểm chứng bản 1.4.2

- **37/37 bài kiểm thử thành công** trên Node.js 24; database bộ nhớ/tạm, provider bằng mock. Không tạo phiếu giả vào database dự án.
- Kiểm tra cú pháp JavaScript và liên kết tài nguyên HTML bằng `pnpm check`; audit dependencies sản xuất không phát hiện lỗ hổng đã công bố ở thời điểm kiểm tra.
- Kiểm tra giao diện thực tế: gửi phiếu/đăng ký với request chậm, khóa/reset, giữ mã QR, đăng nhập/đăng xuất, Mean/SD/radar, nhận xét mô tả và hỏi đáp có nguồn. Kiểm tra màn hình nhỏ cho các trang chính.
- Migration pg-004 đã áp dụng lên Supabase thực, 5 constraints được validate; 11 bảng bật RLS, 6 bài tri thức. Security/Performance Advisors sau migration không có WARN/ERROR; INFO RLS không policy là chủ ý chặn role trình duyệt, index chưa dùng trên database mới.
- GitHub Actions chạy cùng bộ kiểm tra trên Windows/Linux; xem trạng thái của commit tại [Actions](https://github.com/Jakcasas/musuroom/actions/workflows/ci.yml).

Chưa gọi OpenRouter/Jev thật khi chưa có key/model. Website Railway và QR để in vẫn chờ hoàn tất xác thực kết nối PostgreSQL của server; cập nhật Supabase không đồng nghĩa website cloud đã deploy. FINAL là nhãn của người vận hành, không tự xác nhận giá trị khoa học/chứng nhận của báo cáo.

Hướng dẫn ở [README](../README.md), hợp đồng request/response ở [API](API.md), trạng thái cloud ở [GitHub + Supabase](GITHUB_SUPABASE.md).

---

## Lịch sử: bản mã nguồn 1.4.1

Ngày cập nhật: **30.09.2026**.

## Các cải tiến

| Phần | Thay đổi | Lợi ích |
|---|---|---|
| Tài liệu gửi mô hình | Tối đa ba bài, JSON tài liệu tối đa 12.000 ký tự mặc định; đánh dấu nội dung rút gọn | Hạn chế dung lượng đầu vào khi kho tri thức lớn dần |
| Điều phối OpenRouter | Một gateway dùng chung cho hỏi đáp/cảm quan, mặc định hai yêu cầu đồng thời | Hạn chế tải đồng thời ở server và provider |
| Xử lý gián đoạn | Tạm ngừng gọi sau lỗi, xử lý thời gian chờ của provider, không tự retry | Giảm lời gọi lặp khi dịch vụ đang lỗi |
| Phản hồi provider | Timeout bao gồm đọc body, chặn redirect, giới hạn 64 KiB, loại câu trả lời bị cắt/lọc | Giữ thời gian và dung lượng xử lý có giới hạn |
| Cấu hình | Kiểm tra placeholder, key/model và khoảng giá trị; bổ sung hạn mức API nhận xét | Báo lỗi cấu hình sớm, hạn chế yêu cầu lặp |
| Thống kê cảm quan | Database tổng hợp phân bố, server nhận tối đa 49 dòng/đợt/mẫu | Không tải góp ý/phiếu thô chỉ để tính các chỉ số |
| Supabase | Hàm tổng hợp SECURITY INVOKER, thu hồi quyền gọi của role trình duyệt | Giữ truy cập dữ liệu cảm quan qua server có xác thực |
| Giao diện | Diễn đạt chế độ trợ lý rõ hơn, hiển thị thời gian chờ, trạng thái truy cập hỗ trợ đọc màn hình | Người dùng hiểu kết quả có nguồn và chế độ dự phòng |

Mean, median, SD mẫu, phân bố, radar và `basis` giữ cấu trúc phản hồi. CSV vẫn xuất phiếu thô theo quyền. Giới hạn điều phối áp dụng cho một tiến trình/replica, chưa phải hạn mức tiền tệ cho tài khoản OpenRouter.

## Kiểm chứng và trạng thái

- **32/32 kiểm thử thành công**, chạy toàn bộ `tests/*.test.mjs` trên Node.js hiện tại.
- Kiểm thử SQLite/PostgreSQL, xác thực, hạn mức, cooldown, body bị treo/quá lớn, nguồn trích dẫn và phản hồi dự phòng bằng mock.
- So sánh thuật toán phân bố với thuật toán từ phiếu thô; kiểm tra histogram một triệu phiếu giả lập mà không mở rộng thành mảng điểm. Đây là kiểm thử thuật toán, chưa phải benchmark hiệu năng dữ liệu thực.
- Migration mới đã áp dụng lên Supabase. Kiểm tra hàm, quyền gọi và Security Advisors không có WARN/ERROR; 6 bài tri thức, 0 phiếu thực tế trên cloud.
- Chưa gọi OpenRouter thật vì chưa có key/model. Website Railway vẫn chờ hoàn tất cấu hình kết nối database của server; migration Supabase thành công không đồng nghĩa website cloud đã deploy.

Hướng dẫn cấu hình ở [README](../README.md), hợp đồng request/response ở [API](API.md), trạng thái cloud ở [GitHub + Supabase](GITHUB_SUPABASE.md).
