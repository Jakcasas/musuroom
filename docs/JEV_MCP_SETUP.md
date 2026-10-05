# MCP Jev trong Codex và xử lý lỗi truy cập

## Kết nối Codex

Jev dùng duy nhất `https://www.jevai.org/api/mcp` và personal Bearer key tạo tại [Jev Keys](https://www.jevai.org/agent/keys). Không dùng cookie đăng nhập hoặc key từ dịch vụ khác. [Giao thức Jev chính thức](https://www.jevai.org/mcp).

1. Lưu key vào `JEV_API_KEY` trong `.env` riêng tư của dự án. Không đưa file này vào Git.
2. Chạy `pnpm mcp:install-jev` để thêm server `jev` vào cấu hình Codex của người dùng. Script sao lưu cấu hình trước khi thêm, không ghi đè server Jev đã tồn tại.
3. Trong Codex mở **Settings → MCP servers → Restart**. Gõ `/mcp` để kiểm tra các công cụ đã nạp.

Server dùng `http_headers_helper` để đọc key từ `.env`; `config.toml` chỉ lưu URL và lệnh helper, không chứa key. Helper dùng Node 24 trên máy cài đặt và đường dẫn dự án hiện tại. Sau khi di chuyển dự án, cập nhật đường dẫn helper trong Settings. Không chạy helper trực tiếp trong terminal: stdout là kênh thông tin xác thực dành riêng cho MCP client.

Sau khi thay key, Restart kết nối MCP để xóa header đã cache. Khởi động lại backend local; cập nhật `JEV_API_KEY` trong Railway và redeploy để ứng dụng production sử dụng key mới. Thêm MCP vào Codex không tự cập nhật Railway.

Tham khảo [cấu hình MCP trong Codex](https://learn.chatgpt.com/docs/extend/mcp?surface=cli) và [HTTP headers helper](https://learn.chatgpt.com/docs/config-file/config-reference).

## Kiểm tra từng bước

```powershell
pnpm jev:diagnose
pnpm jev:diagnose --cloud
```

Lệnh kiểm tra `initialize`, `tools/list`, sau đó gọi đúng một `jev_decide` bằng câu minh họa, không đọc phiếu hoặc liên hệ người dùng. Lần gọi quyết định có thể sử dụng quota Jev. Kết quả chỉ chứa trạng thái HTTP, bước kiểm tra và mã lý do; không in key, phản hồi thô hoặc xác suất. Chỉ `inference_verified: true` xác nhận đã nhận quyết định hợp lệ, không chỉ dựa vào HTTP 200.

| Mã lý do | Cách xử lý |
|---|---|
| `missing_key` | Lưu personal key từ Jev Keys vào file riêng tư |
| `http_auth_rejected` | Server trả 401/403: kiểm tra key bị thay/thất hiệu lực, personal key đúng tài khoản và header Bearer |
| `inference_credentials_or_model_rejected` | HTTP 200 nhưng `tools/call` trả `isError`: server từ chối credentials hoặc quyền model. Không đủ thông tin để kết luận riêng key sai hay model thiếu quyền |
| `quota_or_rate_limit` | Kiểm tra hạn mức tại tài khoản Jev và chờ theo chính sách dịch vụ |
| `network_timeout_or_invalid_response` / `provider_unavailable` | Kiểm tra mạng và trạng thái Jev; không tắt TLS hoặc gửi key sang host khác |
| `invalid_decision_response` | Phản hồi chưa qua kiểm tra schema; dùng dự phòng và lưu kết quả chẩn đoán để kiểm tra mã kết nối |

## Kết quả thực tế ngày 05.10.2026

Hai file cấu hình hiện có key khác nhau: key `.env` local bị từ chối HTTP 401 ngay ở initialize; key `data/cloud.env` trả HTTP 200 ở initialize và tools/list, đủ 6 công cụ. `jev_decide` với model `typesafe-ai/jev` vẫn trả `isError` credentials/model access; lần thử model mặc định trước đó cũng bị từ chối. Hai bước đầu không chạy model và không chứng minh key có quyền suy luận. Không tự ghi đè key local bằng key cloud vì chưa có key nào xác nhận inference thành công.

Thực hiện tại tài khoản Jev:

1. Đăng nhập đúng tài khoản tại Jev Keys, thay personal key rồi lưu key mới vào `.env` (và cấu hình Railway nếu dùng production).
2. Thử một preset tại [Jev Agent](https://www.jevai.org/agent). Preset dùng phiên đăng nhập; MCP/REST dùng personal key riêng nên hai kết quả không tương đương.
3. Nếu preset cũng bị từ chối, yêu cầu phía Jev kiểm tra quyền model/credentials của dịch vụ. Nếu preset chạy nhưng API key bị từ chối, yêu cầu kiểm tra việc cấp và xác thực personal key.
4. Gửi cho hỗ trợ Jev thời điểm thử, endpoint, model và kết quả chẩn đoán đã lọc. Không gửi key hoặc thông tin database.

Không thay model/provider tự động hoặc lặp nhiều yêu cầu lỗi. Musuroom tiếp tục phân loại bằng luật cục bộ, ghi rõ nguồn và yêu cầu đối chiếu. Mã nguồn phía ứng dụng không thể tự cấp quyền model hoặc sửa credentials ở máy chủ Jev.
