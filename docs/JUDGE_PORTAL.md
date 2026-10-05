# Cổng Ban Giám Khảo FID 2026 — Musuroom 1

## Mở và đăng nhập

Khởi động bằng `MO_MUSUROOM.cmd`, mở `http://127.0.0.1:8766/giam-khao.html`. Mã giám khảo máy này nằm trong `data/judge-access.json`; mã quản trị nằm trong `data/admin-access.json`. Sao chép riêng giá trị **access_code** vào ô đăng nhập. Các tệp này không được phục vụ qua HTTP và không nằm trong ZIP/Git. Giữ chúng trên máy của người vận hành; chỉ cung cấp mã giám khảo cho người được phép xem hồ sơ.

Tài khoản cấp lúc hoàn thiện có thời hạn 7 ngày; xem `expires_at` trong JSON. Phiên mặc định tối đa 120 phút, kết thúc sau 20 phút không hoạt động, hoặc khi tài khoản hết hạn/bị thu hồi. Đăng xuất khi dùng máy chung.

| Quyền | Hồ sơ, cảm quan, CSV, Jev | Liên hệ đăng ký mẫu, cập nhật trạng thái, lưu mẻ |
|---|---|---|
| JUDGE | Có | Không |
| ADMIN | Có | Có |

Giao diện giám khảo chỉ tải dữ liệu riêng tư sau khi xác thực. Form khảo sát và đăng ký mẫu ở `trai-nghiem.html` nhận dữ liệu trực tiếp qua API. Liên kết điền sẵn mã: `http://127.0.0.1:8766/trai-nghiem.html?session=ROUND-01&sample=MUSH-01`. Vai trò người thử tự khai trong phiếu không cấp quyền đăng nhập.

## Cấp mã riêng cho từng người

### Mã Giám khảo mặc định · 1.8.3

`JUDGE_DEFAULT_ACCOUNT_ID` trỏ tới một tài khoản JUDGE đang hoạt động. Khi được cấu hình, người xem có thể nhập trực tiếp mã do người vận hành chọn (12–100 ký tự). Mã không nằm trong frontend hoặc Git; SQL chỉ lưu salt và hash scrypt. Giá trị thực nằm trong tệp JSON riêng tư của người vận hành. ADMIN tiếp tục dùng mã riêng.

Lệnh `pnpm access:change-judge` nhận mã qua stdin, cập nhật tài khoản trong `data/judge-access.json` và `.env`. Thêm `--cloud` để cập nhật tài khoản trong `data/cloud-judge-access.json` và `data/cloud.env`. Không truyền mã qua tham số CLI, README hoặc URL. Sau đó đồng bộ riêng `JUDGE_DEFAULT_ACCOUNT_ID` sang Railway Variables và triển khai/restart. Lệnh không in mã và không gia hạn tài khoản; nếu đã hết hạn, cấp tài khoản mới theo hướng dẫn bên dưới.

Đổi mã xóa các phiên của tài khoản, mã ngẫu nhiên cũ không còn hợp lệ. Mọi người dùng mã mặc định được ghi nhận dưới cùng tài khoản JUDGE; cấp mã riêng nếu cần phân biệt từng người chấm. Giới hạn thử sai, CSRF, cookie và thời hạn phiên vẫn được áp dụng.

### Tài khoản riêng

Chạy trong thư mục dự án với Node 24 trở lên:

```powershell
node scripts/create-access.mjs --name "Giám khảo 01" --role JUDGE --days 7 --out data/judge-01.json
node scripts/create-access.mjs --name "Người vận hành" --role ADMIN --days 7 --out data/operator-01.json
```

Tên chỉ dùng để nhận diện; chọn tên thực khi cấp mã. Mỗi lệnh tạo tài khoản riêng, mã ngẫu nhiên và tệp JSON; không in mã vào log. Không ghi đè tệp đã tồn tại. Thời hạn được chọn từ 1–30 ngày. Dùng Node đi kèm Codex nếu máy hiện tại chưa có `node` trong PATH:

```powershell
& "$env:USERPROFILE\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" scripts/create-access.mjs --name "Giám khảo 02" --out data/judge-02.json
```

Thu hồi bằng **account_id** trong tệp JSON (không dùng access_code):

```powershell
node scripts/revoke-access.mjs ACCOUNT_ID
```

Lệnh vô hiệu hóa tài khoản và xóa mọi phiên của tài khoản đó. Cấp mã mới bằng một tệp khác nếu cần truy cập lại. Tránh dùng một mã chung cho nhiều giám khảo vì nhật ký chỉ nhận diện tài khoản.

## Bổ sung tài liệu thực tế

Hiện hồ sơ có bản giới thiệu phạm vi dự án ở trạng thái nháp. Chưa có COA, SOP được phê duyệt, bảng COGS hoặc kết quả thí nghiệm thực tế do nhóm cung cấp. Dữ liệu trong ảnh `judge-portal-test.png` là kiểm thử trong bộ nhớ, không phải số liệu dự án.

```powershell
node scripts/add-document.mjs --file "C:\duong-dan\COA.pdf" --title "Phiếu kiểm nghiệm lô mẫu 01" --type COA --status FINAL
node scripts/add-document.mjs --file "C:\duong-dan\SOP.docx" --title "Quy trình thử nghiệm" --type SOP --status DRAFT
```

