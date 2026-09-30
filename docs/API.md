# REST API — Musuroom 1.3

Base URL mặc định: `http://127.0.0.1:8766`. Request có body phải dùng `Content-Type: application/json`, giới hạn 16 KB. Server không bật CORS; request từ origin khác bị từ chối. Database và `.env` không được phục vụ qua HTTP.

| Method | Endpoint | Mục đích | Xác thực |
|---|---|---|---|
| GET | `/healthz` | Kiểm tra ứng dụng/database | Không |
| GET | `/api/status` | Trạng thái AI và số bài, không chứa secret | Không |
| GET | `/api/knowledge?q=umami&category=Hương%20vị` | Tìm bài có/không dấu | Không |
| GET | `/api/knowledge/:id` | Bài và thông tin nguồn | Không |
| POST | `/api/estimate` | Tính mẻ, không lưu | Không |
| GET | `/api/batches?limit=20&offset=0` | Đọc các mẻ đã lưu | ADMIN hoặc bearer token |
| GET | `/api/batches/:id` | Chi tiết mẻ | ADMIN hoặc bearer token |
| POST | `/api/batches` | Tính và lưu mẻ | ADMIN hoặc bearer token |
| POST | `/api/chat` | Trợ lý có nguồn | Cùng origin, giới hạn tần suất |
| POST | `/api/v1/sensory/submit` | Gửi phiếu Hedonic 1–9 | Không |
| GET | `/api/v1/sensory/analytics?session_code=...&sample_code=...` | Mean, median, SD và radar | JUDGE/ADMIN hoặc bearer token |
| POST | `/api/v1/sensory/export` | CSV phiếu thô của một đợt và mã mẫu | JUDGE/ADMIN hoặc bearer token |
| POST | `/api/v1/sensory/insights` | Nhận xét mô tả hoặc AI tùy chọn từ số liệu tổng hợp | JUDGE/ADMIN hoặc bearer token |
| POST | `/api/v1/leads/register` | Đăng ký quan tâm nhận mẫu thử | Không |
| GET | `/api/v1/admin/leads?status=PENDING` | Danh sách có thông tin liên hệ | ADMIN hoặc bearer token |
| PATCH | `/api/v1/admin/leads/:id` | Cập nhật trạng thái | ADMIN hoặc bearer token |
| DELETE | `/api/v1/admin/leads/:id` | Xóa đăng ký | ADMIN hoặc bearer token |

Token quản trị được tạo khi chạy setup, lưu ở `API_WRITE_TOKEN` trong `.env`. Đặt header `Authorization: Bearer <API_WRITE_TOKEN>` cho API mẻ, thống kê cảm quan và danh sách đăng ký; không đưa token vào JavaScript frontend hoặc URL. Nếu không dùng bearer token, đăng nhập để lấy cookie phiên; quyền ADMIN cho API mẻ/đăng ký và JUDGE hoặc ADMIN cho cảm quan. Mọi thao tác POST/PATCH/DELETE bằng cookie cần header `X-CSRF-Token` từ phiên.

## Phiên đăng nhập và hồ sơ riêng tư

| Method | Endpoint | Mục đích | Quyền |
|---|---|---|---|
| POST | `/api/v1/judge/verify` hoặc `/api/v1/auth/login` | Body `{"access_code":"UUID.secret"}`, tạo cookie phiên | Mã còn hiệu lực |
| GET | `/api/v1/auth/session` | Trả user, expires_at, csrf_token | Cookie phiên |
| POST | `/api/v1/auth/logout` | Thu hồi phiên và xóa cookie, trả 204 | JUDGE/ADMIN + CSRF |
| GET | `/api/v1/judge/dossier` | Tổng quan, metadata và URL tải từng hồ sơ | JUDGE/ADMIN |
| GET | `/api/v1/judge/groups` | Các đợt/mẫu và số phiếu để chọn thống kê | JUDGE/ADMIN |
| GET | `/api/v1/judge/documents/:id` | Tải file có kiểm tra SHA-256 và kích thước | JUDGE/ADMIN |
| POST | `/api/v1/judge/classify` | Jev phân loại góp ý có opt-in | JUDGE/ADMIN + CSRF |

Login trả `Set-Cookie` HttpOnly/SameSite=Strict và JSON `{user:{id,name,role},expires_at,csrf_token}`. Gửi cookie cùng request; đặt `X-CSRF-Token` khi thay đổi dữ liệu. Không trả lại mã truy cập. Mã hết hạn/vô hiệu hoặc phiên hết hạn/idle trả 401; sai quyền hoặc CSRF trả 403. Tạo và thu hồi tài khoản qua CLI, không có API tự cấp quyền. Danh sách hồ sơ chứa `id,title,doc_type,mime,size_bytes,sha256,evidence_status,created_at,download_url`; file tải là attachment. Không trả đường dẫn tệp hệ thống.

