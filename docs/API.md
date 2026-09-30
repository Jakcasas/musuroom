# REST API — Musuroom 1.1

Base URL mặc định: `http://127.0.0.1:8766`. Request có body phải dùng `Content-Type: application/json`, giới hạn 16 KB. Server không bật CORS; request từ origin khác bị từ chối. Database và `.env` không được phục vụ qua HTTP.

| Method | Endpoint | Mục đích | Xác thực |
|---|---|---|---|
| GET | `/healthz` | Kiểm tra ứng dụng/database | Không |
| GET | `/api/status` | Trạng thái AI và số bài, không chứa secret | Không |
| GET | `/api/knowledge?q=umami&category=Hương%20vị` | Tìm bài có/không dấu | Không |
| GET | `/api/knowledge/:id` | Bài và thông tin nguồn | Không |
| POST | `/api/estimate` | Tính mẻ, không lưu | Không |
| GET | `/api/batches?limit=20&offset=0` | Đọc các mẻ đã lưu | Bearer token |
| GET | `/api/batches/:id` | Chi tiết mẻ | Bearer token |
| POST | `/api/batches` | Tính và lưu mẻ | Bearer token |
| POST | `/api/chat` | Trợ lý có nguồn | Cùng origin, giới hạn tần suất |

Token quản trị được tạo khi chạy setup, lưu ở `API_WRITE_TOKEN` trong `.env`. Đặt header `Authorization: Bearer <API_WRITE_TOKEN>` cho API mẻ; không đưa token vào JavaScript frontend hoặc URL. Nếu token trống, API mẻ từ chối truy cập.

## Tính và lưu mẻ

Body cho `/api/estimate`:

```json
{"mass":100,"reject":10,"initial":88,"final":8,"loss":5}
```

Các giá trị là số JSON, không phải chuỗi. Mass tính bằng kg; các tỷ lệ tính bằng %. Độ ẩm sau sấy phải nhỏ hơn hoặc bằng độ ẩm ban đầu. Mass: 0,01–1.000.000 kg; reject/loss: 0–100; độ ẩm: 0–99,99.

Kết quả trả `errors`, `accepted`, `rejected`, `powder`, `yield`. Trường `yield` là tỷ lệ % trên đầu vào. Đầu vào không hợp lệ: HTTP 422 với lỗi theo trường.

Với `/api/batches`, thêm `name` (1–120 ký tự), `notes` tùy chọn (tối đa 2.000 ký tự). Server luôn tự tính kết quả. Thành công: HTTP 201, header Location và bản ghi có UUID, ngày tạo, công thức `mass-balance-1`.

Ví dụ PowerShell chỉ tính, không lưu:

```powershell
Invoke-RestMethod -Uri 'http://127.0.0.1:8766/api/estimate' -Method Post -ContentType 'application/json' -Body '{"mass":100,"reject":10,"initial":88,"final":8,"loss":5}'
```

## Trợ lý

```json
{"question":"Hoạt độ nước khác độ ẩm như thế nào?"}
```

`question`: 2–1.000 ký tự. Response:

```json
{
  "mode":"retrieval",
  "reason":"ai_disabled",
  "answer":"Trích đoạn liên quan... [4]",
  "sources":[{"ref":4,"id":"hoat-do-nuoc","title":"...","citation":"...","url":"https://...","year":"1984","libraryUrl":"tri-thuc.html?doc=hoat-do-nuoc"}]
}
```

`mode=ai` khi provider trả lời hợp lệ; có thêm `model`. `mode=retrieval` là trích nội dung theo từ khóa, không phải AI sinh văn bản. `reason` có thể là `ai_disabled`, `no_matches`, `provider_unavailable`, `invalid_response`, `invalid_citations`, `ai_busy`. Giới hạn mặc định 10 câu/phút cho toàn bộ server local, tối đa 2 yêu cầu AI đồng thời. Vượt giới hạn trả 429 + `Retry-After`.

## Mã lỗi

400: query/JSON/URL không hợp lệ. 401: thiếu hoặc sai token. 403: đường dẫn, host hoặc origin không được phép. 404: không tồn tại. 405: method static không hỗ trợ. 413: body quá lớn. 415: sai Content-Type. 422: dữ liệu không hợp lệ. 429: vượt tần suất. 500: lỗi nội bộ (không trả stack trace hoặc secret).
