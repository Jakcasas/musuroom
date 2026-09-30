# Musuroom 1 — bản mã nguồn 1.4.1

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
