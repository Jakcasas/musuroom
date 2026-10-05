# Đối chiếu upgrade.docx với Musuroom 1.8.0

Ngày cập nhật: 05.10.2026. Người dùng xác nhận chưa có tài liệu TCVN, hồ sơ hũ mẫu hoặc tiêu chí chấm FID chính thức; bản này cung cấp chức năng nhập, không nạp dữ liệu minh họa vào production.

| Yêu cầu | Phần được triển khai | Giới hạn / dữ liệu còn cần |
|---|---|---|
| GitHub Makeover | README có badges, Mermaid, bảng phân hệ và biến môi trường; MIT, NOTICE, CONTRIBUTING, issue và PR templates; banner 1280×640 | Social Preview cần chủ repository chọn ảnh trong Settings nếu API không hỗ trợ |
| Hạ tầng và dữ liệu | Zod kiểm tra đầu vào khảo sát/đăng ký, kiểm tra cấu trúc hồ sơ mới; circuit breaker Jev; Docker Compose local | Máy hiện tại chưa có Docker để xác minh build/run |
| Atlas trên Railway | Chẩn đoán kết nối từ chính server qua API ADMIN, mã lỗi lọc; SQL tiếp tục là dữ liệu gốc | Cloud đã kiểm tra: lỗi TLS nội bộ từ Atlas; cần đối chiếu Network Access/đường ra Railway. Giữ kiểm chứng TLS. |
| Radar cảm quan | 5 trục, chọn bằng chuột/bàn phím, số liệu trong bảng | Kết quả thực chỉ xuất hiện khi có phiếu hợp lệ |
| Offline PWA | Cache trang khảo sát/tri thức công khai và tài nguyên cần thiết; lưu một phiếu khi đã đồng ý, giữ UUID gửi lại | Phải mở trang online ít nhất một lần; không cache API riêng tư, không lưu đăng ký liên hệ; không cam kết ngoại tuyến 100% |
| Báo cáo PDF | Nút In báo cáo / Lưu PDF tạo bản A4 từ thống kê đang xem | Người dùng chọn Save as PDF trong hộp in trình duyệt; không phải dịch vụ PDF phía server |
| RAG và TCVN | Nhập điều khoản, phiên bản, trích dẫn, URL, trích đoạn có quyền sử dụng; nguồn đã công bố tham gia truy xuất của trợ lý | Chưa có TCVN thật; Jev MCP thử ngày 05.10 vẫn trả jev_auth_failed; cần key/quyền model hợp lệ. |
| pgvector | Extension và bảng riêng tư; API ADMIN nhập/query vector 384 chiều theo model và revision | Không tự sinh embedding; cần nạp vector từ cùng model đã chọn. Chat công khai hiện dùng từ khóa và tùy chọn Jev reranking |
| Cảm xúc góp ý | Tổng hợp từ khóa tích cực/cần cải thiện/hỗn hợp/chưa rõ, tối đa 1.000 góp ý gần nhất của đợt/mẫu | Không gửi nhận xét thô đến provider; đây không phải phân tích cảm xúc đã hiệu chuẩn |
| QR từng hũ | Hồ sơ nội bộ/công bố, QR SVG dẫn đến dữ liệu hiện tại, revision và minh chứng | Nội dung do dự án cung cấp; QR không chứng thực chuỗi cung ứng |
| Chấm điểm | Bộ tiêu chí dự thảo, trọng số tổng 100%, điểm 0–10, tổng /100, một phiếu mỗi giám khảo/mẫu/bộ tiêu chí | Không có bộ tiêu chí FID chính thức. Bộ đã tạo bất biến; thay đổi tạo phiên bản mới |
| Pitching Mode | 5 phần định hướng nghiên cứu, liên kết nguồn, bàn phím và toàn màn hình | Không đưa số liệu hay chứng nhận chưa có minh chứng |

## Vận hành hồ sơ và chấm điểm

1. Đăng nhập cổng giám khảo rồi mở **Hồ sơ & chấm điểm**. ADMIN tạo hồ sơ mẫu, mã hũ, mã lô, nguồn và ghi chép quy trình. Có thể chọn tài liệu đã được tải vào hồ sơ bằng mã tài liệu; không công bố nội dung file riêng tư.
2. Chỉ đánh dấu **Công bố** khi thông tin sẵn sàng chia sẻ. QR là liên kết ngẫu nhiên đến hồ sơ công khai; chỉnh hồ sơ giữ nguyên QR. Bỏ công bố làm liên kết trả 404. Cặp mã mẫu/mã hũ không trùng nhau.
3. Tạo bộ tiêu chí với tổng trọng số 100%. Giao diện hỗ trợ tối đa 5 tiêu chí, API tối đa 10; không có tiêu chí giả được tạo mặc định.
4. Giám khảo chọn mẫu và bộ tiêu chí, nhập điểm 0–10. Điểm tổng = tổng(điểm × trọng số / 10), làm tròn hai chữ số. Dashboard hiển thị trung bình /100 và số người chấm. Các phiên cập nhật cũ trả 409 thay vì ghi đè.
5. Hồ sơ mẫu có revision. Điểm giữ `sample_revision` tại lúc chấm; nếu thay đổi thông tin mẫu, cần đối chiếu lại các đánh giá trước đó.

