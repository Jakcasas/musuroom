# Trợ lý tri thức & phân tích cảm quan


Musuroom hỗ trợ tra cứu có nguồn và diễn giải thống kê cảm quan. Mặc định, hệ thống hoạt động bằng kho tri thức và thuật toán thống kê; có thể kết nối OpenRouter để bổ sung câu trả lời bằng ngôn ngữ tự nhiên.

### Thiết lập kết nối

1. Tạo key trong [tài khoản OpenRouter](https://openrouter.ai/settings/keys), chọn mã model từ [danh mục chính thức](https://openrouter.ai/models) và kiểm tra quyền sử dụng, hạn mức, chi phí của tài khoản.
2. Cập nhật `.env` ở thư mục gốc dự án theo mẫu dưới đây. Thay cả hai giá trị `YOUR_...` bằng thông tin thật trước khi chạy:

   ```dotenv
   AI_PROVIDER=openrouter
   OPENROUTER_API_KEY=YOUR_OPENROUTER_API_KEY
   AI_MODEL=YOUR_OPENROUTER_MODEL_ID
   AI_TIMEOUT_MS=20000
   AI_MAX_TOKENS=700
   AI_CONTEXT_MAX_CHARS=12000
   AI_MAX_CONCURRENT=2
   AI_COOLDOWN_MS=30000
   INSIGHTS_REQUESTS_PER_MINUTE=10
   ```

3. Dừng server đang chạy rồi khởi động lại theo mục **Cài trên máy mới**. Khi triển khai cloud, đặt các biến trong cấu hình riêng tư của dịch vụ Railway rồi redeploy; `.env` trên máy không tự đồng bộ lên cloud.
4. Mở `tri-thuc.html` → **Hỏi trợ lý Musuroom**, kiểm tra thông báo kết nối và thử một câu hỏi như “Umami của nấm đến từ đâu?”. Cổng giám khảo cung cấp nhận xét cảm quan sau khi đăng nhập và chọn đợt/mã mẫu.

Key chỉ dùng ở server. Giữ `.env` ngoài Git, ZIP công khai và frontend; không gửi key vào chat. Để trở về chế độ tra cứu và thống kê tại server, đặt `AI_PROVIDER=disabled` rồi khởi động lại. Tham khảo [hướng dẫn API OpenRouter](https://openrouter.ai/docs/quickstart).

### Phạm vi hỗ trợ

| Chức năng | Dữ liệu gửi đến mô hình | Kết quả và cách đối chiếu |
|---|---|---|
| Hỏi đáp kho tri thức | Câu hỏi hiện tại và nội dung tối đa **3 bài liên quan**: mã nguồn trích dẫn, tiêu đề, tóm tắt, nội dung và giới hạn áp dụng; phần tài liệu được giới hạn dung lượng và đánh dấu nếu rút gọn | Câu trả lời kèm nguồn để mở và đọc lại. Không tìm kiếm Internet tự động. |
| Nhận xét cảm quan | Khi có ít nhất **3 phiếu hợp lệ trong cùng đợt/mã mẫu**: số phiếu, tên tiêu chí, trung bình và độ lệch chuẩn mẫu | Nhận xét mô tả ngắn. Trường `basis` luôn kèm số phiếu, đợt/mã mẫu và Mean/SD để đối chiếu. API yêu cầu quyền giám khảo/quản trị hoặc bearer token. |

Các chỉ số Mean, median, độ lệch chuẩn, phân bố điểm và radar được tính bằng thuật toán từ phiếu hợp lệ, độc lập với mô hình. Mốc 3 phiếu là điều kiện sử dụng chức năng diễn giải, không chứng minh cỡ mẫu đủ để kiểm định thống kê. Nhận xét không xác nhận nguyên nhân, an toàn thực phẩm, dinh dưỡng hay khả năng thương mại của sản phẩm.

API thống kê và nhận xét đọc phân bố tổng hợp ngay tại database: tối đa **49 dòng** cho mỗi đợt/mã mẫu, thay vì tải toàn bộ phiếu. SQLite dùng truy vấn tổng hợp; Supabase dùng hàm riêng tư `musuroom_sensory_distribution`. Mean/median/SD được tính từ phân bố 1–9. API xuất CSV vẫn đọc phiếu thô theo phân quyền.

### Nguồn, dữ liệu và chế độ dự phòng

- Giao diện hỏi đáp thông báo việc gửi câu hỏi và tài liệu liên quan đến OpenRouter khi kết nối được cấu hình. Người hỏi cần tránh nhập dữ liệu cá nhân hoặc nội dung riêng tư vào câu hỏi.
- Musuroom không lưu lịch sử hỏi đáp vào database. Luồng nhận xét cảm quan không gửi phiếu thô, góp ý tự do, tên hoặc thông tin liên hệ; chỉ gửi số liệu tổng hợp nêu trên. Việc xử lý dữ liệu tại dịch vụ bên ngoài phụ thuộc chính sách và cấu hình của dịch vụ đó.
- Hỏi đáp kiểm tra có mã trích dẫn và các mã được dùng thuộc tập nguồn đã truy xuất. Đây là kiểm tra mã nguồn trích dẫn; người đọc vẫn cần đối chiếu từng nhận định với tài liệu gốc.
- Khi dịch vụ lỗi, hết thời gian chờ, đang bận hoặc phản hồi không hợp lệ, hệ thống trả trích đoạn có nguồn (`mode=retrieval`) hoặc nhận xét thống kê (`mode=descriptive`). Không có bài phù hợp thì thông báo thiếu nội dung; dưới 3 phiếu thì chỉ trả thống kê mô tả.
- Hỏi đáp và nhận xét dùng chung giới hạn đồng thời trong mỗi tiến trình server. Sau lỗi provider, hệ thống tạm dùng kết quả dự phòng trong thời gian `AI_COOLDOWN_MS`; nếu provider yêu cầu chờ lâu hơn qua `Retry-After`, thời gian chờ có thể tăng tối đa 120 giây. Không tự gửi lại request. Đây là giới hạn tần suất/dung lượng, không phải trần chi phí tiền tệ; đặt hạn mức tài khoản tại OpenRouter để kiểm soát ngân sách.
- Thời gian chờ bao gồm việc nhận và đọc phản hồi. Server chặn redirect, giới hạn phản hồi provider ở 64 KiB và không sử dụng câu trả lời bị cắt do hết token hoặc bị provider từ chối. Không lưu cache câu hỏi/câu trả lời.

### Kiểm tra vận hành

| Tình huống | Cách xử lý |
|---|---|
| Server báo thiếu `OPENROUTER_API_KEY` hoặc `AI_MODEL` | Điền đủ hai biến khi dùng `openrouter`, hoặc chọn `disabled` để chạy chế độ mặc định. |
| Giao diện vẫn hiển thị chế độ tra cứu | Kiểm tra đã dừng server cũ và khởi động lại; biến của tiến trình có ưu tiên hơn `.env`. |
| Kết quả có `reason=provider_unavailable` | Kiểm tra kết nối mạng, key, mã model, quyền sử dụng và hạn mức OpenRouter. |
| Kết quả có `invalid_citations`, `invalid_response` hoặc `ai_busy` | Đọc kết quả dự phòng và nguồn kèm theo; có thể thử lại sau. |
| Kết quả có `provider_cooldown` | Dùng kết quả dự phòng; `retry_after` cho biết số giây có thể chờ trước khi thử lại. |
| HTTP 429 | Chờ theo header `Retry-After`; kiểm tra hạn mức hỏi đáp hoặc nhận xét theo IP. |
| Nhận xét có `too_few_responses` hoặc `no_responses` | Kiểm tra đúng đợt/mã mẫu và số phiếu hợp lệ. |

**Trạng thái kiểm chứng:** luồng OpenRouter đã được kiểm tra bằng mock, gồm phản hồi hợp lệ, giới hạn đồng thời, thời gian chờ, phản hồi quá lớn và chế độ dự phòng; chưa xác minh bằng lời gọi dịch vụ thật vì chưa cấu hình key/model. Migration tổng hợp đã áp dụng lên Supabase và kiểm tra quyền gọi; các chỉ số được kiểm thử trên SQLite/PostgreSQL. `aiEnabled` chỉ phản ánh cấu hình, không chứng minh dịch vụ đang đáp ứng. Chi tiết request, phân quyền và các trường phản hồi nằm trong [tài liệu API](docs/API.md). Tích hợp phân loại góp ý bằng Jev được hướng dẫn riêng trong [cổng giám khảo](docs/JUDGE_PORTAL.md).

