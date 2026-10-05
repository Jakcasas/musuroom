# Jev trong Musuroom 1.8.4

## Cải tiến 1.8.4

Guardrails kiểm tra văn bản sau khi chuẩn hóa NFKC và loại ký tự ẩn. Mật khẩu tiếng Việt, URI database có thông tin xác thực và private key bị chặn/che trước khi gửi. Đây vẫn là heuristic, không bảo đảm phát hiện mọi dữ liệu nhạy cảm.

Reranking truyền thêm giới hạn áp dụng của nguồn; chỉ tối đa 5 ứng viên, giới hạn JSON 18.000 bytes và rút gọn theo code point. API trả `context_truncated` khi phải rút gọn. Điểm bằng nhau giữ thứ tự gốc; các nguồn ngoài 5 ứng viên không đổi.

Bulk labeling trả `summary` gồm `total`, `jev`, `local`, `needs_review`; giao diện phân biệt nguồn tạo đề xuất. Confidence gate v2 lưu `review_reason`, `probability_margin` trong `decision_json` trên Supabase. Phân bố xác suất không hợp lệ, độ tin cậy thấp hoặc khoảng cách hai nhãn dưới 0.1 phải được đối chiếu. Ngưỡng 0.1 là chính sách chưa hiệu chuẩn trên dữ liệu nghiên cứu. Mọi đề xuất mới đều có trạng thái `pending`; `suggestion` không tự chuyển thành `confirmed`.

Hướng dẫn [MCP và xử lý lỗi key/model](JEV_MCP_SETUP.md). Key local hiện bị từ chối HTTP 401; key cloud kết nối MCP được nhưng inference vẫn bị từ chối. Không ghi nhận kết quả luật cục bộ là kết quả Jev.

## Bốn ứng dụng đã triển khai

| Case trong hình tham khảo | Trong Musuroom | Khi chưa có kết quả đáng tin cậy |
|---|---|---|
| Guardrails | Kiểm tra dấu hiệu chỉ dẫn bất thường/secret trước khi gửi, loại email và số điện thoại khỏi nội dung truyền đi | Giữ xử lý tại server, ghi lý do và cần xem lại |
| Reranking | Nút **Sắp xếp cùng Jev** trong kho tri thức; chấm mức liên quan của tối đa 5 kết quả đã khớp từ khóa | Giữ nguyên thứ tự và nguồn ban đầu |
| Bulk labeling | ADMIN phân loại 1–5 bài/lô; nhiều câu hỏi Choice trong một yêu cầu quyết định | Từng bài nhận nhãn cục bộ hoặc kết quả hợp lệ độc lập |
| Confidence gate | Ngưỡng `JEV_MIN_CONFIDENCE` mặc định 0.65, kiểm tra kiểu và phân bố xác suất | `other`, thấp ngưỡng hoặc luật cục bộ đều cần người vận hành xem lại |

Không dùng các con số chi phí/tốc độ trong hình làm cam kết của Musuroom. Chưa có benchmark dữ liệu lớn hay bộ đánh giá để hiệu chuẩn confidence. Các nhãn chỉ là đề xuất nghiên cứu, không phê duyệt an toàn thực phẩm.

## Cách sử dụng

**Kho tri thức:** nhập từ khóa → đọc kết quả và nguồn → nếu muốn sắp xếp lại, chọn ô đồng ý và bấm **Sắp xếp cùng Jev**. Không gửi dữ liệu khi đang gõ. Bỏ chọn đồng ý sẽ hủy chờ và khôi phục thứ tự tìm kiếm; phản hồi đến muộn bị bỏ qua. Yêu cầu đã gửi trước đó có thể vẫn được provider xử lý. Chỉ sắp xếp kết quả đã tìm thấy, không tìm/bổ sung nguồn ngoài kho. Những bài sau 5 kết quả đầu giữ thứ tự ban đầu. Từ khóa không lưu vào database.

**Quản trị:** đăng nhập ADMIN → Kho dữ liệu → đánh dấu cụ thể 1–5 bài tri thức trong bảng → **Xem yêu cầu của lô** để đọc JSON → **Phân loại bài đã chọn**. Không tự chọn 5 bài đầu. Bỏ chọn đồng ý để dùng luật từ khóa tại server. Đổi các bài được chọn sẽ bỏ đồng ý và xóa bản xem trước cũ. Lô giới hạn tiêu đề/tóm tắt/hạn chế 350 Unicode code points mỗi trường, thân bài 1.000 code points/bài; nếu JSON UTF-8 vượt 18.000 bytes, server rút gọn thêm và đánh dấu `truncated`. Ngân sách dành chỗ cho envelope MCP trong giới hạn 20.000 bytes. Preview và phân loại dùng cùng một hàm dựng request; preview không gọi JevAI. Bản phân loại đơn dùng giới hạn riêng lớn hơn.

