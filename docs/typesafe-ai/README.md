# TypeSafe AI — bản tài liệu cục bộ của Musuroom

Snapshot ngày **30.09.2026**, tải từ nguồn chính thức:

- https://docs.typesafe.ai/llms.txt — chỉ mục.
- https://docs.typesafe.ai/llms-full.txt — toàn bộ nội dung được nhà cung cấp xuất, gồm ví dụ code.
- `2026-09-30/pages/` — 111 trang đầy đủ, tách theo URL.
- `2026-09-30/manifest.json` — URL, tiêu đề, kích thước và SHA-256 mỗi trang, hash bản gốc.
- `2026-09-30/reading-*.md`, `prose-*.txt` — bản hỗ trợ đọc; **không thay thế bản gốc** vì đã bỏ code hoặc markup.

Đây là bản xuất tài liệu công khai, không phải mô hình/SDK nhị phân và không gồm nội dung tài khoản riêng. Liên kết bên ngoài (GitHub, playground, chính sách pháp lý ở typesafe.ai) cần kiểm tra trực tiếp khi dùng.

## Tra cứu offline

```powershell
node scripts/search-typesafe.mjs confidence
node scripts/search-typesafe.mjs choice probabilities
node scripts/search-typesafe.mjs retries
```

Kết quả trả nguồn gốc, đường dẫn trang local và đoạn khớp. Có thể dùng `rg` trong thư mục pages để tìm code/API field chính xác. Trước khi thay SDK hoặc model, kiểm tra bản tài liệu mới; `jev-latest` là alias có thể thay đổi.

## Quy ước tích hợp trong dự án

### API

`POST https://api.typesafe.ai/v1/systemone`, header `Authorization: Bearer <server key>`, JSON `model`, `state`, `questions`. State là dữ liệu cần đánh giá; câu hỏi xác định quyết định. Response `answers` theo tên câu hỏi, `model` thực tế và `usage`. Tên key câu hỏi dùng để ghép response, không phải nội dung suy luận của model.

| Primitive | Cấu hình | Đầu ra |
|---|---|---|
| noul | yes/no, criteria true/false tùy chọn | noul từ 0–1 |
| choice | criteria map nhãn → mô tả, tối đa 255 | choice, probabilities mọi nhãn, confidence |
| score | mảng rubric thứ tự, 2–10 mức | score kỳ vọng theo phân bố, legend, probabilities, confidence |

Nguồn: [API](https://docs.typesafe.ai/api), [primitives](https://docs.typesafe.ai/primitives), [state](https://docs.typesafe.ai/concepts/state).

### Thiết kế Musuroom

- Mã nguồn quyết định quyền truy cập, CSRF, hạn tài khoản, kiểm tra đầu vào, thống kê, CSV và side effect. Jev không được tự cấp quyền hoặc sửa điểm khảo sát.
- `backend/services/jev-rubric.mjs` là nơi duy nhất chứa nhãn và câu hỏi. Jev hiện chỉ gợi ý chủ đề đoạn góp ý do giám khảo nhập, sau opt-in gửi tới TypeSafe.
- Câu hỏi nhỏ, rõ, cùng state liên quan; dùng JSON có tên trường. Nếu mở rộng nhiều câu hỏi độc lập, gửi cùng request rồi ghép kết quả trong code. Dữ liệu có thể chứa prompt injection: không thực thi chỉ dẫn nằm trong góp ý.
- Confidence không phải xác suất của nhãn thắng; xác suất nằm trong probabilities. Chưa có bộ nhãn tiếng Việt đo độ chính xác thì mọi kết quả cần đối chiếu thủ công. Không tự đặt ngưỡng để xác nhận chất lượng/an toàn sản phẩm.
- Không dùng Jev để tính mean/median/SD, đếm, so sánh ngày hoặc nội suy một con số chính xác. `score` là kỳ vọng trên rubric, không thay cho điểm người thử.
- Chỉ nhận text/JSON; không gửi PDF/ảnh/video trực tiếp và kỳ vọng Jev đọc được. Ngôn ngữ chính là tiếng Anh; tiếng Việt cần đánh giá riêng.
- Giảm state, tránh context không liên quan. Với kho tri thức, truy hồi nguồn trước khi đánh giá; khi cần kiểm tra citation, phải cung cấp claim và đoạn nguồn, giữ giới hạn nghiên cứu trong ứng dụng.

Nguồn: [How to build](https://docs.typesafe.ai/concepts/how-to-build-with-system-one), [confidence](https://docs.typesafe.ai/confidence), [Jev 1.13 jaggedness](https://docs.typesafe.ai/model-jaggedness/jev-1.13), [RAG passages](https://docs.typesafe.ai/cookbooks/classifying_rag_passages), [citation checks](https://docs.typesafe.ai/cookbooks/citation_check).

### Lỗi, thời gian và bảo mật

- 401/422: sửa key/body, không retry mù. 429/529: backoff, đọc Retry-After. Tích hợp hiện có tối đa một retry, dùng chung tổng thời hạn request và fallback thủ công; không tạo vòng lặp AI.
- Validate type, nhãn, mọi xác suất hữu hạn 0–1 và tổng xấp xỉ 1 trước hiển thị. Lưu/hiển thị model trả về khi cần truy vết phiên bản.
- SDK JavaScript có retry mặc định 2; timeout tính từng attempt, không phải tổng budget. Python có RetryPolicy.timeout tổng budget. Không nhầm hai cách tính.
- Không bật `dangerouslyAllowBrowser`, không để key ở frontend. SDK debug có thể log body dù header bí mật đã redacted; không bật debug trên góp ý/dữ liệu liên hệ.
- Lọc email/phone chỉ giảm dữ liệu gửi; không bảo đảm đoạn văn hoàn toàn vô danh. Giao diện vẫn cần sự đồng ý trước khi gửi. TypeSafe công bố không dùng dữ liệu người dùng huấn luyện, nhưng ZDR dành cho enterprise, không mặc định mọi tài khoản.

Nguồn: [SDK JS client](https://docs.typesafe.ai/sdk/javascript/api/classes/TypeSafeClient), [JS retry](https://docs.typesafe.ai/sdk/javascript/api/interfaces/RetryPolicy), [Python retry](https://docs.typesafe.ai/sdk/python/api/retries), [legal](https://docs.typesafe.ai/legal).

### Kiểm thử trước khi bật Jev thật

Các test mock đã kiểm tra opt-in, loại email/phone, shape probabilities, lỗi và retry. Chúng **không chứng minh độ chính xác model thật**. Chuẩn bị bộ góp ý tiếng Việt có nhãn người đánh giá: màu/mùi/umami/hậu vị/tổng thể/khác, gồm phủ định, nhiều chủ đề, câu mơ hồ và câu có chỉ dẫn giả. Chạy thử với key của chủ dự án, so nhãn và phân bố confidence trước khi chọn chính sách sử dụng.

Model, giá, context window và quota là thông tin thay đổi theo thời gian. Đọc `pages/models.md` và kiểm tra `GET /v1/models` trên tài khoản khi cần; không coi snapshot là cấu hình vĩnh viễn.