## Ngoại tuyến và dữ liệu trên thiết bị

Service worker chỉ cache danh sách tài nguyên công khai được chỉ định. Trang đăng nhập, báo cáo, hồ sơ mẫu, API, cookie và dữ liệu giám khảo không nằm trong cache. Khi mở QR lần đầu mà chưa có mạng, chưa thể tải ứng dụng.

Người thử chọn ô lưu trên máy trước khi gửi. Phiếu được giữ với cùng submission key nếu chưa xác nhận gửi thành công; quay lại trang sẽ phục hồi để người thử chủ động gửi lại. Chỉ nhận một phiếu cho cùng khóa. Một bản lưu cục bộ tối đa 16.000 ký tự; bản quá 7 ngày bị bỏ khi đọc lại. Không lưu tên/liên hệ đăng ký. Thiết bị dùng chung cần xóa phiếu sau khi sử dụng.

## pgvector và nguồn có điều khoản

Nhập điều khoản ở mục quản trị, ghi phiên bản và quyền sử dụng. Chỉ trích đoạn công bố mới được trả ở API công khai hoặc trợ lý. Nguồn thiếu dữ liệu không sinh ra kết luận TCVN.

API vector dành cho ADMIN + CSRF. Nạp `{record_id, source_revision, model, embedding}` vào `/api/v1/admin/vectors/import`; `embedding` gồm 384 số hữu hạn, không phải vector toàn 0. Tìm bằng `/api/v1/admin/vectors/search` với `{model, embedding}`. Kết quả chỉ dùng điều khoản công bố, cùng model và đúng revision; đổi nguồn làm vector cũ bị loại. Không tải model hoặc gửi tài liệu sang provider mới tự động. Đây là nền tảng lưu/tìm vector; chưa có benchmark hay vector thật trong production.

## Circuit breaker và Atlas

Jev mở circuit sau ba lỗi liên tiếp, hoặc ngay khi key/quyền bị từ chối. Nghỉ 30–120 giây cho lỗi dịch vụ, 300 giây cho lỗi xác thực; sau đó cho một yêu cầu thăm dò. Thành công đóng circuit. Giới hạn chia sẻ trong một tiến trình, không phải quota toàn hệ thống nhiều replica.

ADMIN gọi `POST /api/v1/admin/research/diagnostics/atlas` với `{}` và CSRF để kiểm tra từ Railway (tối đa 2 lần/phút). Chỉ trả trạng thái/mã lỗi cho phép, không trả URI/password. Nếu local kết nối được nhưng Railway không được: kiểm tra Atlas Network Access với địa chỉ outbound thực của dịch vụ. Railway static outbound IP tùy thuộc gói; không tự nâng gói. Khi có IP cố định được phép, thêm đúng IP/CIDR hẹp rồi chạy chẩn đoán và sync lại. Không dùng `0.0.0.0/0` hoặc tắt kiểm chứng TLS làm cách sửa mặc định.

## Chỉ số cần đo

| KPI trong đề xuất | Cách đo | Trạng thái |
|---|---|---|
| Uptime 99,9% | Theo dõi health từ bên ngoài liên tục trong cửa sổ 30 ngày | Mục tiêu, chưa có chuỗi đo đủ dài |
| Ngoại tuyến 100% | Ma trận thiết bị/trình duyệt và từng luồng | Không dùng tuyên bố 100%; chỉ luồng công khai đã cache |
| Radar tương tác | So sánh bảng/điểm đồ thị; dùng bàn phím | Đã có chức năng và kiểm thử giao diện |
| Chứng thực chuỗi cung ứng | Hồ sơ nguồn, người xác nhận, minh chứng độc lập | Chưa có minh chứng; hiện là thông tin truy xuất do dự án nhập |
| Chất lượng AI | Bộ câu hỏi chuẩn, đối chiếu nguồn, tỷ lệ đúng | Chưa có bộ đánh giá chuẩn hoặc inference Jev hợp lệ |

## Nguồn kỹ thuật

- [Supabase pgvector](https://supabase.com/docs/guides/database/extensions/pgvector).
- [Railway static outbound IP](https://docs.railway.com/guides/static-outbound-ips).
- [JevAI MCP](https://www.jevai.org/mcp).

Social Preview: dùng `docs/social-preview.png` (1280×640) trong GitHub Settings → General → Social preview. Giữ banner không có key, QR truy cập riêng hoặc dữ liệu người thử. Topics đề xuất: `food-waste`, `mushroom`, `sensory-analysis`, `express`, `supabase`, `mongodb`, `jevai`, `pwa`, `vietnamese`.

## Kiểm chứng bản phát hành

63/63 kiểm thử đạt; cú pháp 100 file và 138 liên kết nội bộ hợp lệ; audit production không có lỗ hổng đã biết. Đã kiểm tra UI tạo hũ/rubric/chấm điểm bằng dữ liệu trong bộ nhớ, truy xuất và offline lưu/phục hồi/gửi lại. Cloud xác minh phiên ADMIN, chặn anonymous, pgvector query và PostgreSQL health. Docker chưa chạy trên máy này; hộp lưu PDF và khả năng cài PWA cần đối chiếu thêm trên các trình duyệt/thiết bị sử dụng thực tế.
