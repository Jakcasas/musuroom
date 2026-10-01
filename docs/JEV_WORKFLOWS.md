# Jev trong Musuroom 1.6.0

## Bốn ứng dụng đã triển khai

| Case trong hình tham khảo | Trong Musuroom | Khi chưa có kết quả đáng tin cậy |
|---|---|---|
| Guardrails | Kiểm tra dấu hiệu chỉ dẫn bất thường/secret trước khi gửi, loại email và số điện thoại khỏi nội dung truyền đi | Giữ xử lý tại server, ghi lý do và cần xem lại |
| Reranking | Nút **Sắp xếp cùng Jev** trong kho tri thức; chấm mức liên quan của tối đa 5 kết quả đã khớp từ khóa | Giữ nguyên thứ tự và nguồn ban đầu |
| Bulk labeling | ADMIN phân loại 1–5 bài/lô; nhiều câu hỏi Choice trong một yêu cầu quyết định | Từng bài nhận nhãn cục bộ hoặc kết quả hợp lệ độc lập |
| Confidence gate | Ngưỡng `JEV_MIN_CONFIDENCE` mặc định 0.65, kiểm tra kiểu và phân bố xác suất | `other`, thấp ngưỡng hoặc luật cục bộ đều cần người vận hành xem lại |

Không dùng các con số chi phí/tốc độ trong hình làm cam kết của Musuroom. Chưa có benchmark dữ liệu lớn hay bộ đánh giá để hiệu chuẩn confidence. Các nhãn chỉ là đề xuất nghiên cứu, không phê duyệt an toàn thực phẩm.

## Cách sử dụng

**Kho tri thức:** nhập từ khóa → đọc kết quả và nguồn → nếu muốn sắp xếp lại, chọn ô đồng ý và bấm **Sắp xếp cùng Jev**. Không gửi dữ liệu khi đang gõ. Chỉ sắp xếp kết quả đã tìm thấy, không tìm/bổ sung nguồn ngoài kho. Những bài sau 5 kết quả đầu giữ thứ tự ban đầu. Từ khóa không lưu vào database.

**Quản trị:** đăng nhập ADMIN → Kho dữ liệu → chọn nhóm Tri thức → phân loại một bài hoặc **Phân loại 5 bài trong trang**. Bỏ chọn đồng ý để dùng luật từ khóa tại server. Nếu trang có hơn 5 bài, thao tác lô chỉ lấy 5 bài đầu; chọn bài còn lại để phân loại riêng. Lô Jev gửi tiêu đề/tóm tắt/hạn chế tối đa 350 ký tự mỗi trường, thân bài tối đa 1.000 ký tự/bài; xem JSON bài trước khi thực hiện. Bản phân loại đơn dùng giới hạn riêng lớn hơn ở yêu cầu preview.

**Đối chiếu:** mở bài gốc từ hàng chờ, đọc nguồn và giới hạn áp dụng; chọn **Đã đối chiếu** hoặc **Không sử dụng**. Hai thao tác lưu trạng thái và audit, không sửa category hay nội dung công bố. Bài đã thay đổi hoặc đề xuất đã được thay thế trả HTTP 409; phân loại lại trước khi đối chiếu.

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
2. Áp dụng migration `knowledge_decision_reviews`; đồng bộ tên version/nội dung với lịch sử Supabase. Không sửa 5 migration lịch sử đã công bố.
3. Chạy `pnpm test`, `pnpm check`, `pnpm db:check-history` và kiểm tra Supabase Preview trước khi coi bản phát hành hoàn tất.
4. Triển khai Railway, kiểm tra `/healthz` trả 1.6.0/PostgreSQL ok và trang tri thức/cổng giám khảo. Tạo QR sau khi xác nhận URL; upload lại tài nguyên QR theo [hướng dẫn cloud](DEPLOY_RAILWAY_SUPABASE.md).
