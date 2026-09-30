# Musuroom — Trọn vị nấm. Thêm giá trị.

Website dự án phát triển bột gia vị từ phụ phẩm nấm ăn. Bản 1.0 gồm trang giới thiệu, quy trình dự kiến, công cụ tính mẻ và kho tri thức có trích dẫn.

## Mở trên máy Windows

1. Giải nén toàn bộ mã nguồn nếu đang dùng file ZIP.
2. Nhấp đúp **MO_MUSUROOM.cmd**.
3. Mở **http://127.0.0.1:8766/**. Kho tri thức: **http://127.0.0.1:8766/tri-thuc.html**.

Nút khởi động chạy máy chủ trong nền; mở lại sẽ dùng máy chủ đang chạy. Cần Node.js 22 trở lên. Trên máy hiện tại, script có thể dùng Node đi kèm Codex nếu PATH chưa có Node. Không cần cài thư viện, API key, MongoDB hoặc AI. Máy chủ chỉ lắng nghe trên máy này (127.0.0.1), không phải liên kết Internet.

Chạy thủ công: `node server.mjs`. Đổi cổng trong PowerShell bằng `$env:PORT=8767` trước khi chạy. Dừng máy chủ chạy thủ công bằng Ctrl+C; máy chủ nền có PID trong `server.pid`, có thể kết thúc đúng PID đó trong Task Manager. Lỗi khởi động ghi trong `server-error.log`.

## Sử dụng

- **Kho tri thức:** nhập từ khóa có/không dấu, lọc chủ đề, mở nội dung/giới hạn, đọc nguồn gốc. Từ khóa kết hợp theo AND. Đường dẫn chứa tham số `q`, `category` hoặc `doc` có thể lưu lại.
- **Mẻ thử:** thay đổi đầu vào, tỷ lệ loại bỏ, độ ẩm và hao hụt. Xuất CSV UTF-8 hoặc đặt lại. Độ ẩm tính trên cơ sở ướt, kết quả chỉ là bột nền trước phối trộn.
- Dữ liệu tìm kiếm và tính toán chạy trong trình duyệt, không gửi đến backend. Font Google cần Internet; khi ngoại tuyến website dùng font hệ thống. Liên kết nguồn bên ngoài cần Internet.

## Nội dung & nguồn

Kho gồm 4 nguồn bên ngoài (tổng quan phụ phẩm nấm, nghiên cứu umami, FAO về tuần hoàn, FDA về hoạt độ nước) và 2 ghi chú phương pháp riêng của Musuroom. Mỗi bài có năm xuất bản, URL, phạm vi tham khảo và giới hạn áp dụng. Cập nhật 30.09.2026; không tự đồng bộ từ Internet.

Chỉnh nội dung tại `dist/knowledge-data.js`; mọi bài cần ID duy nhất, tiêu đề, chủ đề, năm, nguồn, URL, tóm tắt và giới hạn. Phần áp dụng cho Musuroom được tách khỏi nội dung nghiên cứu. Không sao chép toàn văn nguồn.

Website chính thức của dự án không đồng nghĩa với sản phẩm thương mại đã kiểm nghiệm. Không công bố thành phần, hạn dùng, giá bán hoặc chứng nhận khi chưa có dữ liệu. Hình hero được tạo bằng AI để minh họa ý tưởng, không phải ảnh sản phẩm thật.

## Mã nguồn & kiểm tra

- `dist/index.html`, `dist/styles.css`: trang chủ và giao diện thích ứng.
- `dist/tri-thuc.html`, `dist/knowledge.js`, `dist/knowledge-data.js`: kho tri thức.
- `dist/core.js`: tìm kiếm, kiểm tra đầu vào, tính toán và CSV.
- `server.mjs`: máy chủ static, chỉ hỗ trợ GET/HEAD.
- `tests/core.test.mjs`: kiểm tra tìm kiếm, tính toán, CSV và HTTP.

Chạy `node --test tests/*.test.mjs` hoặc `npm test`. Không cần `npm install`.