Jev body `{"comment":"Mùi nấm rõ","allow_remote":true}`. Góp ý 3–1.000 ký tự. Khi bật Jev và kết quả hợp lệ, trả `mode:jev,key,label,confidence,probabilities,message`; lỗi hoặc chưa bật trả `mode:manual,reason,label:null,message`. API không dùng Jev để cấp quyền hoặc sửa điểm. Hướng dẫn vận hành trong [JUDGE_PORTAL.md](JUDGE_PORTAL.md).

## Khảo sát cảm quan

Gửi phiếu:

```json
{
  "session_code":"ROUND-01",
  "sample_code":"MUSH-01",
  "tester_type":"CONSUMER",
  "color_score":7,
  "aroma_score":8,
  "umami_taste_score":8,
  "aftertaste_score":6,
  "overall_acceptance":8,
  "comments":"Mùi nấm rõ",
  "submission_key":"a82cf87a-6d5e-4cf2-8b39-552f278bc708"
}
```

Mọi điểm bắt buộc là **số nguyên 1–9**. `tester_type`: `JUDGE`, `STUDENT`, `CONSUMER`, `OTHER`. `session_code` và `sample_code`: 3–50 ký tự ASCII chữ/số, `_` hoặc `-`. `comments` tối đa 1.000 ký tự, tùy chọn. `submission_key` là UUID tùy chọn để retry an toàn: gửi lại cùng mã và nội dung nhận 200 với cùng ID; cùng mã nhưng nội dung khác nhận 409. Phiếu mới nhận 201. Không thu tên hoặc liên hệ trong phiếu cảm quan.

Analytics bắt buộc có **cả `session_code` và `sample_code`**. Mỗi tiêu chí trả `n`, `mean`, `median`, `sd`, `distribution` (số lượng ở từng mức 1–9). `radar.labels` và `radar.values` theo thứ tự: màu sắc, mùi thơm, vị umami, hậu vị, ưa thích chung. Mọi số tính trên cùng tập phiếu hợp lệ của đợt và mẫu được chọn. `mean = Σx/n`; `median` là trung vị; `sd = sqrt(Σ(x−mean)²/(n−1))` là **độ lệch chuẩn mẫu**. Mean và SD làm tròn 4 chữ số thập phân sau khi tính. Nếu `n=0`, mean/median/SD là `null`; nếu `n=1`, SD là `null`. Không thực hiện ANOVA hoặc suy luận ý nghĩa thống kê.

Xuất CSV bằng `POST /api/v1/sensory/export`, body `{"session_code":"ROUND-01","sample_code":"MUSH-01"}`. CSV UTF-8 có BOM, bao gồm phiếu thô của nhóm được chọn. Nội dung nhận xét bắt đầu bằng ký tự công thức bảng tính được vô hiệu hóa khi xuất.

Nhận xét `POST /api/v1/sensory/insights` dùng body giống export. Khi AI tắt, API trả nhận xét mô tả kèm `basis` gồm số phiếu và Mean/SD. Khi AI bật và có từ 3 phiếu, chỉ **số liệu tổng hợp** được gửi đến OpenRouter; nhận xét thô và thông tin đăng ký mẫu không được gửi. AI lỗi hoặc trả kết quả không hợp lệ thì dùng nhận xét mô tả. Câu chữ AI cần được đối chiếu với số liệu, không được xem là kiểm định thống kê.

Ví dụ PowerShell gửi phiếu:

```powershell
Invoke-RestMethod -Uri 'http://127.0.0.1:8766/api/v1/sensory/submit' -Method Post -ContentType 'application/json' -Body '{"session_code":"ROUND-01","sample_code":"MUSH-01","tester_type":"CONSUMER","color_score":7,"aroma_score":8,"umami_taste_score":8,"aftertaste_score":6,"overall_acceptance":8}'
```

## Đăng ký mẫu thử

```json
{
  "full_name":"Nguyễn An",
  "phone_or_email":"an@example.com",
  "organization_type":"INDIVIDUAL",
  "dietary_preference":"VEGAN",
  "consent":true
}
```

`organization_type`: `INDIVIDUAL`, `RESTAURANT`, `FOOD_BUSINESS`, `OTHER`; mặc định `INDIVIDUAL`. `dietary_preference`: `NONE`, `VEGAN`, `LOW_SODIUM`, `FAMILY`, `OTHER`; mặc định `NONE`. `shipping_address` tùy chọn tối đa 300 ký tự; nên chỉ bổ sung khi thực sự cần gửi mẫu. `consent:true` là bắt buộc để lưu liên hệ. Response không lặp lại tên hay địa chỉ, và chỉ xác nhận **đã nhận đăng ký**, không hứa gửi mẫu. Email không phân biệt hoa/thường; đăng ký trùng trả cùng ID và trạng thái.

Danh sách có thông tin cá nhân chỉ đọc được bằng phiên ADMIN hoặc bearer token quản trị. `status`: `PENDING`, `SENT`, `FEEDBACK_RECEIVED`, `CANCELLED`; có thể lọc danh sách theo trạng thái. `PATCH` cập nhật trạng thái, `DELETE` xóa đăng ký. Khi nhận yêu cầu xóa dữ liệu, người vận hành dùng API quản trị; tránh đưa file SQLite vào nơi chia sẻ.

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