**Đối chiếu:** lọc Tất cả / Chưa đối chiếu / Đã đối chiếu / Không sử dụng / Bài nguồn đã thay đổi; mở **Chi tiết đề xuất** để đọc confidence hoặc từ khóa/lý do cục bộ. Chuyển trang trước/sau và tải JSON trang đề xuất theo bộ lọc. Số lượng hiển thị thuộc trang hiện tại, không phải tổng toàn kho. Mở bài gốc từ hàng chờ, đọc nguồn và giới hạn áp dụng; chọn **Đã đối chiếu** hoặc **Không sử dụng**. Hai thao tác lưu trạng thái và audit, không sửa category hay nội dung công bố. Bài đã thay đổi hoặc đề xuất đã được thay thế trả HTTP 409; phân loại lại trước khi đối chiếu.

## Cấu hình riêng tư

Key chỉ từ [JevAI /agent/keys](https://www.jevai.org/agent/keys). Model cố định `typesafe-ai/jev`.

```dotenv
JEV_ENABLED=true
JEV_API_KEY=<lưu riêng tại server>
JEV_MODEL=typesafe-ai/jev
JEV_TRANSPORT=mcp
JEV_MIN_CONFIDENCE=0.65
```

`mcp` gọi `POST https://www.jevai.org/api/mcp`, JSON-RPC `tools/call` với `jev_decide`. `rest` gọi `POST https://www.jevai.org/api/v1/decisions`; mặc định rest để giữ cấu hình cũ. Chỉ dùng một transport cho mỗi yêu cầu; không tự chuyển provider hoặc gửi key sang API TypeSafe trực tiếp. Xem [hướng dẫn MCP chính thức](https://www.jevai.org/mcp).

**Xác thực hiện tại:** kiểm tra thật qua MCP vẫn trả lỗi credentials/model access. Chưa có inference thành công với key đã lưu. Website tiếp tục hoạt động bằng tìm kiếm/luật cục bộ; việc sửa quyền key cần thực hiện trong tài khoản JevAI. Các nhánh mô hình thành công được kiểm thử bằng mock có kiểm tra schema.

## Lưu trữ và giới hạn

- PostgreSQL/SQLite lưu đề xuất gần nhất mỗi bài ở `knowledge_decision_reviews`: revision, hash nội dung, version quyết định, kết quả và trạng thái đối chiếu. Không lưu khóa, câu tìm kiếm hoặc góp ý cảm quan thô vào bảng này. Các đề xuất này chưa được mirror sang Atlas; kho Atlas vẫn theo projection đã mô tả trong [MongoDB/Jev](MONGODB_JEV.md).
- Bảng riêng tư, RLS bật; `anon` và `authenticated` không có quyền. Mọi API quản trị yêu cầu ADMIN và CSRF. Jev không cấp quyền hay thực thi công cụ.
- Lô tối đa 5 bài; tối đa 3 thao tác lô/phút theo IP, tìm kiếm Jev 5/phút. Tối đa 2 yêu cầu Jev đang chạy chung trong một tiến trình server. Giới hạn này chưa phải quota dùng chung giữa nhiều replica.
- Request tối đa 20.000 bytes, phản hồi tối đa 64 KiB, deadline chung `AI_TIMEOUT_MS`. Một retry 429/529 nếu Retry-After ≤3 giây; có thể có thêm một HTTP request khi retry. `jev_requests` của lô đếm yêu cầu quyết định được thử, không phải token hay phí đã tính.
- Luật từ khóa ưu tiên tiêu đề bài, khớp tiếng Việt nguyên từ/cụm từ; hòa điểm trả `other`. Không tạo confidence giả cho luật cục bộ.
- Guardrails là heuristic giảm rủi ro, không phát hiện mọi kiểu injection hoặc dữ liệu cá nhân. Không đưa tên, liên hệ hoặc bí mật vào ô góp ý/từ khóa.

## Triển khai và kiểm chứng

1. Giữ `.env`, `data/cloud.env` và tài khoản truy cập ngoài Git. Đặt `JEV_TRANSPORT=mcp` trong biến Railway để dùng giao thức đã kiểm tra tại JevAI.
2. Áp dụng migration `knowledge_decision_reviews`; đồng bộ tên version/nội dung với lịch sử Supabase. Giữ nguyên cả 6 migration lịch sử đã công bố; bản 1.7.0 không thêm migration.
3. Chạy `pnpm test`, `pnpm check`, `pnpm db:check-history` và kiểm tra Supabase Preview trước khi coi bản phát hành hoàn tất.
4. Triển khai Railway, kiểm tra `/healthz` trả 1.7.0/PostgreSQL ok và trang tri thức/cổng giám khảo. Tạo QR sau khi xác nhận URL; upload lại tài nguyên QR theo [hướng dẫn cloud](DEPLOY_RAILWAY_SUPABASE.md).