Loại hồ sơ: `BRIEF`, `SOP`, `COGS`, `COA`, `MEDIA`, `REPORT`. Tệp: PDF, TXT, CSV, DOCX, XLSX, PNG, JPG, WEBP, MP4; tối đa 50 MB. Tệp được sao chép vào `data/dossier/` bằng tên UUID, có SHA-256 và kích thước đối chiếu trước khi tải. Trùng nội dung không tạo bản sao. `FINAL` là nhãn do người vận hành chọn, không xác nhận chứng nhận hợp lệ. Chỉ thêm tài liệu đã được phép cung cấp cho giám khảo. Tải file thay vì nhúng để tránh thực thi nội dung tài liệu trong trang.

## Jev tùy chọn

Trong `.env`, đặt:

```dotenv
JEV_ENABLED=true
JEV_API_KEY=DIEN_KEY_JEVAI_TREN_MAY
JEV_MODEL=typesafe-ai/jev
```

Khởi động lại server. Khi chưa có key, giữ `JEV_ENABLED=false`. Không đưa key vào frontend, URL hoặc chat. Runtime chỉ gọi JevAI Community www.jevai.org với key từ /agent/keys; thử thật đang bị từ chối credentials/model access, dùng kết quả dự phòng.

Jev phân loại **một góp ý được người xem chủ động nhập và đồng ý gửi** thành màu sắc, mùi thơm, umami, hậu vị, ưa thích chung hoặc khác. Server loại chuỗi email/số điện thoại theo mẫu trước khi gửi; người dùng vẫn cần bỏ thông tin cá nhân và bí mật khỏi đoạn góp ý vì bộ lọc không nhận diện mọi dạng. Không gửi toàn bộ database, tài liệu, liên hệ hoặc điểm cá nhân. Kiểm tra loại `choice`, nhãn, xác suất, tổng xác suất và confidence. Khi lỗi, trả trạng thái tự phân loại. Confidence là độ tin cậy mô hình, không phải mức tin cậy thống kê hoặc kiểm chứng cho dữ liệu tiếng Việt.

Mean/Median/SD, quyền truy cập và xác thực được tính/kiểm tra bằng code. Jev không quyết định điểm hoặc quyền. Tài liệu triển khai: [TypeSafe API](https://docs.typesafe.ai/api), [Choice primitive](https://docs.typesafe.ai/primitives/choice), đối chiếu bản tài liệu người dùng cung cấp trong `../docs/typesafe-ai/` của workspace.

API Jev giới hạn yêu cầu theo IP sau đăng nhập, dùng `CHAT_REQUESTS_PER_MINUTE`. Phản hồi tối đa 64 KiB, thời gian chờ bao gồm nhận/đọc body; chặn redirect. Lỗi 429/529 chỉ retry một lần trong deadline còn lại. Khi hết hạn hoặc phản hồi không hợp lệ, giao diện dùng chế độ tự phân loại.

## Bảo vệ và phạm vi vận hành

- Mã truy cập được băm bằng scrypt có salt; database chỉ lưu hash mã và hash token phiên. Token ngẫu nhiên được lưu bằng cookie `HttpOnly`, `SameSite=Strict`; không dùng localStorage.
- API thay đổi dữ liệu bằng cookie yêu cầu `X-CSRF-Token`; server kiểm tra host, origin, JSON, kích thước và tần suất đăng nhập. CSP chặn script ngoài, iframe và object. Nội dung hồ sơ/API không cache.
- Nhật ký `access_audit` ghi đăng nhập thành công/thất bại, đăng xuất, thu hồi và tải tài liệu; không ghi mã hoặc đoạn góp ý. Không phải hệ thống giám sát đầy đủ cho triển khai công cộng.
- Máy chủ chỉ bind `127.0.0.1`. Địa chỉ này dùng trên máy đang chạy, không cho giám khảo ở máy khác truy cập. Bản HTTP local không đặt cookie `Secure`; nếu triển khai qua mạng phải thiết kế HTTPS, cookie Secure, quản lý tài khoản/khóa và giới hạn theo người dùng trước. Xem [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html).
- Người có quyền đọc tệp Windows trên máy vẫn có thể đọc `.env`, JSON mã truy cập và SQLite. Tệp không được mã hóa trên ổ đĩa bởi ứng dụng. Sao lưu thư mục `data/` và `.env` ở nơi riêng tư sau khi dừng server.

Biến: `AUTH_SESSION_MINUTES=120` (15–480), `AUTH_IDLE_MINUTES=20` (5–120), `AUTH_LOGIN_LIMIT=8` (3–20 lần sai trong 10 phút/IP). Mã sai trả thông báo chung; giới hạn đăng nhập lưu trong bộ nhớ và đặt lại khi khởi động.

## Xác minh bản 1.4.2

37 bài kiểm tra logic/API đã đạt: migration SQLite/PostgreSQL, dữ liệu cảm quan, đăng ký, cookie/CSRF, quyền JUDGE/ADMIN, xoay phiên, hết hạn/idle, thu hồi, giới hạn mã sai, file riêng tư, minh chứng mẫu đo và provider mock. Đã thử UI đăng nhập/đăng xuất, radar/bảng, nhận xét và gửi hai form, gồm khóa thao tác khi yêu cầu chậm và tạo phiếu mới giữ mã QR; dữ liệu UI dùng server bộ nhớ tại cổng 8767. Server thật ở 8766 không chứa các phiếu kiểm thử đó. Kết nối Jev thật cần key và đánh giá chất lượng phân loại riêng.
