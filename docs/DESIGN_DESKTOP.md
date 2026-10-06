# Giao diện Musuroom trên máy tính — 1.10.0

## Định hướng

Bố cục ưu tiên màn hình máy tính: vùng nội dung tối đa 1320 px, hai cột cho phần giới thiệu và biểu mẫu; màu kem, xanh rừng và xanh lá dịu. Font Roboto được phục vụ từ ứng dụng. Hình sản phẩm hiện có là minh họa ý tưởng, có chú thích rõ trên trang.

- Trang chủ có năm mục điều hướng và ba thẻ bắt đầu: kho tri thức, đánh giá mẫu, hồ sơ giám khảo. Trình chiếu, điều khoản và mô phỏng vẫn truy cập qua chân trang.
- Khảo sát giữ nguyên thang 1–9, tên trường API, xác thực, chống gửi lặp và đồng ý lưu nháp. Chỉ báo 0–5 đếm tiêu chí đã chọn, không phải điểm đánh giá hoặc xác nhận phiếu hợp lệ.
- Cổng giám khảo có nút hiện/ẩn mã. Mã tự che lại khi gửi đăng nhập hoặc chuyển khỏi tab. Nút không lưu hoặc truyền mã.
- Thẻ hồ sơ, bảng dữ liệu và kho tri thức dùng cùng màu, khoảng cách và kiểu chữ.
- Không thêm migration hoặc thay đổi quyền Supabase trong lần cập nhật này.

## Tệp triển khai

Bản 1.10.0 giữ các cải tiến desktop 1.9.1 và bổ sung hướng vận hành Atlas-first. Kho tri thức có từ khóa gợi ý, hướng dẫn khi chưa đủ điều kiện sắp xếp cùng Jev và điều hướng nhanh trong hồ sơ giám khảo. Đăng nhập và trợ lý dùng cùng cơ chế khóa biểu mẫu để tránh gửi lặp. Các lỗi validation có `aria-describedby`, dấu lỗi trực quan và trả focus về trường lỗi sau khi mở khóa. Lỗi mạng hoặc hết thời gian chờ không tự gửi lại yêu cầu ghi dữ liệu.

`dist/desktop.css` chứa lớp giao diện dùng chung, được nạp sau các stylesheet hiện có. `dist/desktop-ui.js` chỉ bổ sung hiển thị trên trình duyệt. Service worker 1.10.0 lưu hai tài sản công khai này cùng trang khảo sát; API và hồ sơ riêng tư vẫn nằm ngoài cache.

## Công cụ thiết kế bên ngoài

Canva và Figma được báo là đã cài nhưng không có công cụ thao tác trong phiên cập nhật này. Higgsfield từ chối yêu cầu tạo ảnh với thông báo `Requires basic plan or higher`; không có ảnh mới được tạo. Bản giao diện được triển khai trực tiếp trong repository, sử dụng tài sản đã có. Không tuyên bố đã xuất bản thiết kế trong Canva hoặc Figma.

## Kiểm tra

Kiểm tra trực quan ở desktop 1440 × 900 và 1280 × 800; kiểm tra điều hướng, điểm khảo sát và đặt lại, hiện/ẩn mã, tra cứu kho tri thức. Có thể kiểm tra lại bằng `pnpm check` và `pnpm test`. Những kiểm tra UI không gửi phiếu thử vào dữ liệu production.
